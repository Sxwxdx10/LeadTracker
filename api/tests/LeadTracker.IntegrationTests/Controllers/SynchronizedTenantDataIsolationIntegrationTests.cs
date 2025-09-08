using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using System.Text.Json;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using LeadTracker.IntegrationTests.Services;
using LeadTracker.Core.Services;
using Xunit;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Integration tests that demonstrate proper DbContext synchronization
/// between seeding and HTTP requests to solve data isolation issues
/// </summary>
public class SynchronizedTenantDataIsolationIntegrationTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly Guid _orgId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _orgId2 = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public SynchronizedTenantDataIsolationIntegrationTests()
    {
        _factory = new WebApplicationFactory<Program>()
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

                    // Add InMemory database for tests - use a fixed name to ensure same database
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDb_Synchronized");
                        options.EnableSensitiveDataLogging();
                    });

                    // Add test data seeding service
                    services.AddScoped<ITestDataSeeder, TestDataSeeder>();
                    
                    // Add TenantContext and TenantFilterService for testing
                    services.AddScoped<TenantContext>();
                    services.AddScoped<ITenantContext>(provider => provider.GetRequiredService<TenantContext>());
                    services.AddScoped<ITenantFilterService, TenantFilterService>();
                });
            });

        _client = _factory.CreateClient();
        
        // Seed data using the service to ensure proper synchronization
        SeedDataWithService().Wait();
    }

    /// <summary>
    /// Seeds data using the TestDataSeeder service which ensures
    /// proper DbContext synchronization and data isolation
    /// </summary>
    private async System.Threading.Tasks.Task SeedDataWithService()
    {
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<ITestDataSeeder>();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Use the service to seed data with proper synchronization
        await seeder.SeedDataAsync(context);
        
        Console.WriteLine("Data seeded using TestDataSeeder service with proper synchronization");
    }

    [Fact]
    public async System.Threading.Tasks.Task GetLeads_WithOrg1Header_ReturnsOnlyOrg1Leads()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Configure TenantContext for this test
        using var scope = _factory.Services.CreateScope();
        var tenantContext = scope.ServiceProvider.GetRequiredService<TenantContext>();
        tenantContext.OrganizationId = _orgId1;
        tenantContext.OrganizationName = "Organization 1";

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

    [Fact]
    public async System.Threading.Tasks.Task VerifyDataIsolation_CrossTenantAccess_ReturnsEmpty()
    {
        // This test verifies that data isolation is working properly
        // by ensuring that data from one organization is not accessible
        // when querying with another organization's header

        // Arrange - Set up headers for org1
        _client.DefaultRequestHeaders.Clear();
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId1.ToString());

        // Act - Get leads for org1
        var org1Response = await _client.GetAsync("/api/leads");
        org1Response.EnsureSuccessStatusCode();
        var org1Content = await org1Response.Content.ReadAsStringAsync();
        var org1Leads = JsonSerializer.Deserialize<List<Lead>>(org1Content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        // Switch to org2
        _client.DefaultRequestHeaders.Clear();
        _client.DefaultRequestHeaders.Add("X-Org-Id", _orgId2.ToString());

        // Act - Get leads for org2
        var org2Response = await _client.GetAsync("/api/leads");
        org2Response.EnsureSuccessStatusCode();
        var org2Content = await org2Response.Content.ReadAsStringAsync();
        var org2Leads = JsonSerializer.Deserialize<List<Lead>>(org2Content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        // Assert - Verify isolation
        Assert.NotNull(org1Leads);
        Assert.NotNull(org2Leads);
        Assert.NotEmpty(org1Leads);
        Assert.NotEmpty(org2Leads);
        
        // Ensure no cross-contamination
        Assert.All(org1Leads, lead => Assert.Equal(_orgId1, lead.OrganizationId));
        Assert.All(org2Leads, lead => Assert.Equal(_orgId2, lead.OrganizationId));
        
        // Verify different data
        var org1Titles = org1Leads.Select(l => l.Title).ToList();
        var org2Titles = org2Leads.Select(l => l.Title).ToList();
        Assert.DoesNotContain(org1Titles, title => org2Titles.Contains(title));
    }

    public void Dispose()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }
}
