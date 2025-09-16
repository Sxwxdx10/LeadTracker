using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using Xunit;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Base class for integrity constraint tests with transaction-based isolation
/// Each test runs in its own transaction that gets rolled back after the test
/// </summary>
public abstract class IntegrityConstraintTestBase : IAsyncLifetime
{
    protected readonly IntegrityConstraintTestFixture _fixture;
    protected LeadTrackerDbContext Context => _fixture.Context;
    protected IServiceProvider ServiceProvider => _fixture.ServiceProvider;
    private Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? _transaction;

    protected IntegrityConstraintTestBase(IntegrityConstraintTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        // Create a new context for this test to ensure complete isolation
        var options = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseNpgsql(_fixture.PostgreSqlContainer.GetConnectionString())
            .EnableSensitiveDataLogging()
            .Options;
        
        // Create a new context instance for this test
        var testContext = new LeadTrackerDbContext(options, disableTenantFiltering: true);
        
        // Start a transaction for this test to ensure isolation
        _transaction = await testContext.Database.BeginTransactionAsync();
        
        // Replace the shared context with our isolated one
        _fixture.Context = testContext;
    }

    public async Task DisposeAsync()
    {
        // Rollback the transaction to clean up all test data
        if (_transaction != null)
        {
            try
            {
                await _transaction.RollbackAsync();
            }
            catch (ObjectDisposedException)
            {
                // Transaction already disposed, ignore
            }
            finally
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
        
        // Dispose the test context
        if (_fixture.Context != null)
        {
            await _fixture.Context.DisposeAsync();
        }
    }

    /// <summary>
    /// Helper method to clean up any data that might have been created during the test
    /// This is called automatically in DisposeAsync, but can be called manually if needed
    /// </summary>
    protected async Task CleanupTestDataAsync()
    {
        try
        {
            // Clean in reverse dependency order to avoid foreign key constraint violations
            await Context.UserRoles.ExecuteDeleteAsync();
            await Context.Tasks.ExecuteDeleteAsync();
            await Context.Leads.ExecuteDeleteAsync();
            await Context.Stages.ExecuteDeleteAsync();
            await Context.BusinessUsers.ExecuteDeleteAsync();
            await Context.Users.ExecuteDeleteAsync();
            await Context.Organizations.ExecuteDeleteAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not clean test data: {ex.Message}");
        }
    }
}
