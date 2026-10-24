using System.ComponentModel.DataAnnotations;

namespace TaskManagerPro.Api.DTOs;

public record ColumnDto(int Id, string Name, string Color, int Position, int TaskCount);

public record CreateColumnDto(
    [Required, MaxLength(50)] string Name,
    [MaxLength(20)] string Color);

public record UpdateColumnDto(
    [Required, MaxLength(50)] string Name,
    [MaxLength(20)] string Color);
