namespace TaskManagerPro.Api.DTOs;

public record PerColumnStat(int ColumnId, string Name, string Color, int Count);

public record PerPriorityStat(string Priority, int Count);

public record PerUserStat(int UserId, string FullName, string Role, int OpenTasks, int OverdueTasks);

public record UpcomingTaskDto(int Id, string Title, string Priority, string? AssigneeName, string? DueDate, string ColumnName);

public record DashboardStatsDto(
    int TotalTasks,
    int CompletedTasks,
    int OpenTasks,
    int OverdueTasks,
    double CompletionRate,
    IEnumerable<PerColumnStat> PerColumn,
    IEnumerable<PerPriorityStat> PerPriority,
    IEnumerable<PerUserStat> PerUser,
    IEnumerable<UpcomingTaskDto> Upcoming);
