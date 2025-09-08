using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using LeadTracker.Infrastructure;
using System.Net.Http.Json;
using System.Text.Json;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Base class for controller integration tests
/// </summary>
public abstract class ControllerIntegrationTestBase : IAsyncLifetime
{
    protected WebApplicationFactory<Program> Factory { get; private set; } = null!;
    protected HttpClient Client { get; private set; } = null!;
    protected LeadTrackerDbContext Context { get; private set; } = null!;

    protected virtual void ConfigureServices(IServiceCollection services)
    {
        // Remove the existing DbContext registration
        var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
        if (descriptor != null)
            services.Remove(descriptor);

        // Add in-memory database for testing
        services.AddDbContext<LeadTrackerDbContext>(options =>
        {
            options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid().ToString());
        });
    }

    protected virtual void ConfigureWebHostBuilder(IWebHostBuilder builder)
    {
        builder.ConfigureServices(ConfigureServices);
    }

    public virtual async Task InitializeAsync()
    {
        Factory = new WebApplicationFactory<Program>();
        Factory = Factory.WithWebHostBuilder(ConfigureWebHostBuilder);
        
        Client = Factory.CreateClient();
        
        // Get DbContext from the factory
        var scope = Factory.Services.CreateScope();
        Context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        await Context.Database.EnsureCreatedAsync();
        
        // Clear any cached data to ensure fresh state
        Context.ChangeTracker.Clear();
    }

    public virtual async Task DisposeAsync()
    {
        if (Context != null)
        {
            await Context.Database.EnsureDeletedAsync();
            Context.Dispose();
        }
        
        Client?.Dispose();
        Factory?.Dispose();
    }

    /// <summary>
    /// Helper method to deserialize JSON responses
    /// </summary>
    protected async Task<T?> DeserializeResponse<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    /// <summary>
    /// Helper method to create a test organization
    /// </summary>
    protected async Task<Core.Entities.Organization> CreateTestOrganizationAsync(string domain = "test-company")
    {
        var organization = new Core.Entities.Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Company",
            Domain = domain,
            Description = "Test organization for integration tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Organizations.Add(organization);
        await Context.SaveChangesAsync();
        
        return organization;
    }

    /// <summary>
    /// Helper method to create a test user
    /// </summary>
    protected async Task<Core.Entities.ApplicationUser> CreateTestUserAsync(
        string email = "test@example.com",
        string firstName = "Test",
        string lastName = "User",
        Guid? organizationId = null)
    {
        var orgId = organizationId ?? (await CreateTestOrganizationAsync()).Id;
        
        var user = new Core.Entities.ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            UserName = email,
            EmailConfirmed = true,
            IsActive = true,
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Users.Add(user);
        await Context.SaveChangesAsync();
        
        return user;
    }
}
