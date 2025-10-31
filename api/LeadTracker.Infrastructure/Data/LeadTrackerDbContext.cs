using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure;

public class LeadTrackerDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    private readonly ITenantFilterService? _tenantFilterService;
    private readonly bool _disableTenantFiltering;

    public LeadTrackerDbContext(DbContextOptions<LeadTrackerDbContext> options) : base(options)
    {
        _disableTenantFiltering = false;
    }

    public LeadTrackerDbContext(DbContextOptions<LeadTrackerDbContext> options, ITenantFilterService tenantFilterService) : base(options)
    {
        _tenantFilterService = tenantFilterService;
        _disableTenantFiltering = false;
    }

    // Constructor for testing scenarios where tenant filtering should be disabled
    public LeadTrackerDbContext(DbContextOptions<LeadTrackerDbContext> options, bool disableTenantFiltering) : base(options)
    {
        _disableTenantFiltering = disableTenantFiltering;
    }

    // Domain entities
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<User> BusinessUsers { get; set; } // Renamed to avoid conflict with Identity Users
    public DbSet<Lead> Leads { get; set; }
    public DbSet<Stage> Stages { get; set; }
    public DbSet<Core.Entities.Task> Tasks { get; set; }
    public DbSet<UserInvitation> UserInvitations { get; set; }
    public DbSet<SavedSearchFilter> SavedSearchFilters { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Attachment> Attachments { get; set; }

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
            entity.Property(e => e.JobTitle).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.DomainUser)
                  .WithOne()
                  .HasForeignKey<ApplicationUser>(e => e.DomainUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => new { e.OrganizationId, e.Email }).IsUnique();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure Organization
        builder.Entity<Organization>(entity =>
        {
            entity.ToTable("Organizations");
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Domain).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.TimeZone).HasMaxLength(50).HasDefaultValue("UTC");
            entity.Property(e => e.Currency).HasMaxLength(5).HasDefaultValue("USD");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Indexes - Domain can be shared by multiple organizations
            entity.HasIndex(e => e.Domain);
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
            
            // Search performance indexes
            entity.HasIndex(e => new { e.OrganizationId, e.Status });
            entity.HasIndex(e => new { e.OrganizationId, e.Source });
            entity.HasIndex(e => new { e.OrganizationId, e.IsActive });
            entity.HasIndex(e => new { e.OrganizationId, e.CreatedAt, e.IsActive });
            
            // Full-text search indexes (for better search performance)
            entity.HasIndex(e => e.FirstName).HasDatabaseName("IX_Leads_FirstName_Search");
            entity.HasIndex(e => e.LastName).HasDatabaseName("IX_Leads_LastName_Search");
            entity.HasIndex(e => e.Company).HasDatabaseName("IX_Leads_Company_Search");
            entity.HasIndex(e => e.Email).HasDatabaseName("IX_Leads_Email_Search");
            entity.HasIndex(e => e.Title).HasDatabaseName("IX_Leads_Title_Search");
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
                  .OnDelete(DeleteBehavior.Restrict);
                  
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

        // Configure SavedSearchFilter
        builder.Entity<SavedSearchFilter>(entity =>
        {
            entity.ToTable("SavedSearchFilters");
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.SearchCriteriaJson).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.LastUsedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.CreatedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.CreatedByUserId);
            entity.HasIndex(e => e.LastUsedAt);
            entity.HasIndex(e => new { e.OrganizationId, e.CreatedByUserId });
        });

        // Configure Activity
        builder.Entity<Activity>(entity =>
        {
            entity.ToTable("Activities");
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Type).HasMaxLength(50).HasDefaultValue("Note");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Planned");
            entity.Property(e => e.Location).HasMaxLength(500);
            entity.Property(e => e.Outcome).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Lead)
                  .WithMany()
                  .HasForeignKey(e => e.LeadId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ScheduledAt);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure Comment
        builder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comments");
            entity.Property(e => e.Content).HasMaxLength(5000).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Lead)
                  .WithMany()
                  .HasForeignKey(e => e.LeadId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Task)
                  .WithMany()
                  .HasForeignKey(e => e.TaskId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Activity)
                  .WithMany(a => a.Comments)
                  .HasForeignKey(e => e.ActivityId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.ParentComment)
                  .WithMany(c => c.Replies)
                  .HasForeignKey(e => e.ParentCommentId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.TaskId);
            entity.HasIndex(e => e.ActivityId);
            entity.HasIndex(e => e.ParentCommentId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure Attachment
        builder.Entity<Attachment>(entity =>
        {
            entity.ToTable("Attachments");
            entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.OriginalFileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FilePath).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ThumbnailPath).HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Relationships
            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(e => e.Lead)
                  .WithMany()
                  .HasForeignKey(e => e.LeadId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Task)
                  .WithMany()
                  .HasForeignKey(e => e.TaskId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Activity)
                  .WithMany(a => a.Attachments)
                  .HasForeignKey(e => e.ActivityId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Comment)
                  .WithMany(c => c.Attachments)
                  .HasForeignKey(e => e.CommentId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.UploadedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.UploadedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.TaskId);
            entity.HasIndex(e => e.ActivityId);
            entity.HasIndex(e => e.CommentId);
            entity.HasIndex(e => e.UploadedByUserId);
            entity.HasIndex(e => e.ContentType);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Apply global query filters for multi-tenant entities
        // Note: Tenant filtering is disabled in testing mode to allow test data access
        if (!IsTestingMode())
        {
            ApplyTenantFilters(builder);
        }
    }

    /// <summary>
    /// Applies global query filters for multi-tenant entities
    /// </summary>
    private void ApplyTenantFilters(ModelBuilder builder)
    {
        // Skip tenant filtering in testing mode to allow performance tests to access all data
        if (IsTestingMode())
        {
            return;
        }
        
        // Apply tenant filtering - queries will only return data for current organization
        // NOTE: Auth operations (register/login) must use .IgnoreQueryFilters() to bypass these
        builder.Entity<Lead>().HasQueryFilter(e => 
            _tenantFilterService != null && 
            _tenantFilterService.GetCurrentOrganizationId() != null && 
            e.OrganizationId == _tenantFilterService.GetCurrentOrganizationId());
            
        builder.Entity<User>().HasQueryFilter(e => 
            _tenantFilterService != null && 
            _tenantFilterService.GetCurrentOrganizationId() != null && 
            e.OrganizationId == _tenantFilterService.GetCurrentOrganizationId());
            
        builder.Entity<Stage>().HasQueryFilter(e => 
            _tenantFilterService != null && 
            _tenantFilterService.GetCurrentOrganizationId() != null && 
            e.OrganizationId == _tenantFilterService.GetCurrentOrganizationId());
            
        builder.Entity<Core.Entities.Task>().HasQueryFilter(e => 
            _tenantFilterService != null && 
            _tenantFilterService.GetCurrentOrganizationId() != null && 
            e.OrganizationId == _tenantFilterService.GetCurrentOrganizationId());
            
        builder.Entity<Activity>().HasQueryFilter(e => 
            _tenantFilterService != null && 
            _tenantFilterService.GetCurrentOrganizationId() != null && 
            e.OrganizationId == _tenantFilterService.GetCurrentOrganizationId());
            
        builder.Entity<Comment>().HasQueryFilter(e => 
            _tenantFilterService != null && 
            _tenantFilterService.GetCurrentOrganizationId() != null && 
            e.OrganizationId == _tenantFilterService.GetCurrentOrganizationId());
            
        builder.Entity<Attachment>().HasQueryFilter(e => 
            _tenantFilterService != null && 
            _tenantFilterService.GetCurrentOrganizationId() != null && 
            e.OrganizationId == _tenantFilterService.GetCurrentOrganizationId());
    }

    private bool IsTestingMode()
    {
        // Use the explicit constructor flag to determine if tenant filtering should be disabled
        return _disableTenantFiltering;
    }

    /// <summary>
    /// Gets the current organization ID for tenant filtering
    /// </summary>
    public Guid? GetCurrentOrganizationId()
    {
        if (_tenantFilterService == null)
        {
            Console.WriteLine("WARNING: TenantFilterService is null - cannot apply tenant filtering");
            return null;
        }
        
        var orgId = _tenantFilterService.GetCurrentOrganizationId();
        Console.WriteLine($"GetCurrentOrganizationId returned: {orgId}");
        return orgId;
    }

    /// <summary>
    /// Gets leads filtered by current organization
    /// </summary>
    public IQueryable<Lead> GetLeadsForCurrentTenant()
    {
        var orgId = GetCurrentOrganizationId();
        if (!orgId.HasValue)
        {
            return Leads.Where(l => false); // Return empty query if no tenant context
        }
        return Leads.Where(l => l.OrganizationId == orgId.Value);
    }

    /// <summary>
    /// Gets business users filtered by current organization
    /// </summary>
    public IQueryable<User> GetUsersForCurrentTenant()
    {
        var orgId = GetCurrentOrganizationId();
        if (!orgId.HasValue)
        {
            Console.WriteLine("No organization ID - returning empty query");
            return BusinessUsers.Where(u => false); // Return empty query if no tenant context
        }
        
        Console.WriteLine($"Filtering users for organization: {orgId.Value}");
        
        // First, let's see what users exist
        var allUsers = BusinessUsers.ToList();
        Console.WriteLine($"Total users in database: {allUsers.Count}");
        foreach (var user in allUsers)
        {
            Console.WriteLine($"User: {user.FirstName} {user.LastName}, OrgId: {user.OrganizationId}");
        }
        
        var query = BusinessUsers.Where(u => u.OrganizationId == orgId.Value);
        
        // Log the SQL query
        var sql = query.ToQueryString();
        Console.WriteLine($"SQL Query: {sql}");
        
        return query;
    }

    /// <summary>
    /// Gets stages filtered by current organization
    /// </summary>
    public IQueryable<Stage> GetStagesForCurrentTenant()
    {
        var orgId = GetCurrentOrganizationId();
        if (!orgId.HasValue)
        {
            return Stages.Where(s => false); // Return empty query if no tenant context
        }
        return Stages.Where(s => s.OrganizationId == orgId.Value);
    }

    /// <summary>
    /// Gets tasks filtered by current organization
    /// </summary>
    public IQueryable<Core.Entities.Task> GetTasksForCurrentTenant()
    {
        var orgId = GetCurrentOrganizationId();
        if (!orgId.HasValue)
        {
            return Tasks.Where(t => false); // Return empty query if no tenant context
        }
        return Tasks.Where(t => t.OrganizationId == orgId.Value);
    }

    /// <summary>
    /// Gets organization for current tenant (returns single organization)
    /// </summary>
    public IQueryable<Organization> GetOrganizationForCurrentTenant()
    {
        var orgId = GetCurrentOrganizationId();
        if (!orgId.HasValue)
        {
            return Organizations.Where(o => false); // Return empty query if no tenant context
        }
        return Organizations.Where(o => o.Id == orgId.Value);
    }
}
