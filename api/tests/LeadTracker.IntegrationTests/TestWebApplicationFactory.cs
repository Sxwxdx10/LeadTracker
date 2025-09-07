using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using Microsoft.Extensions.Configuration;

namespace LeadTracker.IntegrationTests;

/// <summary>
/// Custom WebApplicationFactory for integration tests that disables Hangfire
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Add in-memory database for testing
            services.AddDbContext<LeadTrackerDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDb_IntegrationTests");
            });

            // Add test data seeding
            services.AddScoped<ITestDataSeeder, TestDataSeeder>();

            // Remove Hangfire services for testing
            var hangfireServices = services.Where(s => 
                s.ServiceType.FullName?.Contains("Hangfire") == true ||
                s.ImplementationType?.FullName?.Contains("Hangfire") == true).ToList();
            
            foreach (var service in hangfireServices)
            {
                services.Remove(service);
            }

            // Remove Hangfire server
            var hangfireServerDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(Hangfire.BackgroundJobServer));
            if (hangfireServerDescriptor != null)
                services.Remove(hangfireServerDescriptor);

            // Remove Hangfire configuration
            var hangfireConfigDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(Hangfire.IGlobalConfiguration));
            if (hangfireConfigDescriptor != null)
                services.Remove(hangfireConfigDescriptor);

        });

        // Override configuration to disable Hangfire and migrations
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Hangfire:EnableDashboard"] = "false"
            });
        });
    }
}
