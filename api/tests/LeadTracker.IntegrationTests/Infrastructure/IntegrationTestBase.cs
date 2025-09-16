using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using LeadTracker.Infrastructure;
using Xunit;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Base class for integration tests with PostgreSQL using shared fixture
/// </summary>
[Collection("PostgreSqlTests")]
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected readonly PostgreSqlTestFixture _fixture;
    protected LeadTrackerDbContext _context => _fixture.Context;
    protected IServiceProvider _serviceProvider => _fixture.ServiceProvider;
    protected IDbContextTransaction? _transaction;

    protected IntegrationTestBase(PostgreSqlTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        // Start a transaction for test isolation
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task DisposeAsync()
    {
        // Rollback transaction if it exists
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
        }
    }

    /// <summary>
    /// Clean up test data after each test
    /// </summary>
    protected async Task CleanupAsync()
    {
        if (_context == null) return;
        
        // Delete all data in reverse order of dependencies (children first, then parents)
        _context.Tasks.RemoveRange(_context.Tasks);
        _context.Leads.RemoveRange(_context.Leads);
        _context.Stages.RemoveRange(_context.Stages);
        _context.BusinessUsers.RemoveRange(_context.BusinessUsers);
        _context.Organizations.RemoveRange(_context.Organizations);
        
        await _context.SaveChangesAsync();
    }
}
