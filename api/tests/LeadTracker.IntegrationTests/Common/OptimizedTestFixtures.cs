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
/// Optimized database test fixture
/// Provides shared PostgreSQL container for better performance
/// </summary>
public class OptimizedDatabaseTestFixture : IAsyncLifetime
{
    public PostgreSqlContainer PostgreSqlContainer { get; private set; } = null!;
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public IServiceProvider ServiceProvider { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        // Start shared PostgreSQL container
        PostgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("leadtracker_optimized")
            .WithUsername("optimized_user")
            .WithPassword("optimized_password")
            .WithPortBinding(5432, true)
            .Build();

        await PostgreSqlContainer.StartAsync();

        // Create optimized factory
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Add optimized database configuration
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                        options.UseNpgsql(PostgreSqlContainer.GetConnectionString())
                               .EnableSensitiveDataLogging()
                               .EnableServiceProviderCaching(false)); // Disable caching for tests
                });
            });

        ServiceProvider = Factory.Services;
    }

    public async Task DisposeAsync()
    {
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }

        if (PostgreSqlContainer != null)
        {
            await PostgreSqlContainer.DisposeAsync();
        }
    }
}

/// <summary>
/// Optimized API test fixture
/// Uses in-memory database for faster execution
/// </summary>
public class OptimizedApiTestFixture : IAsyncLifetime
{
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public IServiceProvider ServiceProvider { get; private set; } = null!;

    public Task InitializeAsync()
    {
        // Create optimized factory with in-memory database
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Add in-memory database for faster API tests
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                        options.UseInMemoryDatabase("OptimizedApiTestDb_" + Guid.NewGuid().ToString())
                               .EnableSensitiveDataLogging());
                });
            });

        ServiceProvider = Factory.Services;
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }
    }
}

/// <summary>
/// Optimized security test fixture
/// Provides isolated containers for security testing
/// </summary>
public class OptimizedSecurityTestFixture : IAsyncLifetime
{
    public PostgreSqlContainer PostgreSqlContainer { get; private set; } = null!;
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public IServiceProvider ServiceProvider { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        // Start isolated PostgreSQL container for security tests
        PostgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("leadtracker_security")
            .WithUsername("security_user")
            .WithPassword("security_password")
            .WithPortBinding(5432, true)
            .Build();

        await PostgreSqlContainer.StartAsync();

        // Create security-optimized factory
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Add security-optimized database configuration
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                        options.UseNpgsql(PostgreSqlContainer.GetConnectionString())
                               .EnableSensitiveDataLogging()
                               .EnableServiceProviderCaching(false));
                });
            });

        ServiceProvider = Factory.Services;
    }

    public async Task DisposeAsync()
    {
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }

        if (PostgreSqlContainer != null)
        {
            await PostgreSqlContainer.DisposeAsync();
        }
    }
}

/// <summary>
/// Optimized performance test fixture
/// Provides performance-optimized containers
/// </summary>
public class OptimizedPerformanceTestFixture : IAsyncLifetime
{
    public PostgreSqlContainer PostgreSqlContainer { get; private set; } = null!;
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public IServiceProvider ServiceProvider { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        // Start performance-optimized PostgreSQL container
        PostgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("leadtracker_performance")
            .WithUsername("performance_user")
            .WithPassword("performance_password")
            .WithPortBinding(5432, true)
            .Build();

        await PostgreSqlContainer.StartAsync();

        // Create performance-optimized factory
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Add performance-optimized database configuration
                    services.AddDbContext<LeadTrackerDbContext>(options =>
                        options.UseNpgsql(PostgreSqlContainer.GetConnectionString())
                               .EnableSensitiveDataLogging()
                               .EnableServiceProviderCaching(true) // Enable caching for performance
                               .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)); // Disable tracking for performance
                });
            });

        ServiceProvider = Factory.Services;
    }

    public async Task DisposeAsync()
    {
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }

        if (PostgreSqlContainer != null)
        {
            await PostgreSqlContainer.DisposeAsync();
        }
    }
}
