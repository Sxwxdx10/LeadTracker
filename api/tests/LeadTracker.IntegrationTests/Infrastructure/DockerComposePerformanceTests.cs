using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using FluentAssertions;
using Xunit;
using System.Diagnostics;
using UserEntity = LeadTracker.Core.Entities.User;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Integration tests for database performance with Docker Compose PostgreSQL
/// </summary>
public class DockerComposePerformanceTests : DockerComposeTestBase
{
    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_OrganizationId_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = GenerateUniqueDomain()
        };

        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        var userId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail("john"),
            OrganizationId = orgId
        };

        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.BusinessUsers.AddAsync(user);
        await _context.SaveChangesAsync();

        // Create 10 leads for performance testing (reduced for test isolation)
        var leads = Enumerable.Range(1, 10).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail($"lead{i}"),
            OrganizationId = orgId,
            StageId = stageId,
            AssignedUserId = userId
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
        result.Should().HaveCount(10);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(500); // Should be fast with index
        
        // Clean up after test
        await CleanupAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_Email_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = GenerateUniqueDomain()
        };

        await _context.Organizations.AddAsync(organization);

        // Create 10 users for performance testing (reduced for test isolation)
        var users = Enumerable.Range(1, 10).Select(i => new User
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail($"john{i}"),
            OrganizationId = orgId
        }).ToList();

        await _context.BusinessUsers.AddRangeAsync(users);
        await _context.SaveChangesAsync();

        // Act
        var targetEmail = users[9].Email; // Get the 10th user's email
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.BusinessUsers
            .Where(u => u.Email == targetEmail)
            .FirstOrDefaultAsync();
        stopwatch.Stop();

        // Assert
        result.Should().NotBeNull();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(100); // Should be fast with index
        
        // Clean up after test
        await CleanupAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_CreatedAt_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();

        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = GenerateUniqueDomain()
        };

        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        var userId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail("john"),
            OrganizationId = orgId
        };

        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.BusinessUsers.AddAsync(user);
        await _context.SaveChangesAsync();

        // Create leads with different creation dates
        var now = DateTime.UtcNow;
        var leads = Enumerable.Range(1, 10).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail($"lead{i}"),
            OrganizationId = orgId,
            StageId = stageId,
            AssignedUserId = userId,
            CreatedAt = now.AddDays(-i) // Create leads from today going back
        }).ToList();

        await _context.Leads.AddRangeAsync(leads);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.Leads
            .Where(l => l.CreatedAt >= now.AddDays(-5))
            .ToListAsync();
        stopwatch.Stop();

        // Assert
        result.Should().HaveCount(5); // Only leads from last 5 days
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(200); // Should be fast with index
        
        // Clean up after test
        await CleanupAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_By_Stage_And_Organization_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = GenerateUniqueDomain()
        };

        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        var userId = Guid.NewGuid();
        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.SaveChangesAsync();

        // Create 10 leads for performance testing (reduced for test isolation)
        var leads = Enumerable.Range(1, 10).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail($"lead{i}"),
            OrganizationId = orgId,
            StageId = stageId,
            AssignedUserId = null // No assignment to avoid FK conflicts
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
        result.Should().HaveCount(10);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(300); // Should be fast with composite index
        
        // Clean up after test
        await CleanupAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Count_Query_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = GenerateUniqueDomain()
        };

        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        var userId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail("john"),
            OrganizationId = orgId
        };

        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.BusinessUsers.AddAsync(user);
        await _context.SaveChangesAsync();

        // Create 10 leads for performance testing (reduced for test isolation)
        var leads = Enumerable.Range(1, 10).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail($"lead{i}"),
            OrganizationId = orgId,
            StageId = stageId,
            AssignedUserId = userId
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
        count.Should().Be(10);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(200); // Should be fast with index
        
        // Clean up after test
        await CleanupAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Perform_Fast_Query_With_Include_Relationships_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = GenerateUniqueDomain()
        };

        var stageId = Guid.NewGuid();
        var stage = new Stage
        {
            Id = stageId,
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        var userId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail("john"),
            OrganizationId = orgId
        };

        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.BusinessUsers.AddAsync(user);
        await _context.SaveChangesAsync();

        // Create 10 leads with relationships (reduced for test isolation)
        var leads = Enumerable.Range(1, 10).Select(i => new Lead
        {
            Id = Guid.NewGuid(),
            Title = $"Lead {i}",
            FirstName = "John",
            LastName = "Doe",
            Email = GenerateUniqueEmail($"lead{i}"),
            OrganizationId = orgId,
            StageId = stageId,
            AssignedUserId = user.Id
        }).ToList();

        await _context.Leads.AddRangeAsync(leads);
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _context.Leads
            .Where(l => l.OrganizationId == orgId)
            .Include(l => l.Organization)
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .ToListAsync();
        stopwatch.Stop();

        // Assert
        result.Should().HaveCount(10);
        result.All(l => l.Organization != null).Should().BeTrue();
        result.All(l => l.Stage != null).Should().BeTrue();
        result.All(l => l.AssignedUser != null).Should().BeTrue();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(300); // Should be fast with proper indexing
        
        // Clean up after test
        await CleanupAsync();
    }
}
