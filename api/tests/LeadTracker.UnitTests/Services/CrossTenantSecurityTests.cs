using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Core.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Xunit;

namespace LeadTracker.UnitTests.Services;

public class CrossTenantSecurityTests : IDisposable
{
    private readonly DbContextOptions<LeadTrackerDbContext> _options;
    private readonly Mock<ITenantFilterService> _mockTenantFilterService;
    private readonly Mock<ILogger<TenantFilterService>> _mockLogger;

    public CrossTenantSecurityTests()
    {
        _options = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _mockTenantFilterService = new Mock<ITenantFilterService>();
        _mockLogger = new Mock<ILogger<TenantFilterService>>();
    }

    [Fact]
    public async Task TenantFilter_PreventsCrossTenantDataAccess()
    {
        // Arrange
        var orgId1 = Guid.NewGuid();
        var orgId2 = Guid.NewGuid();
        var currentOrgId = orgId1;

        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(currentOrgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        // Create data for both organizations
        var org1 = new Organization { Id = orgId1, Name = "Org 1", Domain = "org1.com" };
        var org2 = new Organization { Id = orgId2, Name = "Org 2", Domain = "org2.com" };

        var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = "Lead Org 1" };
        var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = "Lead Org 2" };

        var user1 = new User { Id = Guid.NewGuid(), OrganizationId = orgId1, FirstName = "User", LastName = "One", Email = "user1@org1.com" };
        var user2 = new User { Id = Guid.NewGuid(), OrganizationId = orgId2, FirstName = "User", LastName = "Two", Email = "user2@org2.com" };

        context.Organizations.AddRange(org1, org2);
        context.Leads.AddRange(lead1, lead2);
        context.BusinessUsers.AddRange(user1, user2);
        await context.SaveChangesAsync();

        // Act - Query data as Org 1
        var accessibleLeads = await context.Leads.ToListAsync();
        var accessibleUsers = await context.BusinessUsers.ToListAsync();

        // Assert - Should only see Org 1 data
        Assert.Single(accessibleLeads);
        Assert.Equal(orgId1, accessibleLeads[0].OrganizationId);
        Assert.Equal("Lead Org 1", accessibleLeads[0].Title);

        Assert.Single(accessibleUsers);
        Assert.Equal(orgId1, accessibleUsers[0].OrganizationId);
        Assert.Equal("user1@org1.com", accessibleUsers[0].Email);
    }

    [Fact]
    public async Task TenantFilter_WithNoTenantContext_ReturnsNoData()
    {
        // Arrange
        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns((Guid?)null);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        var orgId = Guid.NewGuid();
        var org = new Organization { Id = orgId, Name = "Test Org", Domain = "test.com" };
        var lead = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId, Title = "Test Lead" };

        context.Organizations.Add(org);
        context.Leads.Add(lead);
        await context.SaveChangesAsync();

        // Act
        var leads = await context.Leads.ToListAsync();
        var users = await context.BusinessUsers.ToListAsync();
        var stages = await context.Stages.ToListAsync();
        var tasks = await context.Tasks.ToListAsync();

        // Assert - All tenant data should be filtered out
        Assert.Empty(leads);
        Assert.Empty(users);
        Assert.Empty(stages);
        Assert.Empty(tasks);
    }

    [Fact]
    public async Task TenantFilter_WithInvalidTenantId_ReturnsNoData()
    {
        // Arrange
        var validOrgId = Guid.NewGuid();
        var invalidOrgId = Guid.NewGuid();

        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(invalidOrgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        var org = new Organization { Id = validOrgId, Name = "Valid Org", Domain = "valid.com" };
        var lead = new Lead { Id = Guid.NewGuid(), OrganizationId = validOrgId, Title = "Valid Lead" };

        context.Organizations.Add(org);
        context.Leads.Add(lead);
        await context.SaveChangesAsync();

        // Act
        var leads = await context.Leads.ToListAsync();

        // Assert - Should not see any data due to tenant mismatch
        Assert.Empty(leads);
    }

    [Fact]
    public async Task TenantFilter_IgnoresNonTenantEntities()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(orgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        var org1 = new Organization { Id = Guid.NewGuid(), Name = "Org 1", Domain = "org1.com" };
        var org2 = new Organization { Id = Guid.NewGuid(), Name = "Org 2", Domain = "org2.com" };

        context.Organizations.AddRange(org1, org2);
        await context.SaveChangesAsync();

        // Act
        var organizations = await context.Organizations.ToListAsync();

        // Assert - Organizations should not be filtered (they are not tenant entities)
        Assert.Equal(2, organizations.Count);
    }

    [Fact]
    public async Task TenantFilter_WorksWithComplexQueries()
    {
        // Arrange
        var orgId1 = Guid.NewGuid();
        var orgId2 = Guid.NewGuid();
        var currentOrgId = orgId1;

        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(currentOrgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        // Create test data
        var org1 = new Organization { Id = orgId1, Name = "Org 1", Domain = "org1.com" };
        var org2 = new Organization { Id = orgId2, Name = "Org 2", Domain = "org2.com" };

        var stage1 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId1, Name = "Qualified", Order = 1 };
        var stage2 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId2, Name = "Qualified", Order = 1 };

        var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = "Lead 1", StageId = stage1.Id, Email = "lead1@org1.com" };
        var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = "Lead 2", StageId = stage2.Id, Email = "lead2@org2.com" };

        context.Organizations.AddRange(org1, org2);
        context.Stages.AddRange(stage1, stage2);
        context.Leads.AddRange(lead1, lead2);
        await context.SaveChangesAsync();

        // Act - Complex query with joins
        var leadsWithStages = await context.Leads
            .Include(l => l.Stage)
            .Where(l => l.Email != null)
            .OrderBy(l => l.Title)
            .ToListAsync();

        // Assert - Should only return Org 1 data
        Assert.Single(leadsWithStages);
        Assert.Equal(orgId1, leadsWithStages[0].OrganizationId);
        Assert.Equal("Lead 1", leadsWithStages[0].Title);
        Assert.NotNull(leadsWithStages[0].Stage);
        Assert.Equal(orgId1, leadsWithStages[0].Stage.OrganizationId);
    }

    [Fact]
    public async Task TenantFilter_WorksWithAggregateQueries()
    {
        // Arrange
        var orgId1 = Guid.NewGuid();
        var orgId2 = Guid.NewGuid();
        var currentOrgId = orgId1;

        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(currentOrgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        // Create test data
        var org1 = new Organization { Id = orgId1, Name = "Org 1", Domain = "org1.com" };
        var org2 = new Organization { Id = orgId2, Name = "Org 2", Domain = "org2.com" };

        var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = "Lead 1", EstimatedValue = 1000 };
        var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = "Lead 2", EstimatedValue = 2000 };
        var lead3 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = "Lead 3", EstimatedValue = 5000 };

        context.Organizations.AddRange(org1, org2);
        context.Leads.AddRange(lead1, lead2, lead3);
        await context.SaveChangesAsync();

        // Act - Aggregate queries
        var leadCount = await context.Leads.CountAsync();
        var totalValue = await context.Leads.SumAsync(l => l.EstimatedValue ?? 0);
        var averageValue = await context.Leads.AverageAsync(l => l.EstimatedValue ?? 0);

        // Assert - Should only count Org 1 data
        Assert.Equal(2, leadCount);
        Assert.Equal(3000, totalValue);
        Assert.Equal(1500, averageValue);
    }

    public void Dispose()
    {
        using var context = new LeadTrackerDbContext(_options);
        context.Database.EnsureDeleted();
    }
}
