using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Core.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using System.Diagnostics;
using Xunit;

namespace LeadTracker.UnitTests.Infrastructure;

public class TenantFilterPerformanceTests : IDisposable
{
    private readonly DbContextOptions<LeadTrackerDbContext> _options;
    private readonly Mock<ITenantFilterService> _mockTenantFilterService;
    private readonly Mock<ILogger<TenantFilterService>> _mockLogger;

    public TenantFilterPerformanceTests()
    {
        _options = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _mockTenantFilterService = new Mock<ITenantFilterService>();
        _mockLogger = new Mock<ILogger<TenantFilterService>>();
    }

    [Fact]
    public async Task TenantFilter_PerformanceWithLargeDataset_IsAcceptable()
    {
        // Arrange
        var orgId1 = Guid.NewGuid();
        var orgId2 = Guid.NewGuid();
        var currentOrgId = orgId1;

        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns(currentOrgId);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        // Create large dataset
        var org1 = new Organization { Id = orgId1, Name = "Org 1", Domain = "org1.com" };
        var org2 = new Organization { Id = orgId2, Name = "Org 2", Domain = "org2.com" };

        var leads = new List<Lead>();
        var users = new List<User>();
        var stages = new List<Stage>();
        var tasks = new List<Core.Entities.Task>();

        // Create 1000 records for each organization
        for (int i = 0; i < 1000; i++)
        {
            var stage1 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId1, Name = $"Stage {i}", Order = i };
            var stage2 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId2, Name = $"Stage {i}", Order = i };

