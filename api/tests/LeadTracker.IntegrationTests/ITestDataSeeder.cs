using System.Threading.Tasks;

namespace LeadTracker.IntegrationTests;

/// <summary>
/// Interface for seeding test data
/// </summary>
public interface ITestDataSeeder
{
    /// <summary>
    /// Seeds the database with test data
    /// </summary>
    System.Threading.Tasks.Task SeedAsync();
}
