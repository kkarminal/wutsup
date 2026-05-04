using Microsoft.EntityFrameworkCore;

using Wutsup.Api.Models;

namespace Wutsup.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<LogEntry> Logs { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<NavigationNode> NavigationNodes { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<LogEntry>(entity =>
        {
            entity.ToTable("logs");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .UseIdentityAlwaysColumn();

            entity.Property(e => e.Timestamp)
                .HasColumnName("timestamp")
                .HasColumnType("timestamptz")
                .IsRequired()
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.Level)
                .HasColumnName("level")
                .HasColumnType("varchar(10)")
                .IsRequired();

            entity.Property(e => e.Message)
                .HasColumnName("message")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(e => e.Source)
                .HasColumnName("source")
                .HasColumnType("varchar(255)")
                .IsRequired();

            entity.Property(e => e.CorrelationId)
                .HasColumnName("correlation_id")
                .HasColumnType("uuid");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamptz")
                .IsRequired()
                .HasDefaultValueSql("NOW()");

            entity.HasIndex(e => e.Timestamp)
                .HasDatabaseName("idx_logs_timestamp")
                .IsDescending();

            entity.HasIndex(e => e.Level)
                .HasDatabaseName("idx_logs_level");

            entity.HasIndex(e => e.CorrelationId)
                .HasDatabaseName("idx_logs_correlation_id");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .UseIdentityAlwaysColumn();

            entity.Property(e => e.Username)
                .HasColumnName("username")
                .HasColumnType("varchar(255)")
                .IsRequired();

            entity.Property(e => e.PasswordHash)
                .HasColumnName("password_hash")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(e => e.Role)
                .HasColumnName("role")
                .HasColumnType("varchar(100)")
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamptz")
                .IsRequired()
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("timestamptz")
                .IsRequired()
                .HasDefaultValueSql("NOW()");

            entity.HasIndex(e => e.Username)
                .HasDatabaseName("idx_users_username")
                .IsUnique();
        });

        modelBuilder.Entity<NavigationNode>(entity =>
        {
            entity.ToTable("navigation_nodes");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .UseIdentityAlwaysColumn();

            entity.Property(e => e.Label)
                .HasColumnName("label")
                .HasColumnType("varchar(255)")
                .IsRequired();

            entity.Property(e => e.Icon)
                .HasColumnName("icon")
                .HasColumnType("varchar(100)");

            entity.Property(e => e.ParentId)
                .HasColumnName("parent_id");

            entity.Property(e => e.SortOrder)
                .HasColumnName("sort_order")
                .IsRequired()
                .HasDefaultValue(0);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamptz")
                .IsRequired()
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("timestamptz")
                .IsRequired()
                .HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .HasConstraintName("fk_navigation_nodes_parent_id")
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ParentId)
                .HasDatabaseName("idx_navigation_nodes_parent_id");
        });
    }
}
