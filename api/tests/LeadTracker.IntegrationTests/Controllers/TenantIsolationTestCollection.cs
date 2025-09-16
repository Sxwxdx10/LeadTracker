using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using LeadTracker.Infrastructure;
using LeadTracker.Core.Entities;

namespace LeadTracker.IntegrationTests.Controllers;

[CollectionDefinition("TenantIsolationTests")]
public class TenantIsolationTestCollection : ICollectionFixture<TenantIsolationTestFixture>
{
}

public class TenantIsolationTestFixture : IDisposable
{
    public WebApplicationFactory<Program> Factory { get; }
        private readonly string _testDatabaseName = $"leadtracker_test_{Guid.NewGuid():N}";
    private static readonly object _lock = new object();
    private readonly Guid _orgId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _orgId2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static LeadTrackerDbContext? _sharedContext;
    
    public void SetSharedContext(LeadTrackerDbContext context)
    {
        _sharedContext = context;
    }

    public TenantIsolationTestFixture()
    {
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                // Set environment to Testing to disable Hangfire
                builder.UseSetting("Environment", "Testing");
                
                // Override the database configuration to use a unique test database
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    // Add InMemory database for tests
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                    {
                        options.UseInMemoryDatabase(_testDatabaseName);
                        options.EnableSensitiveDataLogging();
                    });
                });
            });
    }


    public void EnsureDataSeeded()
    {
        lock (_lock)
        {
            // Reset data seeding state to allow re-seeding if needed

            Console.WriteLine("Starting data seeding...");

            // Create test organizations with unique names to avoid conflicts
            var timestamp = DateTime.UtcNow.Ticks;
            var org1 = new Organization 
            { 
                Id = _orgId1, 
                Name = $"Organization 1 {timestamp}", 
                Domain = $"org1-{timestamp}.com", 
                IsActive = true 
            };
            var org2 = new Organization 
            { 
                Id = _orgId2, 
                Name = $"Organization 2 {timestamp}", 
                Domain = $"org2-{timestamp}.com", 
                IsActive = true 
            };

            // Create users for each organization
            var user1 = new User 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org1.Id, 
                FirstName = "User", 
                LastName = "One", 
                Email = "user1@org1.com" 
            };
            var user2 = new User 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org2.Id, 
                FirstName = "User", 
                LastName = "Two", 
                Email = "user2@org2.com" 
            };

            // Create stages for each organization
            var stage1 = new Stage 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org1.Id, 
                Name = "Qualified", 
                Order = 1 
            };
            var stage2 = new Stage 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org2.Id, 
                Name = "Qualified", 
                Order = 1 
            };

            // Create leads for each organization
            var lead1 = new Lead 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org1.Id, 
                Title = "Lead 1 Org 1", 
                StageId = stage1.Id 
            };
            var lead2 = new Lead 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org2.Id, 
                Title = "Lead 2 Org 2", 
                StageId = stage2.Id 
            };

            // Create tasks for each organization
            var task1 = new Core.Entities.Task 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org1.Id, 
                Title = "Task 1 Org 1", 
                LeadId = lead1.Id 
            };
            var task2 = new Core.Entities.Task 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = org2.Id, 
                Title = "Task 2 Org 2", 
                LeadId = lead2.Id 
            };

            // Data existence check already done above, proceed with seeding

            // Store the entities for later use in tests
        }
    }

    public void SeedDataForTest(LeadTrackerDbContext context)
    {
        // Ensure database is created
        context.Database.EnsureCreated();

        Console.WriteLine($"Seeding data for test using DbContext: InMemory Database");
        
        // Clear any existing data to avoid conflicts
        context.Database.EnsureDeleted();
        context.Database.EnsureCreated();

        // Create test organizations with unique names to avoid conflicts
        var timestamp = DateTime.UtcNow.Ticks;
        var org1 = new Organization 
        { 
            Id = _orgId1, 
            Name = $"Organization 1 {timestamp}", 
            Domain = $"org1-{timestamp}.com", 
            IsActive = true 
        };
        var org2 = new Organization 
        { 
            Id = _orgId2, 
            Name = $"Organization 2 {timestamp}", 
            Domain = $"org2-{timestamp}.com", 
            IsActive = true 
        };

        // Create users for each organization
        var user1 = new User 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            FirstName = "User", 
            LastName = "One", 
            Email = "user1@org1.com" 
        };
        var user2 = new User 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            FirstName = "User", 
            LastName = "Two", 
            Email = "user2@org2.com" 
        };

        // Create stages for each organization
        var stage1 = new Stage 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Name = "Qualified", 
            Order = 1 
        };
        var stage2 = new Stage 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Name = "Qualified", 
            Order = 1 
        };

        // Create leads for each organization
        var lead1 = new Lead 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Title = "Lead 1 Org 1", 
            StageId = stage1.Id 
        };
        var lead2 = new Lead 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Title = "Lead 2 Org 2", 
            StageId = stage2.Id 
        };

        // Create tasks for each organization
        var task1 = new Core.Entities.Task 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Title = "Task 1 Org 1", 
            LeadId = lead1.Id 
        };
        var task2 = new Core.Entities.Task 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Title = "Task 2 Org 2", 
            LeadId = lead2.Id 
        };

        // Add entities in dependency order (database is clean, no conflicts expected)
        try
        {
            // Add organizations
            context.Organizations.AddRange(org1, org2);
            var orgResult = context.SaveChanges();
            Console.WriteLine($"Organizations saved: {orgResult} entities affected");
            
            // Add stages
            context.Stages.AddRange(stage1, stage2);
            var stageResult = context.SaveChanges();
            Console.WriteLine($"Stages saved: {stageResult} entities affected");
            
            // Add users
            context.BusinessUsers.AddRange(user1, user2);
            var userResult = context.SaveChanges();
            Console.WriteLine($"Users saved: {userResult} entities affected");
            
            // Add leads
            context.Leads.AddRange(lead1, lead2);
            var leadResult = context.SaveChanges();
            Console.WriteLine($"Leads saved: {leadResult} entities affected");
            
            // Add tasks
            context.Tasks.AddRange(task1, task2);
            var taskResult = context.SaveChanges();
            Console.WriteLine($"Tasks saved: {taskResult} entities affected");
            
            Console.WriteLine("All entities saved successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during seeding: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            throw;
        }
        
        // Debug: Verify data was saved
        var orgCount = context.Organizations.Count();
        var leadCount = context.Leads.Count();
        var userCount = context.BusinessUsers.Count();
        var stageCount = context.Stages.Count();
        var taskCount = context.Tasks.Count();
        
        Console.WriteLine($"Final verification: {orgCount} orgs, {leadCount} leads, {userCount} users, {stageCount} stages, {taskCount} tasks");
    }

    /// <summary>
    /// Seeds data using the same DbContext instance that will be used by the application
    /// This ensures proper data isolation and synchronization
    /// </summary>
    public async System.Threading.Tasks.Task SeedDataForTestAsync(LeadTrackerDbContext context)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        Console.WriteLine($"Seeding data for test using DbContext: InMemory Database");
        
        // Clear any existing data to avoid conflicts
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();

        // Create test organizations with unique names to avoid conflicts
        var timestamp = DateTime.UtcNow.Ticks;
        var org1 = new Organization 
        { 
            Id = _orgId1, 
            Name = $"Organization 1 {timestamp}", 
            Domain = $"org1-{timestamp}.com", 
            IsActive = true 
        };
        var org2 = new Organization 
        { 
            Id = _orgId2, 
            Name = $"Organization 2 {timestamp}", 
            Domain = $"org2-{timestamp}.com", 
            IsActive = true 
        };

        // Create users for each organization
        var user1 = new User 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            FirstName = "User", 
            LastName = "One", 
            Email = "user1@org1.com" 
        };
        var user2 = new User 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            FirstName = "User", 
            LastName = "Two", 
            Email = "user2@org2.com" 
        };

        // Create stages for each organization
        var stage1 = new Stage 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Name = "Qualified", 
            Order = 1 
        };
        var stage2 = new Stage 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Name = "Qualified", 
            Order = 1 
        };

        // Create leads for each organization
        var lead1 = new Lead 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Title = "Lead 1 Org 1", 
            StageId = stage1.Id 
        };
        var lead2 = new Lead 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Title = "Lead 2 Org 2", 
            StageId = stage2.Id 
        };

        // Create tasks for each organization
        var task1 = new Core.Entities.Task 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Title = "Task 1 Org 1", 
            LeadId = lead1.Id 
        };
        var task2 = new Core.Entities.Task 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Title = "Task 2 Org 2", 
            LeadId = lead2.Id 
        };

        // Add entities in dependency order (database is clean, no conflicts expected)
        try
        {
            // Add organizations
            context.Organizations.AddRange(org1, org2);
            var orgResult = await context.SaveChangesAsync();
            Console.WriteLine($"Organizations saved: {orgResult} entities affected");
            
            // Add stages
            context.Stages.AddRange(stage1, stage2);
            var stageResult = await context.SaveChangesAsync();
            Console.WriteLine($"Stages saved: {stageResult} entities affected");
            
            // Add users
            context.BusinessUsers.AddRange(user1, user2);
            var userResult = await context.SaveChangesAsync();
            Console.WriteLine($"Users saved: {userResult} entities affected");
            
            // Add leads
            context.Leads.AddRange(lead1, lead2);
            var leadResult = await context.SaveChangesAsync();
            Console.WriteLine($"Leads saved: {leadResult} entities affected");
            
            // Add tasks
            context.Tasks.AddRange(task1, task2);
            var taskResult = await context.SaveChangesAsync();
            Console.WriteLine($"Tasks saved: {taskResult} entities affected");
            
            Console.WriteLine("All entities saved successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during seeding: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            throw;
        }
        
        // Debug: Verify data was saved
        var orgCount = await context.Organizations.CountAsync();
        var leadCount = await context.Leads.CountAsync();
        var userCount = await context.BusinessUsers.CountAsync();
        var stageCount = await context.Stages.CountAsync();
        var taskCount = await context.Tasks.CountAsync();
        
        Console.WriteLine($"Final verification: {orgCount} orgs, {leadCount} leads, {userCount} users, {stageCount} stages, {taskCount} tasks");
    }

    public void Dispose()
    {
        _sharedContext?.Dispose();
        
        // Clean up the test database
        try
        {
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
            context.Database.EnsureDeleted();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error cleaning up test database: {ex.Message}");
        }
        
        Factory?.Dispose();
    }
}
