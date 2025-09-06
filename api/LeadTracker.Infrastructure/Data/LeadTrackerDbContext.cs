using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;

namespace LeadTracker.Infrastructure.Data;

public class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>
    /// First name of the user
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Last name of the user
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Organization ID this user belongs to
    /// </summary>
    public Guid? OrganizationId { get; set; }

    /// <summary>
    /// Navigation property to the organization
    /// </summary>
    public virtual Organization? Organization { get; set; }

    /// <summary>
    /// Full name of the user (computed property)
    /// </summary>
    public string FullName => $"{FirstName} {LastName}".Trim();

    /// <summary>
    /// Whether the user is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When the user was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the user was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class LeadTrackerDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public LeadTrackerDbContext(DbContextOptions<LeadTrackerDbContext> options) : base(options)
    {
    }

    // Domain entities
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<User> BusinessUsers { get; set; } // Renamed to avoid conflict with Identity Users
    public DbSet<Lead> Leads { get; set; }
    public DbSet<Stage> Stages { get; set; }
    public DbSet<Core.Entities.Task> Tasks { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure Identity table names
        builder.Entity<ApplicationUser>().ToTable("Users");
        builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

        // Configure ApplicationUser
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => new { e.OrganizationId, e.Email }).IsUnique();
        });

        // Configure Organization
        builder.Entity<Organization>(entity =>
        {
            entity.ToTable("Organizations");
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Domain).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.TimeZone).HasMaxLength(10).HasDefaultValue("UTC");
            entity.Property(e => e.Currency).HasMaxLength(5).HasDefaultValue("USD");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Indexes
            entity.HasIndex(e => e.Domain).IsUnique();
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure User (Business Users)
        builder.Entity<User>(entity =>
        {
            entity.ToTable("BusinessUsers");
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.JobTitle).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.Users)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => new { e.OrganizationId, e.Email }).IsUnique();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure Stage
        builder.Entity<Stage>(entity =>
        {
            entity.ToTable("Stages");
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Color).HasMaxLength(7).HasDefaultValue("#3B82F6");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.Stages)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => new { e.OrganizationId, e.Order }).IsUnique();
            entity.HasIndex(e => e.OrganizationId);
        });

        // Configure Lead
        builder.Entity<Lead>(entity =>
        {
            entity.ToTable("Leads");
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Company).HasMaxLength(200);
            entity.Property(e => e.JobTitle).HasMaxLength(100);
            entity.Property(e => e.EstimatedValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.Property(e => e.Source).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Open");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.Leads)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Stage)
                  .WithMany(s => s.Leads)
                  .HasForeignKey(e => e.StageId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.AssignedUser)
                  .WithMany(u => u.AssignedLeads)
                  .HasForeignKey(e => e.AssignedUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.StageId);
            entity.HasIndex(e => e.AssignedUserId);
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.LastContactedAt);
        });

        // Configure Task
        builder.Entity<Core.Entities.Task>(entity =>
        {
            entity.ToTable("Tasks");
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Type).HasMaxLength(20).HasDefaultValue("Call");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");
            entity.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("Medium");
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Lead)
                  .WithMany(l => l.Tasks)
                  .HasForeignKey(e => e.LeadId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.AssignedUser)
                  .WithMany(u => u.AssignedTasks)
                  .HasForeignKey(e => e.AssignedUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.AssignedUserId);
            entity.HasIndex(e => e.DueDate);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
