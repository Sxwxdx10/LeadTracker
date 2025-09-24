using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using Microsoft.Extensions.Configuration;
using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;

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
                ["Environment"] = "Testing",
                ["ConnectionStrings:DefaultConnection"] = "Server=localhost;Port=5433;Database=leadtracker_test;User Id=test;Password=test;"
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
                options.EnableSensitiveDataLogging();
            });

            
            // Add FluentValidation (missing in test configuration)
            services.AddValidatorsFromAssembly(typeof(LeadTracker.Core.Models.RegisterRequest).Assembly);
            
            // Add logging for debugging
            services.AddLogging(builder => builder.AddConsole());
            
            // Disable authentication for testing
            services.AddAuthentication("Test")
                .AddScheme<TestAuthenticationSchemeOptions, TestAuthenticationHandler>("Test", options => { });
            
            // Add authorization with test policy
            services.AddAuthorization(options =>
            {
                options.AddPolicy("Test", policy => policy.RequireAuthenticatedUser());
            });
            
            // Override the default authentication scheme
            services.Configure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = "Test";
                options.DefaultChallengeScheme = "Test";
                options.DefaultScheme = "Test";
            });
        });
    }
}
