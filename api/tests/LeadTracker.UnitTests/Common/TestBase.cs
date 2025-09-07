using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using System.IO;

namespace LeadTracker.UnitTests.Common;

/// <summary>
/// Base class for unit tests with proper data cleanup
/// </summary>
public abstract class TestBase : IDisposable
{
    protected readonly DbContextOptions<LeadTrackerDbContext> DbContextOptions;
    protected readonly LeadTrackerDbContext Context;
    protected readonly string DatabaseName;

    protected TestBase()
    {
        // Generate unique database name for each test class
        DatabaseName = "TestDb_" + Guid.NewGuid().ToString();
        
        var connectionString = $"Host=localhost;Port=5434;Database={DatabaseName};Username=postgres;Password=postgres";
        DbContextOptions = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        Context = new LeadTrackerDbContext(DbContextOptions);
        
        // Ensure database is created with schema
        Context.Database.EnsureCreated();
    }

    /// <summary>
    /// Clean up test data before each test method
    /// </summary>
    protected virtual async Task CleanupAsync()
    {
        try
        {
            // Remove all test data in correct order (respecting foreign key constraints)
            Context.BusinessUsers.RemoveRange(Context.BusinessUsers);
            Context.Users.RemoveRange(Context.Users);
            Context.Organizations.RemoveRange(Context.Organizations);
            Context.Leads.RemoveRange(Context.Leads);
            Context.Stages.RemoveRange(Context.Stages);
            Context.Tasks.RemoveRange(Context.Tasks);
            
            // Clear Identity tables
            Context.UserRoles.RemoveRange(Context.UserRoles);
            Context.UserClaims.RemoveRange(Context.UserClaims);
            Context.UserLogins.RemoveRange(Context.UserLogins);
            Context.UserTokens.RemoveRange(Context.UserTokens);
            Context.RoleClaims.RemoveRange(Context.RoleClaims);
            Context.Roles.RemoveRange(Context.Roles);
            Context.Users.RemoveRange(Context.Users);
            
            await Context.SaveChangesAsync();
        }
        catch (Exception)
        {
            // Ignore cleanup errors
        }
    }

    /// <summary>
    /// Clean up test data after each test method
    /// </summary>
    protected virtual async Task CleanupAfterTestAsync()
    {
        await CleanupAsync();
    }

    public virtual void Dispose()
    {
        try
        {
            CleanupAsync().Wait();
        }
        catch (Exception)
        {
            // Ignore cleanup errors during disposal
        }
        finally
        {
            Context.Dispose();
            
            // Drop the test database to clean up
            try
            {
                var connectionString = $"Host=localhost;Port=5434;Database=postgres;Username=postgres;Password=postgres";
                using var masterContext = new LeadTrackerDbContext(new DbContextOptionsBuilder<LeadTrackerDbContext>()
                    .UseNpgsql(connectionString)
                    .Options);
                
                masterContext.Database.ExecuteSqlRaw($"DROP DATABASE IF EXISTS \"{DatabaseName}\"");
            }
            catch (Exception)
            {
                // Ignore database drop errors
            }
        }
    }
}