            var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = $"Lead {i} Org 1", StageId = stage1.Id };
            var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = $"Lead {i} Org 2", StageId = stage2.Id };

            var user1 = new User { Id = Guid.NewGuid(), OrganizationId = orgId1, FirstName = $"User{i}", LastName = "Org1", Email = $"user{i}@org1.com" };
            var user2 = new User { Id = Guid.NewGuid(), OrganizationId = orgId2, FirstName = $"User{i}", LastName = "Org2", Email = $"user{i}@org2.com" };

            var task1 = new Core.Entities.Task { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = $"Task {i} Org 1", LeadId = lead1.Id };
            var task2 = new Core.Entities.Task { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = $"Task {i} Org 2", LeadId = lead2.Id };

            leads.AddRange([lead1, lead2]);
            users.AddRange([user1, user2]);
            stages.AddRange([stage1, stage2]);
            tasks.AddRange([task1, task2]);
        }

        context.Organizations.AddRange(org1, org2);
        context.Leads.AddRange(leads);
        context.BusinessUsers.AddRange(users);
        context.Stages.AddRange(stages);
        context.Tasks.AddRange(tasks);
        await context.SaveChangesAsync();

        // Act - Measure performance
        var stopwatch = Stopwatch.StartNew();

        var filteredLeads = await context.Leads.ToListAsync();
        var filteredUsers = await context.BusinessUsers.ToListAsync();
        var filteredStages = await context.Stages.ToListAsync();
        var filteredTasks = await context.Tasks.ToListAsync();

        stopwatch.Stop();

        // Assert
        Assert.Equal(1000, filteredLeads.Count);
        Assert.Equal(1000, filteredUsers.Count);
        Assert.Equal(1000, filteredStages.Count);
        Assert.Equal(1000, filteredTasks.Count);

        // Performance assertion - should complete within reasonable time (adjust threshold as needed)
        Assert.True(stopwatch.ElapsedMilliseconds < 5000, $"Query took {stopwatch.ElapsedMilliseconds}ms, expected < 5000ms");

        // Verify all results belong to the correct organization
        Assert.All(filteredLeads, lead => Assert.Equal(orgId1, lead.OrganizationId));
        Assert.All(filteredUsers, user => Assert.Equal(orgId1, user.OrganizationId));
        Assert.All(filteredStages, stage => Assert.Equal(orgId1, stage.OrganizationId));
        Assert.All(filteredTasks, task => Assert.Equal(orgId1, task.OrganizationId));
    }

    [Fact]
    public async Task TenantFilter_ComplexQueryPerformance_IsAcceptable()
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

        var stages = new List<Stage>();
        var leads = new List<Lead>();
        var users = new List<User>();

        // Create 500 records for each organization
        for (int i = 0; i < 500; i++)
        {
            var stage1 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId1, Name = $"Stage {i}", Order = i };
            var stage2 = new Stage { Id = Guid.NewGuid(), OrganizationId = orgId2, Name = $"Stage {i}", Order = i };

            var user1 = new User { Id = Guid.NewGuid(), OrganizationId = orgId1, FirstName = $"User{i}", LastName = "Org1", Email = $"user{i}@org1.com" };
            var user2 = new User { Id = Guid.NewGuid(), OrganizationId = orgId2, FirstName = $"User{i}", LastName = "Org2", Email = $"user{i}@org2.com" };

            var lead1 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId1, Title = $"Lead {i} Org 1", StageId = stage1.Id, AssignedUserId = user1.Id };
            var lead2 = new Lead { Id = Guid.NewGuid(), OrganizationId = orgId2, Title = $"Lead {i} Org 2", StageId = stage2.Id, AssignedUserId = user2.Id };

            stages.AddRange([stage1, stage2]);
            users.AddRange([user1, user2]);
            leads.AddRange([lead1, lead2]);
        }

        context.Organizations.AddRange(org1, org2);
        context.Stages.AddRange(stages);
        context.BusinessUsers.AddRange(users);
        context.Leads.AddRange(leads);
        await context.SaveChangesAsync();

        // Act - Complex query with joins and filtering
        var stopwatch = Stopwatch.StartNew();

        var complexQuery = await context.Leads
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .Where(l => l.EstimatedValue > 0)
            .OrderBy(l => l.CreatedAt)
            .ThenBy(l => l.Title)
            .ToListAsync();

        stopwatch.Stop();

        // Assert
        Assert.Equal(500, complexQuery.Count);
        Assert.True(stopwatch.ElapsedMilliseconds < 3000, $"Complex query took {stopwatch.ElapsedMilliseconds}ms, expected < 3000ms");

        // Verify all results belong to the correct organization
        Assert.All(complexQuery, lead => Assert.Equal(orgId1, lead.OrganizationId));
        Assert.All(complexQuery, lead => Assert.NotNull(lead.Stage));
        Assert.All(complexQuery, lead => Assert.Equal(orgId1, lead.Stage.OrganizationId));
    }

    [Fact]
    public async Task TenantFilter_AggregateQueryPerformance_IsAcceptable()
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

        var leads = new List<Lead>();

        // Create 1000 leads for each organization with varying values
        var random = new Random(42); // Fixed seed for reproducible tests
        for (int i = 0; i < 1000; i++)
        {
            var lead1 = new Lead 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = orgId1, 
                Title = $"Lead {i} Org 1", 
                EstimatedValue = random.Next(1000, 10000),
                Status = i % 2 == 0 ? "Open" : "Won"
            };
            
            var lead2 = new Lead 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = orgId2, 
                Title = $"Lead {i} Org 2", 
                EstimatedValue = random.Next(1000, 10000),
                Status = i % 2 == 0 ? "Open" : "Won"
            };

            leads.AddRange([lead1, lead2]);
        }

        context.Organizations.AddRange(org1, org2);
        context.Leads.AddRange(leads);
        await context.SaveChangesAsync();

        // Act - Multiple aggregate queries
        var stopwatch = Stopwatch.StartNew();

        var totalValue = await context.Leads.SumAsync(l => l.EstimatedValue ?? 0);
        var averageValue = await context.Leads.AverageAsync(l => l.EstimatedValue ?? 0);
        var maxValue = await context.Leads.MaxAsync(l => l.EstimatedValue ?? 0);
        var minValue = await context.Leads.MinAsync(l => l.EstimatedValue ?? 0);
        var openLeadsCount = await context.Leads.CountAsync(l => l.Status == "Open");
        var wonLeadsCount = await context.Leads.CountAsync(l => l.Status == "Won");

        stopwatch.Stop();

        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds < 2000, $"Aggregate queries took {stopwatch.ElapsedMilliseconds}ms, expected < 2000ms");
        
        // Verify results are reasonable (should only include Org 1 data)
        Assert.True(totalValue > 0);
        Assert.True(averageValue > 0);
        Assert.True(maxValue > 0);
        Assert.True(minValue > 0);
        Assert.Equal(500, openLeadsCount); // Half of 1000 leads should be "Open"
        Assert.Equal(500, wonLeadsCount);  // Half of 1000 leads should be "Won"
    }

    [Fact]
    public async Task TenantFilter_NoTenantContext_PerformanceIsStillAcceptable()
    {
        // Arrange
        _mockTenantFilterService.Setup(x => x.GetCurrentOrganizationId()).Returns((Guid?)null);

        using var context = new LeadTrackerDbContext(_options, _mockTenantFilterService.Object);

        // Create large dataset
        var orgId = Guid.NewGuid();
        var org = new Organization { Id = orgId, Name = "Test Org", Domain = "test.com" };
        var leads = new List<Lead>();

        for (int i = 0; i < 1000; i++)
        {
            leads.Add(new Lead 
            { 
                Id = Guid.NewGuid(), 
                OrganizationId = orgId, 
                Title = $"Lead {i}" 
            });
        }

        context.Organizations.Add(org);
        context.Leads.AddRange(leads);
        await context.SaveChangesAsync();

        // Act - Query with no tenant context (should return empty results)
        var stopwatch = Stopwatch.StartNew();

        var filteredLeads = await context.Leads.ToListAsync();
        var leadCount = await context.Leads.CountAsync();

        stopwatch.Stop();

        // Assert
        Assert.Empty(filteredLeads);
        Assert.Equal(0, leadCount);
        Assert.True(stopwatch.ElapsedMilliseconds < 1000, $"Query with no tenant context took {stopwatch.ElapsedMilliseconds}ms, expected < 1000ms");
    }

    public void Dispose()
    {
        using var context = new LeadTrackerDbContext(_options);
        context.Database.EnsureDeleted();
    }
}
