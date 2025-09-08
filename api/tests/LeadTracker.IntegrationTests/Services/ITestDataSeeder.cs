using LeadTracker.Infrastructure;

namespace LeadTracker.IntegrationTests.Services;

public interface ITestDataSeeder
{
    System.Threading.Tasks.Task SeedDataAsync(LeadTrackerDbContext context);
    System.Threading.Tasks.Task CreateDefaultStagesForOrganizationAsync(LeadTrackerDbContext context, Guid organizationId);
}
