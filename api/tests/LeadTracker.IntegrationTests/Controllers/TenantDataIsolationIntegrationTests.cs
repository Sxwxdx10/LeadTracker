using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using System.Text.Json;
using LeadTracker.Core.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Xunit;

namespace LeadTracker.IntegrationTests.Controllers;

public class TenantDataIsolationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly Guid _orgId1 = Guid.NewGuid();
    private readonly Guid _orgId2 = Guid.NewGuid();

    public TenantDataIsolationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove the existing DbContext registration
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // Add in-memory database
                services.AddDbContext<LeadTrackerDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TenantIsolationTestDb");
                });
            });
        });

        _client = _factory.CreateClient();
        SeedTestData();
    }

    private void SeedTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();

        // Create organizations
        var org1 = new Organization { Id = _orgId1, Name = "Organization 1", Domain = "org1.com" };
        var org2 = new Organization { Id = _orgId2, Name = "Organization 2", Domain = "org2.com" };

        // Create users for each organization
        var user1 = new User { Id = Guid.NewGuid(), OrganizationId = _orgId1, FirstName = "User", LastName = "One", Email = "user1@org1.com" };
        var user2 = new User { Id = Guid.NewGuid(), OrganizationId = _orgId2, FirstName = "User", LastName = "Two", Email = "user2@org2.com" };

        // Create stages for each organization
        var stage1 = new Stage { Id = Guid.NewGuid(), OrganizationId = _orgId1, Name = "Qualified", Order = 1 };
        var stage2 = new Stage { Id = Guid.NewGuid(), OrganizationId = _orgId2, Name = "Qualified", Order = 1 };

        // Create leads for each organization
        var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = _orgId1, Title = "Lead 1 Org 1", StageId = stage1.Id };
        var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = _orgId2, Title = "Lead 2 Org 2", StageId = stage2.Id };

        // Create tasks for each organization
        var task1 = new Core.Entities.Task { Id = Guid.NewGuid(), OrganizationId = _orgId1, Title = "Task 1 Org 1", LeadId = lead1.Id };
        var task2 = new Core.Entities.Task { Id = Guid.NewGuid(), OrganizationId = _orgId2, Title = "Task 2 Org 2", LeadId = lead2.Id };

        context.Organizations.AddRange(org1, org2);
        context.BusinessUsers.AddRange(user1, user2);
        context.Stages.AddRange(stage1, stage2);
        context.Leads.AddRange(lead1, lead2);
        context.Tasks.AddRange(task1, task2);
        context.SaveChanges();
    }

    [Fact]
    public async Task GetLeads_WithOrg1Header_ReturnsOnlyOrg1Leads()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act
        var response = await _client.GetAsync("/api/leads");
        var content = await response.Content.ReadAsStringAsync();
        var leads = JsonSerializer.Deserialize<List<Lead>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(leads);
        Assert.Single(leads);
        Assert.Equal(_orgId1, leads[0].OrganizationId);
        Assert.Contains("Lead 1 Org 1", leads[0].Title);
    }

    [Fact]
    public async Task GetLeads_WithOrg2Header_ReturnsOnlyOrg2Leads()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId2.ToString());

        // Act
        var response = await _client.GetAsync("/api/leads");
        var content = await response.Content.ReadAsStringAsync();
        var leads = JsonSerializer.Deserialize<List<Lead>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(leads);
        Assert.Single(leads);
        Assert.Equal(_orgId2, leads[0].OrganizationId);
        Assert.Contains("Lead 2 Org 2", leads[0].Title);
    }

    [Fact]
    public async Task GetLeads_WithInvalidOrgHeader_ReturnsEmptyList()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", Guid.NewGuid().ToString());

        // Act
        var response = await _client.GetAsync("/api/leads");
        var content = await response.Content.ReadAsStringAsync();
        var leads = JsonSerializer.Deserialize<List<Lead>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(leads);
        Assert.Empty(leads);
    }

    [Fact]
    public async Task GetLeads_WithoutOrgHeader_ReturnsEmptyList()
    {
        // Act
        var response = await _client.GetAsync("/api/leads");
        var content = await response.Content.ReadAsStringAsync();
        var leads = JsonSerializer.Deserialize<List<Lead>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(leads);
        Assert.Empty(leads);
    }

    [Fact]
    public async Task GetUsers_WithOrg1Header_ReturnsOnlyOrg1Users()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act
        var response = await _client.GetAsync("/api/users");
        var content = await response.Content.ReadAsStringAsync();
        var users = JsonSerializer.Deserialize<List<User>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(users);
        Assert.Single(users);
        Assert.Equal(_orgId1, users[0].OrganizationId);
        Assert.Contains("user1@org1.com", users[0].Email);
    }

    [Fact]
    public async Task GetStages_WithOrg2Header_ReturnsOnlyOrg2Stages()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId2.ToString());

        // Act
        var response = await _client.GetAsync("/api/stages");
        var content = await response.Content.ReadAsStringAsync();
        var stages = JsonSerializer.Deserialize<List<Stage>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(stages);
        Assert.Single(stages);
        Assert.Equal(_orgId2, stages[0].OrganizationId);
        Assert.Equal("Qualified", stages[0].Name);
    }

    [Fact]
    public async Task GetTasks_WithOrg1Header_ReturnsOnlyOrg1Tasks()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act
        var response = await _client.GetAsync("/api/tasks");
        var content = await response.Content.ReadAsStringAsync();
        var tasks = JsonSerializer.Deserialize<List<Core.Entities.Task>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(tasks);
        Assert.Single(tasks);
        Assert.Equal(_orgId1, tasks[0].OrganizationId);
        Assert.Contains("Task 1 Org 1", tasks[0].Title);
    }

    [Fact]
    public async Task CrossTenantAccess_AttemptingToAccessOtherOrgData_ReturnsEmptyResults()
    {
        // Arrange - Set up as Org 1
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act - Try to access data that should be filtered
        var leadsResponse = await _client.GetAsync("/api/leads");
        var usersResponse = await _client.GetAsync("/api/users");
        var stagesResponse = await _client.GetAsync("/api/stages");
        var tasksResponse = await _client.GetAsync("/api/tasks");

        var leadsContent = await leadsResponse.Content.ReadAsStringAsync();
        var usersContent = await usersResponse.Content.ReadAsStringAsync();
        var stagesContent = await stagesResponse.Content.ReadAsStringAsync();
        var tasksContent = await tasksResponse.Content.ReadAsStringAsync();

        var leads = JsonSerializer.Deserialize<List<Lead>>(leadsContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var users = JsonSerializer.Deserialize<List<User>>(usersContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var stages = JsonSerializer.Deserialize<List<Stage>>(stagesContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var tasks = JsonSerializer.Deserialize<List<Core.Entities.Task>>(tasksContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert - All results should only contain Org 1 data
        Assert.NotNull(leads);
        Assert.NotNull(users);
        Assert.NotNull(stages);
        Assert.NotNull(tasks);

        Assert.All(leads, lead => Assert.Equal(_orgId1, lead.OrganizationId));
        Assert.All(users, user => Assert.Equal(_orgId1, user.OrganizationId));
        Assert.All(stages, stage => Assert.Equal(_orgId1, stage.OrganizationId));
        Assert.All(tasks, task => Assert.Equal(_orgId1, task.OrganizationId));
    }

    public void Dispose()
    {
        _client?.Dispose();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        context.Database.EnsureDeleted();
    }
}
