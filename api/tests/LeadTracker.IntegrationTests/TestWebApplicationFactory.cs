using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using Microsoft.Extensions.Configuration;
using LeadTracker.IntegrationTests.Services;

namespace LeadTracker.IntegrationTests;

/// <summary>
/// Custom WebApplicationFactory for integration tests that disables Hangfire
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Set environment variables before any configuration
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("DISABLE_HANGFIRE", "true");
        
        // Override configuration to disable Hangfire and migrations
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Load the testing configuration file first
            config.AddJsonFile("appsettings.Testing.json", optional: false, reloadOnChange: true);
            
            // Override with in-memory configuration to ensure Hangfire is completely disabled
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Hangfire:EnableDashboard"] = "false",
                ["Hangfire:Enabled"] = "false",
                ["Hangfire:DisableForTesting"] = "true",
                ["Hangfire:UseInMemoryStorage"] = "false",
                ["Hangfire:SkipDatabaseConnection"] = "true",
                ["Environment"] = "Testing"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Use PostgreSQL for integration tests (same as production)
            services.AddDbContext<LeadTrackerDbContext>(options =>
            {
                var connectionString = "Server=localhost;Port=5433;Database=leadtracker_test;User Id=test;Password=test;";
                options.UseNpgsql(connectionString);
            });

            // Add test data seeding
            services.AddScoped<ITestDataSeeder, TestDataSeeder>();
        });
    }
}
