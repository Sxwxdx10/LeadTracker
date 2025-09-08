using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Microsoft.AspNetCore.Identity;

namespace LeadTracker.IntegrationTests.Services;

/// <summary>
/// Service for seeding test data with proper DbContext synchronization
/// </summary>
public class TestDataSeeder : ITestDataSeeder
{
    private readonly Guid _orgId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _orgId2 = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public async System.Threading.Tasks.Task SeedDataAsync(LeadTrackerDbContext context)
    {
        // Ensure database is created and clean
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
        
        // Clear any cached data to ensure fresh state
        context.ChangeTracker.Clear();
        
        Console.WriteLine("Seeding test data with proper synchronization");
        
        // Create test organizations with unique names to avoid conflicts
        // Use fixed names instead of timestamps to ensure consistency
        var org1 = new Organization 
        { 
            Id = _orgId1, 
            Name = "Organization 1", 
            Domain = "org1.com", 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var org2 = new Organization 
        { 
            Id = _orgId2, 
            Name = "Organization 2", 
            Domain = "org2.com", 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create users for each organization
        var user1 = new User 
        { 
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), 
            OrganizationId = org1.Id, 
            FirstName = "User", 
            LastName = "One", 
            Email = "user1@org1.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var user2 = new User 
        { 
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), 
            OrganizationId = org2.Id, 
            FirstName = "User", 
            LastName = "Two", 
            Email = "user2@org2.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create stages for each organization
        var stage1 = new Stage 
        { 
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), 
            OrganizationId = org1.Id, 
            Name = "Qualified", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var stage2 = new Stage 
        { 
            Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), 
            OrganizationId = org2.Id, 
            Name = "Initial Contact", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create leads for each organization
        var lead1 = new Lead 
        { 
            Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), 
            OrganizationId = org1.Id, 
            Title = "Org 1 Lead Opportunity",
            FirstName = "Lead", 
            LastName = "One", 
            Email = "lead1@org1.com",
            StageId = stage1.Id,
            AssignedUserId = user1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var lead2 = new Lead 
        { 
            Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), 
            OrganizationId = org2.Id, 
            Title = "Org 2 Lead Opportunity",
            FirstName = "Lead", 
            LastName = "Two", 
            Email = "lead2@org2.com",
            StageId = stage2.Id,
            AssignedUserId = user2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create tasks for each organization
        var task1 = new LeadTracker.Core.Entities.Task 
        { 
            Id = Guid.Parse("99999999-9999-9999-9999-999999999999"), 
            OrganizationId = org1.Id, 
            Title = "Follow up with Lead One", 
            Description = "Call Lead One to discuss their needs.",
            DueDate = DateTime.UtcNow.AddDays(7),
            Status = "Pending",
            LeadId = lead1.Id,
            AssignedUserId = user1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var task2 = new LeadTracker.Core.Entities.Task 
        { 
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), 
            OrganizationId = org2.Id, 
            Title = "Send intro email to Lead Two", 
            Description = "Send an introductory email to Lead Two.",
            DueDate = DateTime.UtcNow.AddDays(3),
            Status = "Pending",
            LeadId = lead2.Id,
            AssignedUserId = user2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        try
        {
            // Create ASP.NET Identity roles first
            var userRole = new IdentityRole<Guid> 
            { 
                Id = Guid.NewGuid(), 
                Name = "USER", 
                NormalizedName = "USER", 
                ConcurrencyStamp = "user-role-stamp" 
            };
            var adminRole = new IdentityRole<Guid> 
            { 
                Id = Guid.NewGuid(), 
                Name = "ADMIN", 
                NormalizedName = "ADMIN", 
                ConcurrencyStamp = "admin-role-stamp" 
            };
            
            context.Roles.AddRange(userRole, adminRole);
            await context.SaveChangesAsync();
            Console.WriteLine($"Roles saved: {context.ChangeTracker.Entries<IdentityRole>().Count()} entities affected");

            context.Organizations.AddRange(org1, org2);
            await context.SaveChangesAsync();
            Console.WriteLine($"Organizations saved: {context.ChangeTracker.Entries<Organization>().Count()} entities affected");

            context.Stages.AddRange(stage1, stage2);
            await context.SaveChangesAsync();
            Console.WriteLine($"Stages saved: {context.ChangeTracker.Entries<Stage>().Count()} entities affected");

            context.BusinessUsers.AddRange(user1, user2);
            await context.SaveChangesAsync();
            Console.WriteLine($"Users saved: {context.ChangeTracker.Entries<User>().Count()} entities affected");

            context.Leads.AddRange(lead1, lead2);
            await context.SaveChangesAsync();
            Console.WriteLine($"Leads saved: {context.ChangeTracker.Entries<Lead>().Count()} entities affected");

            context.Tasks.AddRange(task1, task2);
            await context.SaveChangesAsync();
            Console.WriteLine($"Tasks saved: {context.ChangeTracker.Entries<LeadTracker.Core.Entities.Task>().Count()} entities affected");
            
            Console.WriteLine("All entities saved successfully with proper synchronization");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during seeding: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            throw;
        }
        
        // Clear the context to ensure fresh data is loaded on next query
        context.ChangeTracker.Clear();
        
        // Final verification - reload from database after clearing cache
        // Note: We need to disable tenant filtering for verification
        var orgCount = await context.Organizations.CountAsync();
        var leadCount = await context.Leads.IgnoreQueryFilters().CountAsync();
        var userCount = await context.BusinessUsers.IgnoreQueryFilters().CountAsync();
        var stageCount = await context.Stages.IgnoreQueryFilters().CountAsync();
        var taskCount = await context.Tasks.IgnoreQueryFilters().CountAsync();
        
        Console.WriteLine($"Final verification: {orgCount} orgs, {leadCount} leads, {userCount} users, {stageCount} stages, {taskCount} tasks");
    }

    public void SeedData(LeadTrackerDbContext context)
    {
        // Ensure database is created and clean
        context.Database.EnsureDeleted();
        context.Database.EnsureCreated();
        
        // Clear any cached data to ensure fresh state
        context.ChangeTracker.Clear();
        
        Console.WriteLine("Seeding test data with proper synchronization (sync version)");
        
        // Create test organizations with unique names to avoid conflicts
        // Use fixed names instead of timestamps to ensure consistency
        var org1 = new Organization 
        { 
            Id = _orgId1, 
            Name = "Organization 1", 
            Domain = "org1.com", 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var org2 = new Organization 
        { 
            Id = _orgId2, 
            Name = "Organization 2", 
            Domain = "org2.com", 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create users for each organization
        var user1 = new User 
        { 
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), 
            OrganizationId = org1.Id, 
            FirstName = "User", 
            LastName = "One", 
            Email = "user1@org1.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var user2 = new User 
        { 
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), 
            OrganizationId = org2.Id, 
            FirstName = "User", 
            LastName = "Two", 
            Email = "user2@org2.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create stages for each organization
        var stage1 = new Stage 
        { 
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), 
            OrganizationId = org1.Id, 
            Name = "Qualified", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var stage2 = new Stage 
        { 
            Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), 
            OrganizationId = org2.Id, 
            Name = "Initial Contact", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create leads for each organization
        var lead1 = new Lead 
        { 
            Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), 
            OrganizationId = org1.Id, 
            Title = "Org 1 Lead Opportunity",
            FirstName = "Lead", 
            LastName = "One", 
            Email = "lead1@org1.com",
            StageId = stage1.Id,
            AssignedUserId = user1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var lead2 = new Lead 
        { 
            Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), 
            OrganizationId = org2.Id, 
            Title = "Org 2 Lead Opportunity",
            FirstName = "Lead", 
            LastName = "Two", 
            Email = "lead2@org2.com",
            StageId = stage2.Id,
            AssignedUserId = user2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create tasks for each organization
        var task1 = new LeadTracker.Core.Entities.Task 
        { 
            Id = Guid.Parse("99999999-9999-9999-9999-999999999999"), 
            OrganizationId = org1.Id, 
            Title = "Follow up with Lead One", 
            Description = "Call Lead One to discuss their needs.",
            DueDate = DateTime.UtcNow.AddDays(7),
            Status = "Pending",
            LeadId = lead1.Id,
            AssignedUserId = user1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var task2 = new LeadTracker.Core.Entities.Task 
        { 
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), 
            OrganizationId = org2.Id, 
            Title = "Send intro email to Lead Two", 
            Description = "Send an introductory email to Lead Two.",
            DueDate = DateTime.UtcNow.AddDays(3),
            Status = "Pending",
            LeadId = lead2.Id,
            AssignedUserId = user2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        try
        {
            // Create ASP.NET Identity roles first
            var userRole = new IdentityRole<Guid> 
            { 
                Id = Guid.NewGuid(), 
                Name = "USER", 
                NormalizedName = "USER", 
                ConcurrencyStamp = "user-role-stamp" 
            };
            var adminRole = new IdentityRole<Guid> 
            { 
                Id = Guid.NewGuid(), 
                Name = "ADMIN", 
                NormalizedName = "ADMIN", 
                ConcurrencyStamp = "admin-role-stamp" 
            };
            
            context.Roles.AddRange(userRole, adminRole);
            context.SaveChanges();
            Console.WriteLine($"Roles saved: {context.ChangeTracker.Entries<IdentityRole>().Count()} entities affected");

            context.Organizations.AddRange(org1, org2);
            context.SaveChanges();
            Console.WriteLine($"Organizations saved: {context.ChangeTracker.Entries<Organization>().Count()} entities affected");

            context.Stages.AddRange(stage1, stage2);
            context.SaveChanges();
            Console.WriteLine($"Stages saved: {context.ChangeTracker.Entries<Stage>().Count()} entities affected");

            context.BusinessUsers.AddRange(user1, user2);
            context.SaveChanges();
            Console.WriteLine($"Users saved: {context.ChangeTracker.Entries<User>().Count()} entities affected");

            context.Leads.AddRange(lead1, lead2);
            context.SaveChanges();
            Console.WriteLine($"Leads saved: {context.ChangeTracker.Entries<Lead>().Count()} entities affected");

            context.Tasks.AddRange(task1, task2);
            context.SaveChanges();
            Console.WriteLine($"Tasks saved: {context.ChangeTracker.Entries<LeadTracker.Core.Entities.Task>().Count()} entities affected");
            
            Console.WriteLine("All entities saved successfully with proper synchronization (sync version)");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during seeding: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            throw;
        }
        
        // Clear the context to ensure fresh data is loaded on next query
        context.ChangeTracker.Clear();
        
        // Final verification - reload from database after clearing cache
        var orgCount = context.Organizations.Count();
        var leadCount = context.Leads.IgnoreQueryFilters().Count();
        var userCount = context.BusinessUsers.IgnoreQueryFilters().Count();
        var stageCount = context.Stages.IgnoreQueryFilters().Count();
        var taskCount = context.Tasks.IgnoreQueryFilters().Count();
        
        Console.WriteLine($"Final verification: {orgCount} orgs, {leadCount} leads, {userCount} users, {stageCount} stages, {taskCount} tasks");
    }
}