namespace TaskManagerPro.Api.Entities;

/// <summary>Application user. Roles: Admin, Manager, Member.</summary>
public class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>"Admin" | "Manager" | "Member"</summary>
    public string Role { get; set; } = "Member";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
}
