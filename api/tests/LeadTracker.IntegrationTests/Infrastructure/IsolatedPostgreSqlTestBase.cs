using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure;
using Testcontainers.PostgreSql;
using Xunit;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Base class for isolated PostgreSQL integration tests with proper transaction handling
/// </summary>
public abstract class IsolatedPostgreSqlTestBase : IAsyncLifetime
{
    protected readonly PostgreSqlContainer _postgresContainer;
    protected LeadTrackerDbContext _context = null!;
    protected IServiceProvider _serviceProvider = null!;
    protected IDbContextTransaction _transaction = null!;

    protected IsolatedPostgreSqlTestBase()
    {
        // Create PostgreSQL container with unique database name to avoid conflicts
        var uniqueDbName = $"leadtracker_test_{Guid.NewGuid():N}";
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase(uniqueDbName)
            .WithUsername("test")
            .WithPassword("test")
            .WithPortBinding(5432, true)
            .Build();
    }

    public async Task InitializeAsync()
    {
        // Start PostgreSQL container
        await _postgresContainer.StartAsync();
        
        // Configure services after container is started
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging(builder => builder.AddConsole());
        
        // Add DbContext with PostgreSQL connection string
        services.AddDbContext<LeadTrackerDbContext>(options =>
        {
            options.UseNpgsql(_postgresContainer.GetConnectionString());
            options.EnableSensitiveDataLogging();
        });

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Ensure database is created and migrations are applied
        await _context.Database.EnsureCreatedAsync();
        
        // Start a transaction for test isolation
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task DisposeAsync()
    {
        // Rollback transaction to clean up test data
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
        }
        
        // Clean up
        if (_context != null)
        {
            await _context.DisposeAsync();
        }
        
        if (_serviceProvider != null)
        {
            if (_serviceProvider is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
        
        await _postgresContainer.DisposeAsync();
    }

    /// <summary>
    /// Clean up test data after each test
    /// </summary>
    protected async Task CleanupAsync()
    {
        if (_context == null) return;
        
        // Delete all data in reverse order of dependencies (children first, then parents)
        await _context.Tasks.ExecuteDeleteAsync();
        await _context.Leads.ExecuteDeleteAsync();
        await _context.Stages.ExecuteDeleteAsync();
        await _context.BusinessUsers.ExecuteDeleteAsync();
        await _context.Users.ExecuteDeleteAsync();
        await _context.Organizations.ExecuteDeleteAsync();
        
        // Note: We don't clean roles as they are shared across tests
    }

    /// <summary>
    /// Create a test organization with unique domain
    /// </summary>
    protected async Task<Core.Entities.Organization> CreateTestOrganizationAsync(string? domain = null)
    {
        var uniqueDomain = domain ?? $"test-company-{Guid.NewGuid():N}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        
        var organization = new Core.Entities.Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Company",
            Domain = uniqueDomain,
            Description = "Test organization for integration tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();
        
        return organization;
    }

    /// <summary>
    /// Create a test user with unique email
    /// </summary>
    protected async Task<Core.Entities.User> CreateTestUserAsync(
        string? email = null,
        string firstName = "Test",
        string lastName = "User",
        Guid? organizationId = null)
    {
        var orgId = organizationId ?? (await CreateTestOrganizationAsync()).Id;
        var uniqueEmail = email ?? $"test.user.{Guid.NewGuid():N}@test-company.com";
        
        var user = new Core.Entities.User
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            FirstName = firstName,
            LastName = lastName,
            Email = uniqueEmail,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.BusinessUsers.Add(user);
        await _context.SaveChangesAsync();
        
        return user;
    }

    /// <summary>
    /// Create a test stage with unique order
    /// </summary>
    protected async Task<Core.Entities.Stage> CreateTestStageAsync(
        string name = "Test Stage",
        Guid? organizationId = null,
        int? order = null)
    {
        var orgId = organizationId ?? (await CreateTestOrganizationAsync()).Id;
        
        // Get the highest order number for this organization
        var maxOrder = await _context.Stages
            .Where(s => s.OrganizationId == orgId)
            .MaxAsync(s => (int?)s.Order) ?? 0;
        
        var stageOrder = order ?? (maxOrder + 1);
        
        var stage = new Core.Entities.Stage
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = name,
            Order = stageOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Stages.Add(stage);
        await _context.SaveChangesAsync();
        
        return stage;
    }

    /// <summary>
    /// Ensure roles exist for testing
    /// </summary>
    protected async Task EnsureRolesExistAsync()
    {
        await EnsureRoleExistsAsync("USER");
        await EnsureRoleExistsAsync("ADMIN");
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        try
        {
            var existingRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.NormalizedName == roleName.ToUpper());
                
            if (existingRole == null)
            {
                var role = new Microsoft.AspNetCore.Identity.IdentityRole<Guid> 
                { 
                    Id = Guid.NewGuid(), 
                    Name = roleName, 
                    NormalizedName = roleName.ToUpper(), 
                    ConcurrencyStamp = $"{roleName.ToLower()}-role-stamp-{Guid.NewGuid()}" 
                };
                
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key value violates unique constraint") == true)
        {
            // Role already exists due to race condition, ignore
            Console.WriteLine($"Role {roleName} already exists (race condition handled)");
        }
    }
}
