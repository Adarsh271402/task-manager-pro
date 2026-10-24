using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TaskManagerPro.Api.Data;
using TaskManagerPro.Api.DTOs;
using TaskManagerPro.Api.Entities;
using TaskManagerPro.Api.Hubs;
using TaskManagerPro.Api.Services;

namespace TaskManagerPro.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private static readonly string[] ValidRoles = { "Admin", "Manager", "Member" };
    private readonly AppDbContext _db;
    private readonly IHubContext<TaskHub> _hub;

    public UsersController(AppDbContext db, IHubContext<TaskHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    /// <summary>All users with task workload stats.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserWithStatsDto>>> GetUsers()
    {
        var donePos = await _db.BoardColumns.MaxAsync(c => (int?)c.Position) ?? -1;

        var users = await _db.Users
            .Include(u => u.AssignedTasks)
            .ThenInclude(t => t.BoardColumn)
            .ToListAsync();

        var result = users
            .Select(u => new UserWithStatsDto(
                u.Id, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt,
                u.AssignedTasks.Count(t => t.BoardColumn.Position != donePos),
                u.AssignedTasks.Count))
            .OrderBy(u => u.FullName)
            .ToList();

        return Ok(result);
    }

    /// <summary>Change a user's role.</summary>
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, UpdateRoleDto dto)
    {
        if (!ValidRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Role must be one of: {string.Join(", ", ValidRoles)}." });

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var currentId = int.Parse(User.FindValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
        if (user.Id == currentId && dto.Role != "Admin")
            return BadRequest(new { message = "You cannot remove your own Admin role." });

        user.Role = dto.Role;
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("user:changed", new { user.Id, user.FullName, user.Email, user.Role, user.IsActive });
        return NoContent();
    }

    /// <summary>Activate or deactivate a user account.</summary>
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateStatusDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var currentId = int.Parse(User.FindValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
        if (user.Id == currentId && !dto.IsActive)
            return BadRequest(new { message = "You cannot deactivate your own account." });

        user.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("user:changed", new { user.Id, user.FullName, user.Email, user.Role, user.IsActive });
        return NoContent();
    }

    /// <summary>Delete a user (their assigned tasks become unassigned).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var currentId = int.Parse(User.FindValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
        if (user.Id == currentId)
            return BadRequest(new { message = "You cannot delete your own account." });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("user:changed", new { id, deleted = true });
        return NoContent();
    }
}
