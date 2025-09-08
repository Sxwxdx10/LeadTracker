using LeadTracker.Infrastructure;

namespace LeadTracker.IntegrationTests.Services;

public interface ITestDataSeeder
{
    System.Threading.Tasks.Task SeedDataAsync(LeadTrackerDbContext context);
}
