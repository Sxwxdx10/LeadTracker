using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Base class for integration tests with PostgreSQL
/// </summary>
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected readonly PostgreSqlContainer _postgresContainer;
    protected readonly LeadTrackerDbContext _context;
    protected readonly IServiceProvider _serviceProvider;

    protected IntegrationTestBase()
    {
        // Create PostgreSQL container
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("leadtracker_test")
            .WithUsername("test")
            .WithPassword("test")
            .WithPortBinding(5432, true)
            .Build();

        // Configure services
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging(builder => builder.AddConsole());
        
        // Add DbContext with PostgreSQL
        services.AddDbContext<LeadTrackerDbContext>(options =>
        {
            options.UseNpgsql(_postgresContainer.GetConnectionString());
            options.EnableSensitiveDataLogging();
        });

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<LeadTrackerDbContext>();
    }

    public async Task InitializeAsync()
    {
        // Start PostgreSQL container
        await _postgresContainer.StartAsync();
        
        // Ensure database is created and migrations are applied
        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        // Clean up
        await _context.DisposeAsync();
        await _postgresContainer.DisposeAsync();
    }

    /// <summary>
    /// Clean up test data after each test
    /// </summary>
    protected async Task CleanupAsync()
    {
        // Delete all data in reverse order of dependencies
        _context.Tasks.RemoveRange(_context.Tasks);
        _context.Leads.RemoveRange(_context.Leads);
        _context.Stages.RemoveRange(_context.Stages);
        _context.BusinessUsers.RemoveRange(_context.BusinessUsers);
        _context.Organizations.RemoveRange(_context.Organizations);
        
        await _context.SaveChangesAsync();
    }
}
