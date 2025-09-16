using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using FluentAssertions;
using Xunit;
using Npgsql;
using LeadTracker.IntegrationTests.Infrastructure;
using LeadTracker.IntegrationTests.Common;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.IntegrationTests.Database.Constraints;

/// <summary>
/// Integration tests for database integrity constraints
/// These tests run in complete isolation using transactions and work with both PostgreSQL and Docker Compose setups
/// </summary>
[Collection(TestCollections.Database)]
public class IntegrityConstraintTests : IntegrityConstraintTestBase
{
    public IntegrityConstraintTests(IntegrityConstraintTestFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Allow_Multiple_Organizations_With_Same_Domain()
    {
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
            Domain = domain // Same domain - should be allowed in multi-tenant architecture
        };

        // Act
        await Context.Organizations.AddAsync(org1);
        await Context.SaveChangesAsync();

        await Context.Organizations.AddAsync(org2);
        await Context.SaveChangesAsync(); // Should succeed
        
        // Assert
        var organizations = await Context.Organizations
            .Where(o => o.Domain == domain)
            .ToListAsync();
        
        organizations.Should().HaveCount(2);
        organizations.Should().Contain(o => o.Name == "Organization 1");
        organizations.Should().Contain(o => o.Name == "Organization 2");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Unique_Email_Per_Organization()
    {
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
        await Context.Organizations.AddAsync(organization);
        await Context.SaveChangesAsync(); // Save organization first
        
        await Context.BusinessUsers.AddAsync(user1);
        await Context.SaveChangesAsync();

        await Context.BusinessUsers.AddAsync(user2);
        
        // This should throw a DbUpdateException due to unique constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
        
        // Verify it's a unique constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("duplicate key value violates unique constraint");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Foreign_Key_Constraints()
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
        await Context.Leads.AddAsync(lead);
        
        // This should throw a DbUpdateException due to foreign key constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
        
        // Verify it's a foreign key constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("violates foreign key constraint");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Required_Fields()
    {
        // Arrange
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = null!, // Explicitly set to null to trigger NOT NULL constraint
            Domain = GenerateUniqueDomain()
        };

        // Act & Assert
        await Context.Organizations.AddAsync(organization);
        
        // This should throw a DbUpdateException due to NOT NULL constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
        
        // Verify it's a NOT NULL constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("violates not-null constraint");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Max_Length_Constraints()
    {
        // Arrange
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Organization",
            Domain = GenerateUniqueDomain(),
            Description = new string('A', 501) // Exceeds MaxLength(500)
        };

        // Act & Assert
        await Context.Organizations.AddAsync(organization);
        
        // This should throw a DbUpdateException due to length constraint violation
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
        
        // Verify it's a length constraint violation
        exception.InnerException.Should().NotBeNull();
        exception.InnerException!.Message.Should().Contain("value too long");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Cascade_Delete()
    {
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
        await Context.Organizations.AddAsync(organization);
        await Context.Stages.AddAsync(stage);
        await Context.Leads.AddAsync(lead);
        await Context.Tasks.AddAsync(task);
        await Context.SaveChangesAsync();

        // Delete lead - should succeed in multi-tenant architecture
        Context.Leads.Remove(lead);
        await Context.SaveChangesAsync();

        // Assert
        var remainingTasks = await Context.Tasks.Where(t => t.OrganizationId == orgId).CountAsync();
        var remainingLeads = await Context.Leads.Where(l => l.OrganizationId == orgId).CountAsync();
        var remainingStages = await Context.Stages.Where(s => s.OrganizationId == orgId).CountAsync();
        
        remainingTasks.Should().Be(1); // Tasks should remain with null LeadId
        remainingLeads.Should().Be(0); // Lead should be deleted
        remainingStages.Should().Be(1); // Stage should remain
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Restrict_Delete()
    {
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
        await Context.Organizations.AddAsync(organization);
        await Context.Stages.AddAsync(stage);
        await Context.Leads.AddAsync(lead);
        await Context.SaveChangesAsync();

        // Try to delete organization with stages and leads - should fail due to RESTRICT constraint
        // We need to use raw SQL to test the database constraint directly
        var exception = await Assert.ThrowsAsync<PostgresException>(() => 
            Context.Database.ExecuteSqlRawAsync("DELETE FROM \"Organizations\" WHERE \"Id\" = {0}", orgId));
        
        // Verify it's a restrict constraint violation
        exception.SqlState.Should().Be("23503"); // Foreign key violation
        exception.Message.Should().Contain("violates foreign key constraint");
    }

    private string GenerateUniqueDomain()
    {
        return $"test-{Guid.NewGuid():N}.com";
    }

    private string GenerateUniqueEmail(string prefix = "test")
    {
        return $"{prefix}-{Guid.NewGuid():N}@example.com";
    }
}
