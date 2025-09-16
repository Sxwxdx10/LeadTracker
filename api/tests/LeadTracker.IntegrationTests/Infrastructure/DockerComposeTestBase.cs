using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using Xunit;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Base class for integration tests with Docker Compose PostgreSQL using shared fixture
/// </summary>
[Collection("DockerComposeTests")]
public abstract class DockerComposeTestBase : IAsyncLifetime
{
    protected readonly DockerComposeTestFixture _fixture;
    protected LeadTrackerDbContext _context => _fixture.Context;
    protected IServiceProvider _serviceProvider => _fixture.ServiceProvider;

    protected DockerComposeTestBase(DockerComposeTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        // Database is already initialized by the fixture
        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        // Clean up is handled by the fixture
        await Task.CompletedTask;
    }

    /// <summary>
    /// Clean up test data after each test
    /// </summary>
    protected async Task CleanupAsync()
    {
        // Use raw SQL to delete all data in correct order to respect foreign key constraints
        // Delete in reverse dependency order: child tables first, parent tables last
        
        // Identity tables first (ASP.NET Identity)
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserTokens\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserRoles\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserLogins\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserClaims\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Users\"");
        
        // Application tables in dependency order
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Tasks\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Leads\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Stages\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"BusinessUsers\"");
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Organizations\"");
        
        // Clean up roles last (referenced by UserRoles)
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Roles\" WHERE \"Name\" NOT IN ('USER', 'ADMIN')");
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
