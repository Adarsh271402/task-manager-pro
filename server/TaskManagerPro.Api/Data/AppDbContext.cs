using Microsoft.EntityFrameworkCore;
using TaskManagerPro.Api.Entities;

namespace TaskManagerPro.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<BoardColumn> BoardColumns => Set<BoardColumn>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.FullName).IsRequired().HasMaxLength(100);
            e.Property(u => u.Email).IsRequired().HasMaxLength(200);
            e.Property(u => u.PasswordHash).IsRequired().HasMaxLength(500);
            e.Property(u => u.Role).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<BoardColumn>(e =>
        {
            e.Property(c => c.Name).IsRequired().HasMaxLength(50);
            e.Property(c => c.Color).IsRequired().HasMaxLength(20);
            e.HasIndex(c => c.Position).IsUnique();
        });

        modelBuilder.Entity<TaskItem>(e =>
        {
            e.Property(t => t.Title).IsRequired().HasMaxLength(200);
            e.Property(t => t.Description).HasMaxLength(2000);
            e.Property(t => t.Priority).IsRequired().HasMaxLength(20);
            // Due dates are calendar dates, rather than UTC instants.
            if (Database.IsNpgsql())
                e.Property(t => t.DueDate).HasColumnType("date");
            e.HasIndex(t => new { t.BoardColumnId, t.Position });

            e.HasOne(t => t.BoardColumn)
                .WithMany(c => c.Tasks)
                .HasForeignKey(t => t.BoardColumnId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(t => t.Assignee)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(t => t.Creator)
                .WithMany()
                .HasForeignKey(t => t.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
