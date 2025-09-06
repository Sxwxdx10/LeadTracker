using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using FluentAssertions;
using Xunit;
using Npgsql;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.IntegrationTests.Infrastructure;

/// <summary>
/// Integration tests for database integrity constraints with Docker Compose PostgreSQL
/// </summary>
public class DockerComposeIntegrityConstraintTests : DockerComposeTestBase
{
    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Unique_Domain_Constraint_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var domain = GenerateUniqueDomain();
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Organization 1",
            Domain = domain
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Organization 2",
            Domain = domain // Same domain - should fail
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
    public async System.Threading.Tasks.Task Should_Enforce_Unique_Email_Per_Organization_With_DockerCompose()
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

        var email = GenerateUniqueEmail("john");
        var user1 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = email,
            OrganizationId = orgId
        };

        var user2 = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Jane",
            LastName = "Doe",
            Email = email, // Same email - should fail
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
    public async System.Threading.Tasks.Task Should_Enforce_Foreign_Key_Constraints_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
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
    public async System.Threading.Tasks.Task Should_Enforce_Required_Fields_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = null!, // Explicitly set to null to trigger NOT NULL constraint
            Domain = GenerateUniqueDomain()
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
    public async System.Threading.Tasks.Task Should_Enforce_Max_Length_Constraints_With_DockerCompose()
    {
        // Clean up any existing data first
        await CleanupAsync();
        
        // Arrange
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Organization",
            Domain = GenerateUniqueDomain(),
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
    public async System.Threading.Tasks.Task Should_Enforce_Cascade_Delete_With_DockerCompose()
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
            OrganizationId = orgId,
            DueDate = DateTime.UtcNow.AddDays(1)
        };

        // Act
        await _context.Organizations.AddAsync(organization);
        await _context.Stages.AddAsync(stage);
        await _context.Leads.AddAsync(lead);
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Delete lead - should cascade delete related tasks (but not stages due to RESTRICT)
        _context.Leads.Remove(lead);
        await _context.SaveChangesAsync();

        // Assert
        var remainingTasks = await _context.Tasks.Where(t => t.OrganizationId == orgId).CountAsync();
        var remainingLeads = await _context.Leads.Where(l => l.OrganizationId == orgId).CountAsync();
        var remainingStages = await _context.Stages.Where(s => s.OrganizationId == orgId).CountAsync();
        
        remainingTasks.Should().Be(0); // Tasks should be cascade deleted
        remainingLeads.Should().Be(0); // Lead should be deleted
        remainingStages.Should().Be(1); // Stage should remain due to RESTRICT
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Restrict_Delete_With_DockerCompose()
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

        // Try to delete organization with stages and leads - should fail due to RESTRICT constraint
        // We need to use raw SQL to test the database constraint directly
        var exception = await Assert.ThrowsAsync<PostgresException>(() => 
            _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Organizations\" WHERE \"Id\" = {0}", orgId));
        
        // Verify it's a restrict constraint violation
        exception.SqlState.Should().Be("23503"); // Foreign key violation
        exception.Message.Should().Contain("violates foreign key constraint");
    }
}
