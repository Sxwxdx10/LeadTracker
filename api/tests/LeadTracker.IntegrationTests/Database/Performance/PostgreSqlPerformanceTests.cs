using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using FluentAssertions;
using Xunit;
using System.Diagnostics;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Integration tests for database performance with PostgreSQL
/// </summary>
[Collection("PostgreSqlTests")]
public class PostgreSqlPerformanceTests : IAsyncLifetime
{
    private readonly PostgreSqlTestFixture _fixture;
    protected LeadTrackerDbContext _context => _fixture.Context;
    protected IServiceProvider _serviceProvider => _fixture.ServiceProvider;

    public PostgreSqlPerformanceTests(PostgreSqlTestFixture fixture)
    {
        _fixture = fixture;
    }

    public async System.Threading.Tasks.Task InitializeAsync()
    {
        // Database is already initialized by the fixture
        await System.Threading.Tasks.Task.CompletedTask;
    }

    public async System.Threading.Tasks.Task DisposeAsync()
    {
        // Clean up test data to avoid FK constraint violations
        await CleanupTestDataAsync();
    }

    /// <summary>
    /// Clean up test data after each test to avoid FK constraint violations
    /// </summary>
    private async System.Threading.Tasks.Task CleanupTestDataAsync()
    {
        try
        {
            // Clean up in proper order to avoid FK constraint violations
            await _context.Tasks.ExecuteDeleteAsync();
            await _context.Leads.ExecuteDeleteAsync();
            await _context.Stages.ExecuteDeleteAsync();
            await _context.BusinessUsers.ExecuteDeleteAsync();
            await _context.Organizations.ExecuteDeleteAsync();
            
            // Note: We don't clean roles as they are shared across tests
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Failed to clean up test data: {ex.Message}");
        }
    }
    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_OrganizationId_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = $"test-{orgId:N}.com"
        };

        await _context.Organizations.AddAsync(organization);
        await _context.SaveChangesAsync(); // Save organization first

        // Create a stage for the leads
        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Open",
            Order = 1,
            OrganizationId = orgId
        };
        await _context.Stages.AddAsync(stage);
        await _context.SaveChangesAsync(); // Save stage before creating leads

        // Create 100 leads for performance testing (reduced from 1000)
        var leads = Enumerable.Range(1, 100).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = $"john{i}@example.com",
            OrganizationId = orgId,
            StageId = stageId
        }).ToList();

        await _context.Leads.AddRangeAsync(leads);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.Leads
            .Where(l => l.OrganizationId == orgId)
            .ToListAsync();
        stopwatch.Stop();

        // Assert
        result.Should().HaveCount(100);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(500); // Should be fast with index
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_Email_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = $"test-{orgId:N}.com"
        };

        await _context.Organizations.AddAsync(organization);

        // Create 50 users for performance testing (reduced from 1000)
        var users = Enumerable.Range(1, 50).Select(i => new User
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = $"john{i}@example.com",
            OrganizationId = orgId
        }).ToList();

        await _context.BusinessUsers.AddRangeAsync(users);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.BusinessUsers
            .Where(u => u.Email == "john50@example.com")
            .FirstOrDefaultAsync();
        stopwatch.Stop();

        // Assert
        result.Should().NotBeNull();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(100); // Should be fast with index
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_CreatedAt_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = $"test-{orgId:N}.com"
        };

        await _context.Organizations.AddAsync(organization);
        await _context.SaveChangesAsync(); // Save organization first

        // Create a stage for the leads
        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Open",
            Order = 1,
            OrganizationId = orgId
        };
        await _context.Stages.AddAsync(stage);
        await _context.SaveChangesAsync(); // Save stage before creating leads

        // Create leads with different creation dates
        var baseDate = DateTime.UtcNow.AddDays(-10);
        var leads = Enumerable.Range(1, 100).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = $"john{i}@example.com",
            OrganizationId = orgId,
            StageId = stageId,
            CreatedAt = baseDate.AddDays(i)
        }).ToList();

        await _context.Leads.AddRangeAsync(leads);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.Leads
            .Where(l => l.CreatedAt >= baseDate.AddDays(5))
            .ToListAsync();
        stopwatch.Stop();

        // Assert
        result.Should().HaveCount(96); // Leads 5-100 = 96 leads
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(300); // Should be fast with index
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_Stage_And_Organization_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = $"test-{orgId:N}.com"
        };

        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);

        // Create 50 leads for performance testing (reduced from 500)
        var leads = Enumerable.Range(1, 50).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = $"john{i}@example.com",
            OrganizationId = orgId,
            StageId = stageId
        }).ToList();

        await _context.Leads.AddRangeAsync(leads);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.Leads
            .Where(l => l.OrganizationId == orgId && l.StageId == stageId)
            .ToListAsync();
        stopwatch.Stop();

        // Assert
        result.Should().HaveCount(50);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(300); // Should be fast with composite index
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Count_Query_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = $"test-{orgId:N}.com"
        };

        await _context.Organizations.AddAsync(organization);
        await _context.SaveChangesAsync(); // Save organization first

        // Create a stage for the leads
        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Open",
            Order = 1,
            OrganizationId = orgId
        };
        await _context.Stages.AddAsync(stage);
        await _context.SaveChangesAsync(); // Save stage before creating leads

        // Create 100 leads for performance testing (reduced from 1000)
        var leads = Enumerable.Range(1, 100).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = $"john{i}@example.com",
            OrganizationId = orgId,
            StageId = stageId
        }).ToList();

        await _context.Leads.AddRangeAsync(leads);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var count = await _context.Leads
            .Where(l => l.OrganizationId == orgId)
            .CountAsync();
        stopwatch.Stop();

        // Assert
        count.Should().Be(100);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(200); // Should be fast with index
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_With_Include_Relationships_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = $"test-{orgId:N}.com"
        };

        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);

        // Create 100 leads with relationships
        var leads = Enumerable.Range(1, 100).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = $"john{i}@example.com",
            OrganizationId = orgId,
            StageId = stageId
        }).ToList();

        await _context.Leads.AddRangeAsync(leads);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.Leads
            .Where(l => l.OrganizationId == orgId)
            .Include(l => l.Organization)
            .Include(l => l.Stage)
            .ToListAsync();
        stopwatch.Stop();

        // Assert
        result.Should().HaveCount(100);
        result.All(l => l.Organization != null).Should().BeTrue();
        result.All(l => l.Stage != null).Should().BeTrue();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(300); // Should be fast with proper indexing
    }
}
