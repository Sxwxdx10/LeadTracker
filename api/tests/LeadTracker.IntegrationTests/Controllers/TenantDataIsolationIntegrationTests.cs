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
public class TenantDataIsolationIntegrationTests : IDisposable
{
    private readonly TenantIsolationTestFixture _fixture;
    private readonly HttpClient _client;
    private readonly Guid _orgId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _orgId2 = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public TenantDataIsolationIntegrationTests(TenantIsolationTestFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.Factory.CreateClient();
        
        // Seed data using the same DbContext as the application
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        _fixture.SeedDataForTest(context);
        
        // Force the context to clear its cache and reload data from database
        context.ChangeTracker.Clear();
        
        // Verify data is accessible from the same context
        var orgCount = context.Organizations.Count();
        var userCount = context.BusinessUsers.Count();
        Console.WriteLine($"Post-seeding verification in test constructor: {orgCount} orgs, {userCount} users");
        
        // Store the context for later use in tests
        _fixture.SetSharedContext(context);
    }


    [Fact]
    public async System.Threading.Tasks.Task GetLeads_WithOrg1Header_ReturnsOnlyOrg1Leads()
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
    public async System.Threading.Tasks.Task GetLeads_WithOrg2Header_ReturnsOnlyOrg2Leads()
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
    public async System.Threading.Tasks.Task GetLeads_WithInvalidOrgHeader_ReturnsEmptyList()
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
    public async System.Threading.Tasks.Task GetLeads_WithoutOrgHeader_ReturnsEmptyList()
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
    public async System.Threading.Tasks.Task GetUsers_WithOrg1Header_ReturnsOnlyOrg1Users()
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
    public async System.Threading.Tasks.Task GetStages_WithOrg2Header_ReturnsOnlyOrg2Stages()
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
    public async System.Threading.Tasks.Task GetTasks_WithOrg1Header_ReturnsOnlyOrg1Tasks()
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
    public async System.Threading.Tasks.Task CrossTenantAccess_AttemptingToAccessOtherOrgData_ReturnsEmptyResults()
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
    }
}
