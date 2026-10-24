using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TaskManagerPro.Api.Data;
using TaskManagerPro.Api.DTOs;
using TaskManagerPro.Api.Entities;
using TaskManagerPro.Api.Hubs;

namespace TaskManagerPro.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private static readonly string[] ValidPriorities = { "Low", "Medium", "High", "Urgent" };
    private readonly AppDbContext _db;
    private readonly IHubContext<TaskHub> _hub;

    public TasksController(AppDbContext db, IHubContext<TaskHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    private string Actor => User.FindValue(System.Security.Claims.ClaimTypes.Name) ?? "Someone";
    private int CurrentUserId => int.Parse(User.FindValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
    private bool IsAdminOrManager => User.IsInRole("Admin") || User.IsInRole("Manager");

    /// <summary>All tasks with column + assignee info, board-ordered.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks()
    {
        var tasks = await QueryTasks().ToListAsync();
        return Ok(tasks.Select(t => t.ToDto()));
    }

    /// <summary>Create a task (Admin/Manager only).</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskDto dto)
    {
        if (!ValidPriorities.Contains(dto.Priority))
            return BadRequest(new { message = $"Priority must be one of: {string.Join(", ", ValidPriorities)}." });

        var column = await _db.BoardColumns.FindAsync(dto.BoardColumnId);
        if (column is null) return BadRequest(new { message = "Invalid board column." });

        if (dto.AssigneeId is not null && !await _db.Users.AnyAsync(u => u.Id == dto.AssigneeId))
            return BadRequest(new { message = "Invalid assignee." });

        var position = await _db.Tasks.CountAsync(t => t.BoardColumnId == dto.BoardColumnId);

        var task = new TaskItem
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            Priority = dto.Priority,
            BoardColumnId = dto.BoardColumnId,
            Position = position,
            AssigneeId = dto.AssigneeId,
            CreatorId = CurrentUserId,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        await _db.Entry(task).Reference(t => t.BoardColumn).LoadAsync();
        await _db.Entry(task).Reference(t => t.Assignee).LoadAsync();

        var taskDto = task.ToDto();
        await _hub.Clients.All.SendAsync("task:created", new TaskEventDto("created", Actor, taskDto));
        return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, taskDto);
    }

    /// <summary>Edit a task. Members may only edit tasks assigned to them.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTask(int id, UpdateTaskDto dto)
    {
        if (!ValidPriorities.Contains(dto.Priority))
            return BadRequest(new { message = $"Priority must be one of: {string.Join(", ", ValidPriorities)}." });

        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return NotFound();

        if (!IsAdminOrManager && task.AssigneeId != CurrentUserId)
            return Forbid();

        if (!await _db.BoardColumns.AnyAsync(c => c.Id == dto.BoardColumnId))
            return BadRequest(new { message = "Invalid board column." });

        if (dto.AssigneeId is not null && !await _db.Users.AnyAsync(u => u.Id == dto.AssigneeId))
            return BadRequest(new { message = "Invalid assignee." });

        var columnChanged = task.BoardColumnId != dto.BoardColumnId;
        var oldColumnId = task.BoardColumnId;

        task.Title = dto.Title.Trim();
        task.Description = dto.Description?.Trim();
        task.Priority = dto.Priority;
        task.AssigneeId = dto.AssigneeId;
        task.DueDate = dto.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        if (columnChanged)
        {
            await RepackAsync(oldColumnId, task.Position, removed: true);
            task.BoardColumnId = dto.BoardColumnId;
            task.Position = await _db.Tasks.CountAsync(t => t.BoardColumnId == dto.BoardColumnId && t.Id != id);
        }

        await _db.SaveChangesAsync();
        await _db.Entry(task).Reference(t => t.BoardColumn).LoadAsync();
        await _db.Entry(task).Reference(t => t.Assignee).LoadAsync();

        var taskDto = task.ToDto();
        if (columnChanged)
            await BroadcastBoardAsync("moved", Actor);
        else
            await _hub.Clients.All.SendAsync("task:updated", new TaskEventDto("updated", Actor, taskDto));

        return Ok(taskDto);
    }

    /// <summary>Delete a task (Admin/Manager only).</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return NotFound();

        await RepackAsync(task.BoardColumnId, task.Position, removed: true);
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("task:deleted", new { id, actor = Actor });
        return NoContent();
    }

    /// <summary>
    /// Move a task to a column at a given index. Members may only move tasks assigned to them.
    /// Broadcasts the full board so every client stays in sync.
    /// </summary>
    [HttpPut("{id:int}/move")]
    public async Task<IActionResult> MoveTask(int id, MoveTaskDto dto)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return NotFound();

        if (!IsAdminOrManager && task.AssigneeId != CurrentUserId)
            return Forbid();

        if (!await _db.BoardColumns.AnyAsync(c => c.Id == dto.ColumnId))
            return BadRequest(new { message = "Invalid board column." });

        var oldColumnId = task.BoardColumnId;
        if (oldColumnId != dto.ColumnId)
        {
            await RepackAsync(oldColumnId, task.Position, removed: true);
            task.BoardColumnId = dto.ColumnId;
        }
        else
        {
            await RepackAsync(oldColumnId, task.Position, removed: true);
        }

        task.Position = Math.Max(0, dto.Position);
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await RepackAsync(task.BoardColumnId, clampOnly: true);

        await BroadcastBoardAsync("moved", Actor);
        return NoContent();
    }

    // ---- helpers -------------------------------------------------------

    private IQueryable<TaskItem> QueryTasks() =>
        _db.Tasks
            .Include(t => t.BoardColumn)
            .Include(t => t.Assignee)
            .OrderBy(t => t.BoardColumn.Position).ThenBy(t => t.Position);

    private async Task BroadcastBoardAsync(string action, string actor)
    {
        var tasks = await QueryTasks().ToListAsync();
        await _hub.Clients.All.SendAsync("board:sync", new BoardSyncDto(action, actor, tasks.Select(t => t.ToDto())));
    }

    /// <summary>Re-pack positions in a column after removal, or clamp all to be contiguous.</summary>
    private async Task RepackAsync(int columnId, int removedPosition = -1, bool removed = false, bool clampOnly = false)
    {
        var tasks = await _db.Tasks
            .Where(t => t.BoardColumnId == columnId)
            .OrderBy(t => t.Position)
            .ToListAsync();

        if (removed) tasks.RemoveAll(t => t.Position == removedPosition);

        for (var i = 0; i < tasks.Count; i++)
        {
            if (clampOnly && tasks[i].Position == i) continue;
            tasks[i].Position = i;
        }
    }
}
