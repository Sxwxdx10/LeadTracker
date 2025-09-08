using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using LeadTracker.Infrastructure;
using LeadTracker.Infrastructure.Seed;

namespace LeadTracker.Api.Commands;

/// <summary>
/// CLI command to seed demo data including 50 realistic leads
/// </summary>
public class SeedDemoDataCommand : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SeedDemoDataCommand> _logger;

    public SeedDemoDataCommand(IServiceProvider serviceProvider, ILogger<SeedDemoDataCommand> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // This will be called when the application starts
        // We'll implement the actual seeding in a separate method
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    /// <summary>
    /// Executes the demo data seeding process
    /// </summary>
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting demo data seeding process...");

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
            var seeder = new DemoDataSeeder(context, _serviceProvider.GetRequiredService<ILogger<DemoDataSeeder>>());

            await seeder.SeedDemoDataAsync();

            _logger.LogInformation("Demo data seeding completed successfully!");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during demo data seeding");
            throw;
        }
    }
}

/// <summary>
/// Extension methods for registering the seed command
/// </summary>
public static class SeedCommandExtensions
{
    public static IServiceCollection AddSeedCommand(this IServiceCollection services)
    {
        services.AddScoped<SeedDemoDataCommand>();
        return services;
    }
}
