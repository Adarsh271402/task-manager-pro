namespace TaskManagerPro.Api.Entities;

/// <summary>A task card on the Kanban board.</summary>
public class TaskItem
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>"Low" | "Medium" | "High" | "Urgent"</summary>
    public string Priority { get; set; } = "Medium";

    public int BoardColumnId { get; set; }

    public BoardColumn BoardColumn { get; set; } = null!;

    /// <summary>Ordering within the column (lower = higher on the board).</summary>
    public int Position { get; set; }

    public int? AssigneeId { get; set; }

    public User? Assignee { get; set; }

    public int CreatorId { get; set; }

    public User Creator { get; set; } = null!;

    public DateTime? DueDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
