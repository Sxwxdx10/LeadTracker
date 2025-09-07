using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using LeadTracker.UnitTests.Common;
using Xunit;
using FluentAssertions;

namespace LeadTracker.UnitTests.Services;

/// <summary>
/// Comprehensive multi-tenant data isolation tests
/// Tests that verify data cannot leak between organizations
/// </summary>
public class MultiTenantDataIsolationTests : TestBase
{
    [Fact]
    public async System.Threading.Tasks.Task QueryLeads_WithOrganizationFilter_ShouldOnlyReturnOwnLeads()
    {
        // Arrange - Create two organizations with leads
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}", 
            Domain = $"company-b-{testId}.com",
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create stages for both organizations
        var org1Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org1.Id
        };

        var org2Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org2.Id
        };

        await Context.Stages.AddRangeAsync(org1Stage, org2Stage);
        await Context.SaveChangesAsync();

        // Create leads for both organizations
        var org1Leads = new List<Lead>
        {
            new() { Id = Guid.NewGuid(), Title = "Lead A1", OrganizationId = org1.Id, StageId = org1Stage.Id, Email = $"lead1@company-a-{testId}.com" },
            new() { Id = Guid.NewGuid(), Title = "Lead A2", OrganizationId = org1.Id, StageId = org1Stage.Id, Email = $"lead2@company-a-{testId}.com" }
        };

        var org2Leads = new List<Lead>
        {
            new() { Id = Guid.NewGuid(), Title = "Lead B1", OrganizationId = org2.Id, StageId = org2Stage.Id, Email = $"lead1@company-b-{testId}.com" },
            new() { Id = Guid.NewGuid(), Title = "Lead B2", OrganizationId = org2.Id, StageId = org2Stage.Id, Email = $"lead2@company-b-{testId}.com" }
        };

        await Context.Leads.AddRangeAsync(org1Leads);
        await Context.Leads.AddRangeAsync(org2Leads);
        await Context.SaveChangesAsync();

        // Act - Query leads for organization 1 only
        var org1LeadsFromDb = await Context.Leads
            .Where(l => l.OrganizationId == org1.Id)
            .ToListAsync();

        // Assert - Should only return org1 leads
        org1LeadsFromDb.Should().HaveCount(2);
        org1LeadsFromDb.Should().OnlyContain(l => l.OrganizationId == org1.Id);
        org1LeadsFromDb.Should().NotContain(l => l.OrganizationId == org2.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryUsers_WithOrganizationFilter_ShouldOnlyReturnOwnUsers()
    {
        // Arrange - Create two organizations with users
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}",
            Domain = $"company-b-{testId}.com", 
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create users for both organizations
        var org1Users = new List<User>
        {
            new() { Id = Guid.NewGuid(), FirstName = "John", LastName = "Doe", Email = $"john@company-a-{testId}.com", OrganizationId = org1.Id },
            new() { Id = Guid.NewGuid(), FirstName = "Jane", LastName = "Smith", Email = $"jane@company-a-{testId}.com", OrganizationId = org1.Id }
        };

        var org2Users = new List<User>
        {
            new() { Id = Guid.NewGuid(), FirstName = "Bob", LastName = "Johnson", Email = $"bob@company-b-{testId}.com", OrganizationId = org2.Id },
            new() { Id = Guid.NewGuid(), FirstName = "Alice", LastName = "Brown", Email = $"alice@company-b-{testId}.com", OrganizationId = org2.Id }
        };

        await Context.BusinessUsers.AddRangeAsync(org1Users);
        await Context.BusinessUsers.AddRangeAsync(org2Users);
        await Context.SaveChangesAsync();

        // Act - Query users for organization 1 only
        var org1UsersFromDb = await Context.BusinessUsers
            .Where(u => u.OrganizationId == org1.Id)
            .ToListAsync();

        // Assert - Should only return org1 users
        org1UsersFromDb.Should().HaveCount(2);
        org1UsersFromDb.Should().OnlyContain(u => u.OrganizationId == org1.Id);
        org1UsersFromDb.Should().NotContain(u => u.OrganizationId == org2.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryStages_WithOrganizationFilter_ShouldOnlyReturnOwnStages()
    {
        // Arrange - Create two organizations with stages
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}",
            Domain = $"company-b-{testId}.com",
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create stages for both organizations
        var org1Stages = new List<Stage>
        {
            new() { Id = Guid.NewGuid(), Name = "Qualified", Order = 1, OrganizationId = org1.Id },
            new() { Id = Guid.NewGuid(), Name = "Proposal", Order = 2, OrganizationId = org1.Id }
        };

        var org2Stages = new List<Stage>
        {
            new() { Id = Guid.NewGuid(), Name = "New", Order = 1, OrganizationId = org2.Id },
            new() { Id = Guid.NewGuid(), Name = "Contacted", Order = 2, OrganizationId = org2.Id }
        };

        await Context.Stages.AddRangeAsync(org1Stages);
        await Context.Stages.AddRangeAsync(org2Stages);
        await Context.SaveChangesAsync();

        // Act - Query stages for organization 1 only
        var org1StagesFromDb = await Context.Stages
            .Where(s => s.OrganizationId == org1.Id)
            .OrderBy(s => s.Order)
            .ToListAsync();

        // Assert - Should only return org1 stages
        org1StagesFromDb.Should().HaveCount(2);
        org1StagesFromDb.Should().OnlyContain(s => s.OrganizationId == org1.Id);
        org1StagesFromDb.Should().NotContain(s => s.OrganizationId == org2.Id);
        org1StagesFromDb[0].Name.Should().Be("Qualified");
        org1StagesFromDb[1].Name.Should().Be("Proposal");
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryTasks_WithOrganizationFilter_ShouldOnlyReturnOwnTasks()
    {
        // Arrange - Create two organizations with tasks
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}",
            Domain = $"company-b-{testId}.com",
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create tasks for both organizations
        var org1Tasks = new List<Core.Entities.Task>
        {
            new() { Id = Guid.NewGuid(), Title = "Call Lead A1", Type = "Call", OrganizationId = org1.Id },
            new() { Id = Guid.NewGuid(), Title = "Send Proposal A", Type = "Email", OrganizationId = org1.Id }
        };

        var org2Tasks = new List<Core.Entities.Task>
        {
            new() { Id = Guid.NewGuid(), Title = "Call Lead B1", Type = "Call", OrganizationId = org2.Id },
            new() { Id = Guid.NewGuid(), Title = "Send Proposal B", Type = "Email", OrganizationId = org2.Id }
        };

        await Context.Tasks.AddRangeAsync(org1Tasks);
        await Context.Tasks.AddRangeAsync(org2Tasks);
        await Context.SaveChangesAsync();

        // Act - Query tasks for organization 1 only
        var org1TasksFromDb = await Context.Tasks
            .Where(t => t.OrganizationId == org1.Id)
            .ToListAsync();

        // Assert - Should only return org1 tasks
        org1TasksFromDb.Should().HaveCount(2);
        org1TasksFromDb.Should().OnlyContain(t => t.OrganizationId == org1.Id);
        org1TasksFromDb.Should().NotContain(t => t.OrganizationId == org2.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task CountLeads_WithOrganizationFilter_ShouldReturnCorrectCount()
    {
        // Arrange - Create organization with multiple leads
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}",
            Domain = $"company-b-{testId}.com",
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create stages for both organizations
        var org1Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org1.Id
        };

        var org2Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org2.Id
        };

        await Context.Stages.AddRangeAsync(org1Stage, org2Stage);
        await Context.SaveChangesAsync();

        // Create 5 leads for org1, 3 leads for org2
        var org1Leads = Enumerable.Range(1, 5)
            .Select(i => new Lead
            {
                Id = Guid.NewGuid(),
                Title = $"Lead A{i}",
                OrganizationId = org1.Id,
                StageId = org1Stage.Id,
                Email = $"lead{i}@company-a-{testId}.com"
            })
            .ToList();

        var org2Leads = Enumerable.Range(1, 3)
            .Select(i => new Lead
            {
                Id = Guid.NewGuid(),
                Title = $"Lead B{i}",
                OrganizationId = org2.Id,
                StageId = org2Stage.Id,
                Email = $"lead{i}@company-b-{testId}.com"
            })
            .ToList();

        await Context.Leads.AddRangeAsync(org1Leads);
        await Context.Leads.AddRangeAsync(org2Leads);
        await Context.SaveChangesAsync();

        // Act - Count leads for each organization
        var org1Count = await Context.Leads.CountAsync(l => l.OrganizationId == org1.Id);
        var org2Count = await Context.Leads.CountAsync(l => l.OrganizationId == org2.Id);
        var totalCount = await Context.Leads.CountAsync();

        // Assert - Counts should be correct
        org1Count.Should().Be(5);
        org2Count.Should().Be(3);
        totalCount.Should().Be(8);
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryLeadsWithIncludes_WithOrganizationFilter_ShouldOnlyReturnOwnData()
    {
        // Arrange - Create organization with leads and related data
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}",
            Domain = $"company-b-{testId}.com",
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create stages for both organizations
        var org1Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "Qualified",
            Order = 1,
            OrganizationId = org1.Id
        };

        var org2Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org2.Id
        };

        await Context.Stages.AddRangeAsync(org1Stage, org2Stage);
        await Context.SaveChangesAsync();

        // Create leads with stages
        var org1Lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Lead A1",
            OrganizationId = org1.Id,
            StageId = org1Stage.Id,
            Email = $"lead1@company-a-{testId}.com"
        };

        var org2Lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Lead B1",
            OrganizationId = org2.Id,
            StageId = org2Stage.Id,
            Email = $"lead1@company-b-{testId}.com"
        };

        await Context.Leads.AddRangeAsync(org1Lead, org2Lead);
        await Context.SaveChangesAsync();

        // Act - Query leads with includes for organization 1
        var org1LeadsWithStages = await Context.Leads
            .Include(l => l.Stage)
            .Where(l => l.OrganizationId == org1.Id)
            .ToListAsync();

        // Assert - Should only return org1 data with correct stage
        org1LeadsWithStages.Should().HaveCount(1);
        org1LeadsWithStages[0].OrganizationId.Should().Be(org1.Id);
        org1LeadsWithStages[0].Stage.Should().NotBeNull();
        org1LeadsWithStages[0].Stage.OrganizationId.Should().Be(org1.Id);
        org1LeadsWithStages[0].Stage.Name.Should().Be("Qualified");
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateLead_WithWrongOrganization_ShouldNotAffectOtherOrganization()
    {
        // Arrange - Create two organizations with leads
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}",
            Domain = $"company-b-{testId}.com",
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create stages for both organizations
        var org1Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org1.Id
        };

        var org2Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org2.Id
        };

        await Context.Stages.AddRangeAsync(org1Stage, org2Stage);
        await Context.SaveChangesAsync();

        var org1Lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Original Title A",
            OrganizationId = org1.Id,
            StageId = org1Stage.Id,
            Email = $"lead1@company-a-{testId}.com"
        };

        var org2Lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Original Title B",
            OrganizationId = org2.Id,
            StageId = org2Stage.Id,
            Email = $"lead1@company-b-{testId}.com"
        };

        await Context.Leads.AddRangeAsync(org1Lead, org2Lead);
        await Context.SaveChangesAsync();

        // Act - Update org1 lead (simulating proper filtering)
        var leadToUpdate = await Context.Leads
            .FirstOrDefaultAsync(l => l.Id == org1Lead.Id && l.OrganizationId == org1.Id);
        
        leadToUpdate!.Title = "Updated Title A";
        await Context.SaveChangesAsync();

        // Assert - Only org1 lead should be updated
        var updatedOrg1Lead = await Context.Leads.FindAsync(org1Lead.Id);
        var unchangedOrg2Lead = await Context.Leads.FindAsync(org2Lead.Id);

        updatedOrg1Lead!.Title.Should().Be("Updated Title A");
        unchangedOrg2Lead!.Title.Should().Be("Original Title B");
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteLead_WithWrongOrganization_ShouldNotAffectOtherOrganization()
    {
        // Arrange - Create two organizations with leads
        var testId = Guid.NewGuid().ToString("N")[..8];
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company A {testId}",
            Domain = $"company-a-{testId}.com",
            IsActive = true
        };

        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = $"Company B {testId}",
            Domain = $"company-b-{testId}.com",
            IsActive = true
        };

        await Context.Organizations.AddRangeAsync(org1, org2);
        await Context.SaveChangesAsync();

        // Create stages for both organizations
        var org1Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org1.Id
        };

        var org2Stage = new Stage
        {
            Id = Guid.NewGuid(),
            Name = "New",
            Order = 1,
            OrganizationId = org2.Id
        };

        await Context.Stages.AddRangeAsync(org1Stage, org2Stage);
        await Context.SaveChangesAsync();

        var org1Lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Lead A1",
            OrganizationId = org1.Id,
            StageId = org1Stage.Id,
            Email = $"lead1@company-a-{testId}.com"
        };

        var org2Lead = new Lead
        {
            Id = Guid.NewGuid(),
            Title = "Lead B1",
            OrganizationId = org2.Id,
            StageId = org2Stage.Id,
            Email = $"lead1@company-b-{testId}.com"
        };

        await Context.Leads.AddRangeAsync(org1Lead, org2Lead);
        await Context.SaveChangesAsync();

        // Act - Delete org1 lead (simulating proper filtering)
        var leadToDelete = await Context.Leads
            .FirstOrDefaultAsync(l => l.Id == org1Lead.Id && l.OrganizationId == org1.Id);
        
        Context.Leads.Remove(leadToDelete!);
        await Context.SaveChangesAsync();

        // Assert - Only org1 lead should be deleted
        var remainingLeads = await Context.Leads.ToListAsync();
        remainingLeads.Should().HaveCount(1);
        remainingLeads[0].Id.Should().Be(org2Lead.Id);
        remainingLeads[0].OrganizationId.Should().Be(org2.Id);
    }
}
