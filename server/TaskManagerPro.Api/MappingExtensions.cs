using System.Security.Claims;
using TaskManagerPro.Api.DTOs;
using TaskManagerPro.Api.Entities;

namespace TaskManagerPro.Api;

public static class MappingExtensions
{
    public static string? FindValue(this ClaimsPrincipal principal, string claimType) =>
        principal.FindFirst(claimType)?.Value;

    public static UserDto ToDto(this User u) =>
        new(u.Id, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt);

    public static TaskDto ToDto(this TaskItem t) =>
        new(
            t.Id,
            t.Title,
            t.Description,
            t.Priority,
            t.BoardColumnId,
            t.BoardColumn.Name,
            t.Position,
            t.AssigneeId,
            t.Assignee?.FullName,
            t.CreatorId,
            t.DueDate?.ToString("yyyy-MM-dd"),
            t.CreatedAt,
            t.UpdatedAt);
}
