using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Net.Http.Headers;
using System.Text.Json;
using LeadTracker.Core.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Xunit;

namespace LeadTracker.IntegrationTests.Controllers;

[Collection("TenantIsolationTests")]
public class ImprovedTenantDataIsolationIntegrationTests : IDisposable
{
    private readonly TenantIsolationTestFixture _fixture;
    private readonly HttpClient _client;
    private readonly Guid _orgId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _orgId2 = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public ImprovedTenantDataIsolationIntegrationTests(TenantIsolationTestFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.Factory.CreateClient();
        
        // Use the improved seeding approach that ensures DbContext synchronization
        SeedDataWithSynchronization();
    }

    /// <summary>
    /// Seeds data using a synchronized approach that ensures the same DbContext
    /// is used for both seeding and HTTP requests
    /// </summary>
    private void SeedDataWithSynchronization()
    {
        // Create a scope to get the DbContext that will be used by the application
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Ensure database is created and clean
        context.Database.EnsureDeleted();
        context.Database.EnsureCreated();
        
        // Clear any cached data
        context.ChangeTracker.Clear();
        
        Console.WriteLine("Seeding data with improved synchronization approach");
        
        // Create test organizations with unique names to avoid conflicts
        var timestamp = DateTime.UtcNow.Ticks;
        var org1 = new Organization 
        { 
            Id = _orgId1, 
            Name = $"Organization 1 {timestamp}", 
            Domain = $"org1-{timestamp}.com", 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var org2 = new Organization 
        { 
            Id = _orgId2, 
            Name = $"Organization 2 {timestamp}", 
            Domain = $"org2-{timestamp}.com", 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create users for each organization
        var user1 = new User 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            FirstName = "User", 
            LastName = "One", 
            Email = "user1@org1.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var user2 = new User 
        { 
            Id = Guid.NewGuid(), 
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
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Name = "Qualified", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var stage2 = new Stage 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Name = "Qualified", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create leads for each organization
        var lead1 = new Lead 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Title = "Lead 1 Org 1", 
            StageId = stage1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var lead2 = new Lead 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Title = "Lead 2 Org 2", 
            StageId = stage2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create tasks for each organization
        var task1 = new Core.Entities.Task 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org1.Id, 
            Title = "Task 1 Org 1", 
            LeadId = lead1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var task2 = new Core.Entities.Task 
        { 
            Id = Guid.NewGuid(), 
            OrganizationId = org2.Id, 
            Title = "Task 2 Org 2", 
            LeadId = lead2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add entities in dependency order
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
            
            Console.WriteLine("All entities saved successfully with synchronization");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during seeding: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            throw;
        }
        
        // Final verification
        var orgCount = context.Organizations.Count();
        var leadCount = context.Leads.Count();
        var userCount = context.BusinessUsers.Count();
        var stageCount = context.Stages.Count();
        var taskCount = context.Tasks.Count();
        
        Console.WriteLine($"Final verification: {orgCount} orgs, {leadCount} leads, {userCount} users, {stageCount} stages, {taskCount} tasks");
        
        // Clear the context to ensure fresh data is loaded on next query
        context.ChangeTracker.Clear();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetLeads_WithOrg1Header_ReturnsOnlyOrg1Leads()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act
        var response = await _client.GetAsync("/api/leads");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var leads = JsonSerializer.Deserialize<List<Lead>>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(leads);
        Assert.NotEmpty(leads);
        Assert.All(leads, lead => Assert.Equal(_orgId1, lead.OrganizationId));
        Assert.All(leads, lead => Assert.Contains("Org 1", lead.Title));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetLeads_WithOrg2Header_ReturnsOnlyOrg2Leads()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId2.ToString());

        // Act
        var response = await _client.GetAsync("/api/leads");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var leads = JsonSerializer.Deserialize<List<Lead>>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(leads);
        Assert.NotEmpty(leads);
        Assert.All(leads, lead => Assert.Equal(_orgId2, lead.OrganizationId));
        Assert.All(leads, lead => Assert.Contains("Org 2", lead.Title));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetLeads_WithoutOrgHeader_ReturnsEmpty()
    {
        // Act
        var response = await _client.GetAsync("/api/leads");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var leads = JsonSerializer.Deserialize<List<Lead>>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(leads);
        Assert.Empty(leads);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUsers_WithOrg1Header_ReturnsOnlyOrg1Users()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act
        var response = await _client.GetAsync("/api/users");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var users = JsonSerializer.Deserialize<List<User>>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(users);
        Assert.NotEmpty(users);
        Assert.All(users, user => Assert.Equal(_orgId1, user.OrganizationId));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasks_WithOrg1Header_ReturnsOnlyOrg1Tasks()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var tasks = JsonSerializer.Deserialize<List<Core.Entities.Task>>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(tasks);
        Assert.NotEmpty(tasks);
        Assert.All(tasks, task => Assert.Equal(_orgId1, task.OrganizationId));
        Assert.All(tasks, task => Assert.Contains("Org 1", task.Title));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetStages_WithOrg1Header_ReturnsOnlyOrg1Stages()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act
        var response = await _client.GetAsync("/api/stages");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var stages = JsonSerializer.Deserialize<List<Stage>>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(stages);
        Assert.NotEmpty(stages);
        Assert.All(stages, stage => Assert.Equal(_orgId1, stage.OrganizationId));
    }

    public void Dispose()
    {
        _client?.Dispose();
    }
}
