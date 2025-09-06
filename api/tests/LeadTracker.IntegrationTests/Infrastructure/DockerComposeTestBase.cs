using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure.Data;
using Xunit;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Base class for integration tests with Docker Compose PostgreSQL
/// </summary>
public abstract class DockerComposeTestBase : IAsyncLifetime
{
    protected readonly LeadTrackerDbContext _context;
    protected readonly IServiceProvider _serviceProvider;

    // Configuration pour Docker Compose
    private const string ConnectionString = "Host=localhost;Port=5433;Database=leadtracker_test;Username=test;Password=test;";

    protected DockerComposeTestBase()
    {
        // Configure services
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging(builder => builder.AddConsole());
        
        // Add DbContext with PostgreSQL (Docker Compose)
        services.AddDbContext<LeadTrackerDbContext>(options =>
        {
            options.UseNpgsql(ConnectionString);
            options.EnableSensitiveDataLogging();
        });

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<LeadTrackerDbContext>();
    }

    public async Task InitializeAsync()
    {
        // Wait for database to be ready
        await WaitForDatabaseAsync();
        
        // Ensure database is created and migrations are applied
        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        // Clean up
        await _context.DisposeAsync();
    }

    /// <summary>
    /// Wait for PostgreSQL to be ready
    /// </summary>
    private async Task WaitForDatabaseAsync()
    {
        var maxAttempts = 30;
        var delay = TimeSpan.FromSeconds(2);

        for (int i = 0; i < maxAttempts; i++)
        {
            try
            {
                await _context.Database.CanConnectAsync();
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
    /// Clean up test data after each test
    /// </summary>
    protected async Task CleanupAsync()
    {
        // Use raw SQL to delete all data in reverse order of dependencies
        // This ensures we delete ALL data, not just what's loaded in memory
        // Safe for test databases that are isolated per test run
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Tasks\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Leads\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Stages\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"BusinessUsers\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Organizations\"");
        
        // Also clean up Identity tables
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserTokens\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserRoles\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserLogins\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserClaims\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Users\"");
    }

    /// <summary>
    /// Generate a unique domain for testing
    /// </summary>
    protected string GenerateUniqueDomain()
    {
        return $"test-{Guid.NewGuid():N}.com";
    }

    /// <summary>
    /// Generate a unique email for testing
    /// </summary>
    protected string GenerateUniqueEmail(string prefix = "test")
    {
        return $"{prefix}-{Guid.NewGuid():N}@example.com";
    }
}
