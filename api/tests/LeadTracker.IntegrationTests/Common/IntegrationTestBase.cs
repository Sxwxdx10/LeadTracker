using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using LeadTracker.Api;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace LeadTracker.IntegrationTests.Common;

/// <summary>
/// Unified base class for all integration tests
/// Provides common setup and utilities for database and API tests
/// </summary>
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected WebApplicationFactory<Program> Factory { get; private set; } = null!;
    protected IServiceScope Scope { get; private set; } = null!;
    protected LeadTrackerDbContext Context { get; private set; } = null!;
    protected PostgreSqlContainer PostgreSqlContainer { get; private set; } = null!;

    public virtual async Task InitializeAsync()
    {
        // Start PostgreSQL container
        PostgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("leadtracker_test")
            .WithUsername("test")
            .WithPassword("test")
            .WithPortBinding(5432, true)
            .Build();

        await PostgreSqlContainer.StartAsync();

        // Create factory with test database
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

                    // Add test database
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                        options.UseNpgsql(PostgreSqlContainer.GetConnectionString())
                               .EnableSensitiveDataLogging());
                });
            });

        // Create scope and context
        Scope = Factory.Services.CreateScope();
        Context = Scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Ensure database is created
        await Context.Database.EnsureCreatedAsync();
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
    /// Create a new isolated context for this test
    /// </summary>
    protected LeadTrackerDbContext CreateIsolatedContext()
    {
        var options = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseNpgsql(PostgreSqlContainer.GetConnectionString())
            .EnableSensitiveDataLogging()
            .Options;

        return new LeadTrackerDbContext(options, disableTenantFiltering: true);
    }
}
