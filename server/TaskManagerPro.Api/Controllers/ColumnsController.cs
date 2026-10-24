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
[Route("api/columns")]
[Authorize]
public class ColumnsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<TaskHub> _hub;

    public ColumnsController(AppDbContext db, IHubContext<TaskHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ColumnDto>>> GetColumns()
    {
        var columns = await _db.BoardColumns
            .OrderBy(c => c.Position)
            .Select(c => new ColumnDto(c.Id, c.Name, c.Color, c.Position, c.Tasks.Count))
            .ToListAsync();
        return Ok(columns);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ColumnDto>> CreateColumn(CreateColumnDto dto)
    {
        var maxPos = await _db.BoardColumns.AnyAsync()
            ? await _db.BoardColumns.MaxAsync(c => c.Position)
            : -1;

        var column = new BoardColumn
        {
            Name = dto.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "#8b5cf6" : dto.Color.Trim(),
            Position = maxPos + 1
        };

        _db.BoardColumns.Add(column);
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("column:changed", new { action = "created" });
        return CreatedAtAction(nameof(GetColumns), ToDto(column, 0));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UpdateColumn(int id, UpdateColumnDto dto)
    {
        var column = await _db.BoardColumns.FindAsync(id);
        if (column is null) return NotFound();

        column.Name = dto.Name.Trim();
        column.Color = string.IsNullOrWhiteSpace(dto.Color) ? column.Color : dto.Color.Trim();
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("column:changed", new { action = "updated" });
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteColumn(int id)
    {
        var column = await _db.BoardColumns.Include(c => c.Tasks).FirstOrDefaultAsync(c => c.Id == id);
        if (column is null) return NotFound();

        if (column.Tasks.Count != 0)
            return Conflict(new { message = "This column still contains tasks. Move them first." });

        if (await _db.BoardColumns.CountAsync() <= 1)
            return BadRequest(new { message = "The board must keep at least one column." });

        _db.BoardColumns.Remove(column);

        // Re-pack positions so they stay contiguous & unique.
        var remaining = await _db.BoardColumns.OrderBy(c => c.Position).ToListAsync();
        for (var i = 0; i < remaining.Count; i++) remaining[i].Position = i;

        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("column:changed", new { action = "deleted" });
        return NoContent();
    }

    private static ColumnDto ToDto(BoardColumn c, int count) => new(c.Id, c.Name, c.Color, c.Position, count);
}
