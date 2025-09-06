using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using FluentAssertions;
using Xunit;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Integration tests for database integrity constraints with PostgreSQL
/// </summary>
public class PostgreSqlIntegrityConstraintTests : IntegrationTestBase
{
    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Unique_Domain_Constraint_With_PostgreSQL()
    {
        // Arrange
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Organization 1",
            Domain = "company.com"
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Organization 2",
            Domain = "company.com" // Same domain - should fail
        };

        // Act & Assert
        await _context.Organizations.AddAsync(org1);
        await _context.SaveChangesAsync();

        await _context.Organizations.AddAsync(org2);
        
        // This should throw a DbUpdateException due to unique constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        
        // Verify it's a unique constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("duplicate key value violates unique constraint");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Unique_Email_Per_Organization_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = "test.com"
        };

        var user1 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john@test.com",
            OrganizationId = orgId
        };

        var user2 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Jane",
            LastName = "Doe",
            Email = "john@test.com", // Same email - should fail
            OrganizationId = orgId
        };

        // Act & Assert
        await _context.Organizations.AddAsync(organization);
        await _context.BusinessUsers.AddAsync(user1);
        await _context.SaveChangesAsync();

        await _context.BusinessUsers.AddAsync(user2);
        
        // This should throw a DbUpdateException due to unique constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        
        // Verify it's a unique constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("duplicate key value violates unique constraint");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Foreign_Key_Constraints_With_PostgreSQL()
    {
        // Arrange
        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Test Lead",
            OrganizationId = Guid.NewGuid(), // Non-existent organization
            StageId = Guid.NewGuid(), // Non-existent stage
            AssignedUserId = Guid.NewGuid() // Non-existent user
        };

        // Act & Assert
        await _context.Leads.AddAsync(lead);
        
        // This should throw a DbUpdateException due to foreign key constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        
        // Verify it's a foreign key constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("violates foreign key constraint");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Required_Fields_With_PostgreSQL()
    {
        // Arrange
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            // Name is required but missing
            Domain = "test.com"
        };

        // Act & Assert
        await _context.Organizations.AddAsync(organization);
        
        // This should throw a DbUpdateException due to NOT NULL constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        
        // Verify it's a NOT NULL constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("violates not-null constraint");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Max_Length_Constraints_With_PostgreSQL()
    {
        // Arrange
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Organization",
            Domain = "test.com",
            Description = new string('A', 1025) // Exceeds MaxLength(1024)
        };

        // Act & Assert
        await _context.Organizations.AddAsync(organization);
        
        // This should throw a DbUpdateException due to length constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        
        // Verify it's a length constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("value too long");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Cascade_Delete_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = "test.com"
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
            OrganizationId = orgId,
            StageId = stage.Id
        };

        // Act
        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.Leads.AddAsync(lead);
        await _context.SaveChangesAsync();

        // Delete organization - should cascade delete related entities
        _context.Organizations.Remove(organization);
        await _context.SaveChangesAsync();

        // Assert
        var remainingStages = await _context.Stages.CountAsync();
        var remainingLeads = await _context.Leads.CountAsync();
        
        remainingStages.Should().Be(0);
        remainingLeads.Should().Be(0);
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Restrict_Delete_With_PostgreSQL()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Organization",
            Domain = "test.com"
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
            OrganizationId = orgId,
            StageId = stage.Id
        };

        var task = new TaskEntity
        {
            Id = Guid.NewGuid(),
            Title = "Test Task",
            LeadId = lead.Id,
            OrganizationId = orgId
        };

        // Act
        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.Leads.AddAsync(lead);
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Try to delete lead with tasks - should fail due to restrict constraint
        _context.Leads.Remove(lead);
        
        // This should throw a DbUpdateException due to restrict constraint
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        
        // Verify it's a restrict constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("violates foreign key constraint");
    }
}
