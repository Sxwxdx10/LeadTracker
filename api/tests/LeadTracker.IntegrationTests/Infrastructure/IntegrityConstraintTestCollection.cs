using Xunit;
using Testcontainers.PostgreSql;
using Testcontainers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Collection definition for integrity constraint tests to ensure they run in isolation
/// These tests should not share data with other test collections
/// </summary>
[CollectionDefinition("IntegrityConstraintTests")]
public class IntegrityConstraintTestCollection : ICollectionFixture<IntegrityConstraintTestFixture>
{
}

/// <summary>
/// Test fixture for integrity constraint tests with transaction-based isolation
/// </summary>
public class IntegrityConstraintTestFixture : IAsyncLifetime
{
    public PostgreSqlContainer PostgreSqlContainer { get; private set; } = null!;
    public LeadTrackerDbContext Context { get; set; } = null!;
    public IServiceProvider ServiceProvider { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        // Set testing environment variables FIRST, before creating any services
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("DOTNET_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("TESTING_MODE", "true");
        
        // Create PostgreSQL container with unique database name
        var uniqueDbName = $"leadtracker_integrity_test_{Guid.NewGuid():N}";
        PostgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase(uniqueDbName)
            .WithUsername("test")
            .WithPassword("test")
            .WithPortBinding(5432, true)
            .Build();

        // Start the container
        await PostgreSqlContainer.StartAsync();

        // Wait for PostgreSQL to be ready with retry mechanism
        await WaitForPostgreSQLReady();
        
        // Configure services
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging(builder => builder.AddConsole());
        
        // Add DbContext with PostgreSQL connection string and disable tenant filtering for tests
        services.AddDbContext<LeadTrackerDbContext>(options =>
        {
            options.UseNpgsql(PostgreSqlContainer.GetConnectionString());
            options.EnableSensitiveDataLogging();
        });
        
        // Override DbContext registration to use the constructor that disables tenant filtering
        services.AddScoped<LeadTrackerDbContext>(provider =>
        {
            var options = provider.GetRequiredService<DbContextOptions<LeadTrackerDbContext>>();
            return new LeadTrackerDbContext(options, disableTenantFiltering: true);
        });

        ServiceProvider = services.BuildServiceProvider();
        Context = ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Ensure database is created and migrations are applied
        await Context.Database.EnsureCreatedAsync();
    }

    private async Task WaitForPostgreSQLReady()
    {
        var maxAttempts = 30;
        var delay = TimeSpan.FromSeconds(2);

        for (int i = 0; i < maxAttempts; i++)
        {
            try
            {
                using var testContext = new LeadTrackerDbContext(new DbContextOptionsBuilder<LeadTrackerDbContext>()
                    .UseNpgsql(PostgreSqlContainer.GetConnectionString())
                    .Options, disableTenantFiltering: true);
                
                await testContext.Database.CanConnectAsync();
                return; // Database is ready
            }
            catch (Exception)
            {
                if (i == maxAttempts - 1)
                    throw; // Last attempt failed
                
                await Task.Delay(delay);
            }
        }
    }

    /// <summary>
    /// Start a transaction for test isolation
    /// </summary>
    public async Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> StartTransactionAsync()
    {
        return await Context.Database.BeginTransactionAsync();
    }

    public async Task DisposeAsync()
    {
        // Clean up
        if (Context != null)
        {
            await Context.DisposeAsync();
        }
        
        if (ServiceProvider != null)
        {
            if (ServiceProvider is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
        
        if (PostgreSqlContainer != null)
        {
            await PostgreSqlContainer.DisposeAsync();
        }
    }
}
