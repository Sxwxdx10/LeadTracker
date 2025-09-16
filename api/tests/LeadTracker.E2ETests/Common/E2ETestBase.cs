using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using LeadTracker.Api;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace LeadTracker.E2ETests.Common;

/// <summary>
/// Base class for all end-to-end tests
/// Provides full application setup with real database and HTTP client
/// </summary>
public abstract class E2ETestBase : IAsyncLifetime
{
    protected WebApplicationFactory<Program> Factory { get; private set; } = null!;
    protected HttpClient Client { get; private set; } = null!;
    protected PostgreSqlContainer PostgreSqlContainer { get; private set; } = null!;
    protected IServiceScope Scope { get; private set; } = null!;
    protected LeadTrackerDbContext Context { get; private set; } = null!;

    public virtual async Task InitializeAsync()
    {
        // Start PostgreSQL container
        PostgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("leadtracker_e2e")
            .WithUsername("e2e_user")
            .WithPassword("e2e_password")
            .WithPortBinding(5432, true)
            .Build();

        await PostgreSqlContainer.StartAsync();

        // Create factory with E2E database
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Add E2E database
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                        options.UseNpgsql(PostgreSqlContainer.GetConnectionString())
                               .EnableSensitiveDataLogging());
                });
            });

        // Create HTTP client and context
        Client = Factory.CreateClient();
        Scope = Factory.Services.CreateScope();
        Context = Scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Ensure database is created and seeded
        await Context.Database.EnsureCreatedAsync();
        await SeedE2EDataAsync();
    }

    public virtual async Task DisposeAsync()
    {
        // Clean up context
        if (Context != null)
        {
            await Context.DisposeAsync();
        }

        // Clean up scope
        if (Scope != null)
        {
            Scope.Dispose();
        }

        // Clean up client
        if (Client != null)
        {
            Client.Dispose();
        }

        // Clean up factory
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }

        // Clean up container
        if (PostgreSqlContainer != null)
        {
            await PostgreSqlContainer.DisposeAsync();
        }
    }

    /// <summary>
    /// Seed E2E test data
    /// Override this method to provide specific test data
    /// </summary>
    protected virtual async Task SeedE2EDataAsync()
    {
        // Default E2E data seeding
        // Override in derived classes for specific test scenarios
        await Task.CompletedTask;
    }

    /// <summary>
    /// Create a test user for E2E scenarios
    /// </summary>
    protected async Task<Guid> CreateTestUserAsync(string email, string organizationDomain)
    {
        // Implementation for creating test users
        // This would be used in E2E scenarios
        await Task.CompletedTask;
        return Guid.NewGuid();
    }

    /// <summary>
    /// Create a test organization for E2E scenarios
    /// </summary>
    protected async Task<Guid> CreateTestOrganizationAsync(string domain)
    {
        // Implementation for creating test organizations
        // This would be used in E2E scenarios
        await Task.CompletedTask;
        return Guid.NewGuid();
    }
}
