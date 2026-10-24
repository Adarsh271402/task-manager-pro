using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagerPro.Api.Data;
using TaskManagerPro.Api.DTOs;

namespace TaskManagerPro.Api.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StatsController(AppDbContext db) => _db = db;

    /// <summary>Aggregated dashboard metrics.</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboard()
    {
        var donePos = await _db.BoardColumns.MaxAsync(c => (int?)c.Position) ?? -1;

        var tasks = await _db.Tasks
            .Include(t => t.BoardColumn)
            .Include(t => t.Assignee)
            .ToListAsync();

        var columns = await _db.BoardColumns.OrderBy(c => c.Position).ToListAsync();

        var total = tasks.Count;
        var completed = tasks.Count(t => t.BoardColumn.Position == donePos);
        var now = DateTime.UtcNow.Date;
        var overdue = tasks.Count(t => t.BoardColumn.Position != donePos && t.DueDate.HasValue && t.DueDate.Value.Date < now);
        var dueSoon = tasks
            .Where(t => t.BoardColumn.Position != donePos && t.DueDate.HasValue
                        && t.DueDate.Value.Date >= now && t.DueDate.Value.Date <= now.AddDays(7))
            .OrderBy(t => t.DueDate)
            .Take(6)
            .Select(t => new UpcomingTaskDto(
                t.Id, t.Title, t.Priority, t.Assignee?.FullName,
                t.DueDate?.ToString("yyyy-MM-dd"), t.BoardColumn.Name))
            .ToList();

        var perColumn = columns.Select(c => new PerColumnStat(c.Id, c.Name, c.Color, tasks.Count(t => t.BoardColumnId == c.Id)));

        var perPriority = new[] { "Urgent", "High", "Medium", "Low" }
            .Select(p => new PerPriorityStat(p, tasks.Count(t => t.Priority == p)))
            .Where(p => p.Count > 0);

        var usersData = await _db.Users
            .Include(u => u.AssignedTasks)
            .ThenInclude(t => t.BoardColumn)
            .ToListAsync();

        var perUser = usersData
            .Select(u => new PerUserStat(
                u.Id, u.FullName, u.Role,
                u.AssignedTasks.Count(t => t.BoardColumn.Position != donePos),
                u.AssignedTasks.Count(t => t.BoardColumn.Position != donePos
                    && t.DueDate.HasValue && t.DueDate.Value.Date < now)))
            .Where(u => u.OpenTasks > 0 || u.OverdueTasks > 0)
            .OrderByDescending(u => u.OpenTasks)
            .ToList();

        var rate = total == 0 ? 0 : Math.Round(completed * 100.0 / total, 1);

        return Ok(new DashboardStatsDto(
            total, completed, total - completed, overdue, rate,
            perColumn, perPriority, perUser, dueSoon));
    }
}
