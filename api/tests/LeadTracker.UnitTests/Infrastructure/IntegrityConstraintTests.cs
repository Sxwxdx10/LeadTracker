using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure;
using LeadTracker.Core.Entities;
using LeadTracker.UnitTests.Common;
using Xunit;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.UnitTests.Infrastructure;

/// <summary>
/// Tests for database integrity constraints using PostgreSQL for realistic behavior
/// </summary>
public class IntegrityConstraintTests : TestBase
{
    public IntegrityConstraintTests() : base()
    {
        // Clean up before each test
        CleanupAsync().Wait();
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
        await Context.Organizations.AddAsync(org1);
        await Context.SaveChangesAsync();

        await Context.Organizations.AddAsync(org2);
        
        // Should throw exception for duplicate domain
        await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
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
        await Context.Organizations.AddAsync(org);
        await Context.Users.AddAsync(user1);
        await Context.SaveChangesAsync();

        await Context.Users.AddAsync(user2);
        
        // Should throw exception for duplicate email in same organization
        await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
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
        await Context.Leads.AddAsync(lead);
        
        // Should throw exception for invalid foreign keys
        await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Enforce_Restrict_Delete_For_Organization_With_Leads()
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
        await Context.Organizations.AddAsync(org);
        await Context.Stages.AddAsync(stage);
        await Context.Leads.AddAsync(lead);
        await Context.SaveChangesAsync();

        // Try to delete organization (should be restricted due to leads)
        Context.Organizations.Remove(org);
        
        // Assert - EF Core throws InvalidOperationException for conceptual nulls
        await Assert.ThrowsAsync<InvalidOperationException>(() => Context.SaveChangesAsync());
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
        await Context.Organizations.AddAsync(org);
        await Context.Stages.AddAsync(stage);
        await Context.Leads.AddAsync(lead);
        await Context.Tasks.AddAsync(task);
        await Context.SaveChangesAsync();

        // Verify task exists and is linked to lead
        var taskCount = await Context.Tasks.CountAsync(t => t.LeadId == lead.Id);
        Assert.Equal(1, taskCount);
        
        // Try to delete lead (should be restricted due to tasks)
        Context.Leads.Remove(lead);
        
        // Assert - Should throw exception due to foreign key constraint
        await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
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
        await Context.Leads.AddAsync(lead);
        
        await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
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
        await Context.Organizations.AddAsync(org);
        
        await Assert.ThrowsAsync<DbUpdateException>(() => Context.SaveChangesAsync());
    }

}
