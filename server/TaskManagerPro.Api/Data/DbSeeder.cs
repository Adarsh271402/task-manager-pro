using Microsoft.EntityFrameworkCore;
using TaskManagerPro.Api.Entities;
using TaskManagerPro.Api.Services;

namespace TaskManagerPro.Api.Data;

/// <summary>
/// Seeds demo data (users, board columns, tasks) the first time the database is used.
/// Idempotent: each section only seeds when its table is empty.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration configuration)
    {
        if (!configuration.GetValue("Seed:DemoData", true))
        {
            if (!await db.Users.AnyAsync())
            {
                var password = configuration["Bootstrap:AdminPassword"];
                if (string.IsNullOrWhiteSpace(password) || password.Length < 12)
                    throw new InvalidOperationException("Bootstrap:AdminPassword must contain at least 12 characters.");
                db.Users.Add(new User
                {
                    FullName = "Administrator",
                    Email = (configuration["Bootstrap:AdminEmail"] ?? "admin@taskmanager.pro").Trim().ToLowerInvariant(),
                    PasswordHash = PasswordHasher.Hash(password), Role = "Admin", IsActive = true
                });
                await db.SaveChangesAsync();
            }
            if (!await db.BoardColumns.AnyAsync())
            {
                db.BoardColumns.AddRange(
                    new BoardColumn { Name = "To Do", Color = "#6366f1", Position = 0 },
                    new BoardColumn { Name = "In Progress", Color = "#a855f7", Position = 1 },
                    new BoardColumn { Name = "Done", Color = "#22c55e", Position = 2 });
                await db.SaveChangesAsync();
            }
            return;
        }

        // ---- users ---------------------------------------------------------
        if (!await db.Users.AnyAsync())
        {
            db.Users.AddRange(
                new User
                {
                    FullName = "Alex Morgan", Email = "admin@taskmanager.pro",
                    PasswordHash = PasswordHasher.Hash("Admin@123"),
                    Role = "Admin", IsActive = true
                },
                new User
                {
                    FullName = "Priya Sharma", Email = "manager@taskmanager.pro",
                    PasswordHash = PasswordHasher.Hash("Manager@123"),
                    Role = "Manager", IsActive = true
                },
                new User
                {
                    FullName = "Sam Lee", Email = "member@taskmanager.pro",
                    PasswordHash = PasswordHasher.Hash("Member@123"),
                    Role = "Member", IsActive = true
                },
                new User
                {
                    FullName = "Jordan Diaz", Email = "jordan@taskmanager.pro",
                    PasswordHash = PasswordHasher.Hash("Member@123"),
                    Role = "Member", IsActive = true
                });
            await db.SaveChangesAsync();
        }

        // ---- board columns ---------------------------------------------------
        if (!await db.BoardColumns.AnyAsync())
        {
            db.BoardColumns.AddRange(
                new BoardColumn { Name = "Week 1", Color = "#6366f1", Position = 0 },
                new BoardColumn { Name = "Week 2", Color = "#8b5cf6", Position = 1 },
                new BoardColumn { Name = "Week 3", Color = "#a855f7", Position = 2 },
                new BoardColumn { Name = "Week 4", Color = "#22c55e", Position = 3 });
            await db.SaveChangesAsync();
        }

        // ---- tasks -----------------------------------------------------------
        if (!await db.Tasks.AnyAsync())
        {
            var users = await db.Users.ToDictionaryAsync(u => u.Email, u => u.Id);
            var columns = await db.BoardColumns.OrderBy(c => c.Position).ToListAsync();
            var admin = users["admin@taskmanager.pro"];
            var manager = users["manager@taskmanager.pro"];
            var sam = users["member@taskmanager.pro"];
            var jordan = users["jordan@taskmanager.pro"];

            var now = DateTime.UtcNow.Date;
            (string Title, string? Desc, string Priority, int Col, int? Assignee, int? DueOffsetDays)[] seed =
            {
                ("Design dashboard wireframes", "Create high-fidelity wireframes for the main dashboard including stat cards and charts.", "High", 0, sam, 2),
                ("Set up project repository", "Initialize Git repository, branch protection rules and commit conventions.", "Medium", 0, jordan, 3),
                ("Collect stakeholder requirements", "Interview team leads and document functional requirements for v1.", "High", 0, manager, -2),
                ("Build REST API foundation", "Scaffold ASP.NET Core project, configure EF Core and JWT authentication.", "Urgent", 1, admin, 5),
                ("Implement login and registration", "Secure login/register flows with password hashing and role-based access.", "Urgent", 1, admin, 6),
                ("Write database schema script", "T-SQL script with tables, indexes and constraints for SQL Server deployment.", "Medium", 1, sam, 8),
                ("Build Kanban board UI", "React board with drag & drop between columns and optimistic updates.", "High", 2, jordan, 12),
                ("Integrate SignalR real-time updates", "Broadcast task changes to all connected clients instantly.", "High", 2, admin, 14),
                ("QA pass and bug triage", "Full regression pass, file bugs and label priorities.", "Medium", 3, sam, 20),
                ("Prepare launch checklist", "Deployment guide, environment variables and rollback plan.", "Low", 3, manager, 25),
                ("Onboarding documentation", "User guide covering roles, board usage and real-time features.", "Low", 3, null, null)
            };

            var positions = new int[columns.Count];
            foreach (var (title, desc, priority, col, assignee, dueOffset) in seed)
            {
                db.Tasks.Add(new TaskItem
                {
                    Title = title,
                    Description = desc,
                    Priority = priority,
                    BoardColumnId = columns[col].Id,
                    Position = positions[col]++,
                    AssigneeId = assignee,
                    CreatorId = admin,
                    DueDate = dueOffset.HasValue ? now.AddDays(dueOffset.Value) : null,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync();
        }
    }
}
