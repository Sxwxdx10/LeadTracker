using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure;
using LeadTracker.Infrastructure.Seed;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Integration tests for demo data seeding functionality
/// </summary>
public class DemoDataSeedIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public DemoDataSeedIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SeedDemoData_ShouldCreate50Leads_WhenCalled()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Clear existing data - use raw SQL to bypass foreign key constraints
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Tasks\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Leads\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Stages\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"BusinessUsers\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Organizations\"");

        // Act
        var seeder = new DemoDataSeeder(context, scope.ServiceProvider.GetRequiredService<ILogger<DemoDataSeeder>>());
        await seeder.SeedDemoDataAsync();

        // Assert
        var leadCount = await context.Leads.CountAsync();
        var taskCount = await context.Tasks.CountAsync();
        var stageCount = await context.Stages.CountAsync();

        Assert.Equal(50, leadCount);
        Assert.True(taskCount >= 50); // At least 1 task per lead
        Assert.True(stageCount >= 7); // 7 pipeline stages
    }

    [Fact]
    public async Task SeedDemoData_ShouldCreateRealisticData_WhenCalled()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Clear existing data
        context.Leads.RemoveRange(await context.Leads.ToListAsync());
        await context.SaveChangesAsync();

        // Act
        var seeder = new DemoDataSeeder(context, scope.ServiceProvider.GetRequiredService<ILogger<DemoDataSeeder>>());
        await seeder.SeedDemoDataAsync();

        // Assert
        var leads = await context.Leads.ToListAsync();
        
        // Check that leads have realistic data
        Assert.All(leads, lead =>
        {
            Assert.NotNull(lead.FirstName);
            Assert.NotNull(lead.LastName);
            Assert.NotNull(lead.Email);
            Assert.NotNull(lead.Company);
            Assert.NotNull(lead.JobTitle);
            Assert.True(lead.EstimatedValue > 0);
            Assert.True(lead.Probability >= 0 && lead.Probability <= 100);
            Assert.NotNull(lead.Source);
            Assert.NotEqual(Guid.Empty, lead.StageId);
        });

        // Check distribution across stages
        var stageDistribution = leads.GroupBy(l => l.StageId).ToList();
        Assert.True(stageDistribution.Count >= 5); // Should have leads in multiple stages

        // Check that we have different companies
        var uniqueCompanies = leads.Select(l => l.Company).Distinct().Count();
        Assert.True(uniqueCompanies >= 40); // Most companies should be unique
    }

    [Fact]
    public async Task SeedDemoData_ShouldCreateTasksForLeads_WhenCalled()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Clear existing data - use raw SQL to bypass foreign key constraints
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Tasks\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Leads\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Stages\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"BusinessUsers\"");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Organizations\"");

        // Act
        var seeder = new DemoDataSeeder(context, scope.ServiceProvider.GetRequiredService<ILogger<DemoDataSeeder>>());
        await seeder.SeedDemoDataAsync();

        // Assert
        var leads = await context.Leads.Include(l => l.Tasks).ToListAsync();
        
        // Each lead should have 1-3 tasks
        Assert.All(leads, lead =>
        {
            Assert.True(lead.Tasks.Count >= 1);
            Assert.True(lead.Tasks.Count <= 3);
        });

        // Check task types
        var tasks = await context.Tasks.ToListAsync();
        var taskTypes = tasks.Select(t => t.Type).Distinct().ToList();
        Assert.Contains("Call", taskTypes);
        Assert.Contains("Email", taskTypes);
        Assert.Contains("Meeting", taskTypes);
        Assert.Contains("Follow-up", taskTypes);
    }

    [Fact]
    public async Task SeedDemoData_ShouldCreateProperPipelineStages_WhenCalled()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Clear existing data in correct order (leads first, then stages)
        context.Leads.RemoveRange(await context.Leads.ToListAsync());
        context.Tasks.RemoveRange(await context.Tasks.ToListAsync());
        await context.SaveChangesAsync();
        
        context.Stages.RemoveRange(await context.Stages.ToListAsync());
        await context.SaveChangesAsync();

        // Act
        var seeder = new DemoDataSeeder(context, scope.ServiceProvider.GetRequiredService<ILogger<DemoDataSeeder>>());
        await seeder.SeedDemoDataAsync();

        // Assert
        var stages = await context.Stages.OrderBy(s => s.Order).ToListAsync();
        
        Assert.Equal(7, stages.Count);
        Assert.Equal("Initial Contact", stages[0].Name);
        Assert.Equal("Qualified", stages[1].Name);
        Assert.Equal("Needs Analysis", stages[2].Name);
        Assert.Equal("Proposal", stages[3].Name);
        Assert.Equal("Negotiation", stages[4].Name);
        Assert.Equal("Closed Won", stages[5].Name);
        Assert.Equal("Closed Lost", stages[6].Name);

        // Check won/lost stages
        var wonStage = stages.First(s => s.IsWonStage);
        var lostStage = stages.First(s => s.IsLostStage);
        Assert.Equal("Closed Won", wonStage.Name);
        Assert.Equal("Closed Lost", lostStage.Name);
    }

    [Fact]
    public async Task SeedDemoData_ShouldDistributeLeadsAcrossStages_WhenCalled()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Clear existing data
        context.Leads.RemoveRange(await context.Leads.ToListAsync());
        await context.SaveChangesAsync();

        // Act
        var seeder = new DemoDataSeeder(context, scope.ServiceProvider.GetRequiredService<ILogger<DemoDataSeeder>>());
        await seeder.SeedDemoDataAsync();

        // Assert
        var stageDistribution = await context.Leads
            .GroupBy(l => l.StageId)
            .Select(g => new { StageId = g.Key, Count = g.Count() })
            .ToListAsync();

        // Should have leads in multiple stages
        Assert.True(stageDistribution.Count >= 5);
        
        // No single stage should have all leads
        var maxLeadsInStage = stageDistribution.Max(s => s.Count);
        Assert.True(maxLeadsInStage < 50);
    }
}
