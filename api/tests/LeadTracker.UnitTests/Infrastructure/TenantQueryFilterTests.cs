using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Core.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Xunit;
using System.Threading.Tasks;

namespace LeadTracker.UnitTests.Infrastructure;

public class TenantQueryFilterTests : IDisposable
{
    private readonly DbContextOptions<LeadTrackerDbContext> _options;
    private readonly Mock<ITenantFilterService> _mockTenantFilterService;
    private readonly Mock<ILogger<TenantFilterService>> _mockLogger;

    public TenantQueryFilterTests()
    {
        _options = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _mockTenantFilterService = new Mock<ITenantFilterService>();
        _mockLogger = new Mock<ILogger<TenantFilterService>>();
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryFilters_WhenTenantServiceReturnsOrgId_FiltersDataByOrganization()
    {
        // Arrange
        var orgId1 = Guid.NewGuid();
        var orgId2 = Guid.NewGuid();
        var currentOrgId = orgId1;

        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(currentOrgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        // Create test data
        var org1 = new Organization { Id = orgId1, Name = "Org 1", Domain = "org1" };
        var org2 = new Organization { Id = orgId2, Name = "Org 2", Domain = "org2" };

        var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = "Lead 1 Org 1" };
        var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = "Lead 2 Org 2" };

        context.Organizations.AddRange(org1, org2);
        context.Leads.AddRange(lead1, lead2);
        await context.SaveChangesAsync();

        // Act
        var filteredLeads = await context.Leads.ToListAsync();

        // Assert
        Assert.Single(filteredLeads);
        Assert.Equal(lead1.Id, filteredLeads[0].Id);
        Assert.Equal(orgId1, filteredLeads[0].OrganizationId);
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryFilters_WhenTenantServiceReturnsNull_ReturnsEmptyResults()
    {
        // Arrange
        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns((Guid?)null);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        var orgId = Guid.NewGuid();
        var org = new Organization { Id = orgId, Name = "Test Org", Domain = "test" };
        var lead = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, Title = "Test Lead" };

        context.Organizations.Add(org);
        context.Leads.Add(lead);
        await context.SaveChangesAsync();

        // Act
        var filteredLeads = await context.Leads.ToListAsync();

        // Assert
        Assert.Empty(filteredLeads);
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryFilters_WhenNoTenantService_ReturnsEmptyResults()
    {
        // Arrange
        using var context = new LeadTrackerDbContext(_options);

        var orgId = Guid.NewGuid();
        var org = new Organization { Id = orgId, Name = "Test Org", Domain = "test" };
        var lead = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, Title = "Test Lead" };

        context.Organizations.Add(org);
        context.Leads.Add(lead);
        await context.SaveChangesAsync();

        // Act
        var filteredLeads = await context.Leads.ToListAsync();

        // Assert
        Assert.Empty(filteredLeads);
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryFilters_AppliesToAllTenantEntities()
    {
        // Arrange
        var orgId1 = Guid.NewGuid();
        var orgId2 = Guid.NewGuid();
        var currentOrgId = orgId1;

        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(currentOrgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        // Create test data for different tenant entities
        var org1 = new Organization { Id = orgId1, Name = "Org 1", Domain = "org1" };
        var org2 = new Organization { Id = orgId2, Name = "Org 2", Domain = "org2" };

        var user1 = new User { Id = Guid.NewGuid(), OrganizationId = orgId1, FirstName = "User 1", LastName = "Org 1", Email = "user1@org1.com" };
        var user2 = new User { Id = Guid.NewGuid(), OrganizationId = orgId2, FirstName = "User 2", LastName = "Org 2", Email = "user2@org2.com" };

        var stage1 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId1, Name = "Stage 1", Order = 1 };
        var stage2 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId2, Name = "Stage 2", Order = 1 };

        var task1 = new Core.Entities.Task { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = "Task 1" };
        var task2 = new Core.Entities.Task { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = "Task 2" };

        context.Organizations.AddRange(org1, org2);
        context.BusinessUsers.AddRange(user1, user2);
        context.Stages.AddRange(stage1, stage2);
        context.Tasks.AddRange(task1, task2);
        await context.SaveChangesAsync();

        // Act
        var filteredUsers = await context.BusinessUsers.ToListAsync();
        var filteredStages = await context.Stages.ToListAsync();
        var filteredTasks = await context.Tasks.ToListAsync();

        // Assert
        Assert.Single(filteredUsers);
        Assert.Equal(user1.Id, filteredUsers[0].Id);

        Assert.Single(filteredStages);
        Assert.Equal(stage1.Id, filteredStages[0].Id);

        Assert.Single(filteredTasks);
        Assert.Equal(task1.Id, filteredTasks[0].Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task QueryFilters_IgnoresNonTenantEntities()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(orgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        var org1 = new Organization { Id = Guid.NewGuid(), Name = "Org 1", Domain = "org1" };
        var org2 = new Organization { Id = Guid.NewGuid(), Name = "Org 2", Domain = "org2" };

        context.Organizations.AddRange(org1, org2);
        await context.SaveChangesAsync();

        // Act
        var allOrgs = await context.Organizations.ToListAsync();

        // Assert
        Assert.Equal(2, allOrgs.Count); // Organizations should not be filtered
    }

    public void Dispose()
    {
        using var context = new LeadTrackerDbContext(_options);
        context.Database.EnsureDeleted();
    }
}
