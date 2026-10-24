using System.ComponentModel.DataAnnotations;

namespace TaskManagerPro.Api.DTOs;

public record TaskDto(
    int Id,
    string Title,
    string? Description,
    string Priority,
    int BoardColumnId,
    string BoardColumnName,
    int Position,
    int? AssigneeId,
    string? AssigneeName,
    int CreatorId,
    string? DueDate,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CreateTaskDto(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    [Required] string Priority,
    [Required] int BoardColumnId,
    int? AssigneeId,
    DateTime? DueDate);

public record UpdateTaskDto(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    [Required] string Priority,
    [Required] int BoardColumnId,
    int? AssigneeId,
    DateTime? DueDate);

public record MoveTaskDto([Required] int ColumnId, [Required] int Position);

public record TaskEventDto(string Action, string Actor, TaskDto Task);

public record BoardSyncDto(string Action, string Actor, IEnumerable<TaskDto> Tasks);
