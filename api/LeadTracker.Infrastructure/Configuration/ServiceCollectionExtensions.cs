using Microsoft.Extensions.DependencyInjection;

namespace LeadTracker.Infrastructure.Configuration;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Add infrastructure services here
        return services;
    }
}
