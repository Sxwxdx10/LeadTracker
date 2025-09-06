using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure.Data;
using LeadTracker.Core.Entities;
using Xunit;
using FluentAssertions;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.UnitTests.Infrastructure;

/// <summary>
/// Tests for database integrity constraints
/// </summary>
public class IntegrityConstraintTests : IDisposable
{
    private readonly LeadTrackerDbContext _context;
    private readonly DbContextOptions<LeadTrackerDbContext> _options;

    public IntegrityConstraintTests()
    {
        _options = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new LeadTrackerDbContext(_options);
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Unique_Domain_Constraint()
    {
        // Arrange
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Company 1",
            Domain = "company1.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Company 2", 
            Domain = "company1.com", // Same domain
            IsActive = true
        };

        // Act & Assert
        await _context.Organizations.AddAsync(org1);
        await _context.SaveChangesAsync();

        await _context.Organizations.AddAsync(org2);
        
        // Should throw exception for duplicate domain
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync());
        exception.Message.Should().Contain("duplicate");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Unique_Email_Per_Organization()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var org = new Organization
        {
            Id = orgId,
            Name = "Test Company",
            Domain = "test.com",
            IsActive = true
        };

        var user1 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "user1@test.com",
            Email = "user1@test.com",
            OrganizationId = orgId,
            FirstName = "User",
            LastName = "One"
        };

        var user2 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "user2@test.com",
            Email = "user1@test.com", // Same email
            OrganizationId = orgId,
            FirstName = "User",
            LastName = "Two"
        };

        // Act & Assert
        await _context.Organizations.AddAsync(org);
        await _context.Users.AddAsync(user1);
        await _context.SaveChangesAsync();

        await _context.Users.AddAsync(user2);
        
        // Should throw exception for duplicate email in same organization
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync());
        exception.Message.Should().Contain("duplicate");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Foreign_Key_Constraints()
    {
        // Arrange
        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Test Lead",
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            OrganizationId = Guid.NewGuid(), // Non-existent organization
            StageId = Guid.NewGuid() // Non-existent stage
        };

        // Act & Assert
        await _context.Leads.AddAsync(lead);
        
        // Should throw exception for invalid foreign keys
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync());
        exception.Message.Should().Contain("foreign key");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Cascade_Delete_For_Organization()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var org = new Organization
        {
            Id = orgId,
            Name = "Test Company",
            Domain = "test.com",
            IsActive = true
        };

        var stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Test Lead",
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            OrganizationId = orgId,
            StageId = stage.Id
        };

        // Act
        await _context.Organizations.AddAsync(org);
        await _context.Stages.AddAsync(stage);
        await _context.Leads.AddAsync(lead);
        await _context.SaveChangesAsync();

        // Delete organization (should cascade)
        _context.Organizations.Remove(org);
        await _context.SaveChangesAsync();

        // Assert
        var remainingStages = await _context.Stages.CountAsync();
        var remainingLeads = await _context.Leads.CountAsync();
        
        remainingStages.Should().Be(0);
        remainingLeads.Should().Be(0);
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Restrict_Delete_For_Lead_With_Tasks()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var org = new Organization
        {
            Id = orgId,
            Name = "Test Company",
            Domain = "test.com",
            IsActive = true
        };

        var stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "Test Stage",
            Order = 1,
            OrganizationId = orgId
        };

        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Test Lead",
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            OrganizationId = orgId,
            StageId = stage.Id
        };

        var task = new TaskEntity
        {
            Id = Guid.NewGuid(),
            Title = "Test Task",
            Description = "Test Description",
            OrganizationId = orgId,
            LeadId = lead.Id
        };

        // Act
        await _context.Organizations.AddAsync(org);
        await _context.Stages.AddAsync(stage);
        await _context.Leads.AddAsync(lead);
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Try to delete lead (should be restricted due to tasks)
        _context.Leads.Remove(lead);
        
        // Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync());
        exception.Message.Should().Contain("foreign key");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Required_Fields()
    {
        // Arrange
        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            // Missing required fields: Title, OrganizationId
            FirstName = "John",
            LastName = "Doe"
        };

        // Act & Assert
        await _context.Leads.AddAsync(lead);
        
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync());
        exception.Message.Should().Contain("required");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Max_Length_Constraints()
    {
        // Arrange
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = new string('A', 201), // Exceeds max length of 200
            Domain = "test.com",
            IsActive = true
        };

        // Act & Assert
        await _context.Organizations.AddAsync(org);
        
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync());
        exception.Message.Should().Contain("length");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
