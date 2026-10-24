namespace TaskManagerPro.Api.Entities;

/// <summary>A Kanban board column (e.g. Week 1, Week 2, Week 3, Week 4).</summary>
public class BoardColumn
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Color { get; set; } = "#8b5cf6";

    /// <summary>Ordering on the board (lower = further left).</summary>
    public int Position { get; set; }

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
