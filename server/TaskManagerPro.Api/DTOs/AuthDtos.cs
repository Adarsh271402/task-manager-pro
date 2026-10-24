using System.ComponentModel.DataAnnotations;

namespace TaskManagerPro.Api.DTOs;

public record RegisterDto(
    [Required, MinLength(2), MaxLength(100)] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6), MaxLength(100)] string Password);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponseDto(string Token, UserDto User);

public record UserDto(int Id, string FullName, string Email, string Role, bool IsActive, DateTime CreatedAt);

public record UserWithStatsDto(int Id, string FullName, string Email, string Role, bool IsActive, DateTime CreatedAt, int OpenTasks, int TotalTasks);

public record UpdateRoleDto([Required] string Role);

public record UpdateStatusDto([Required] bool IsActive);
