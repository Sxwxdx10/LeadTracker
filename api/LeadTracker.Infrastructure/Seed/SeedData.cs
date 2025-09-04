using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.Infrastructure.Seed;

public static class SeedData
{
    public static async Task SeedAsync(DbContext context, IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILogger<object>>();
        logger.LogInformation("Seeding development data...");
        
        // Add seed data here when entities are implemented
        await Task.CompletedTask;
    }
}
