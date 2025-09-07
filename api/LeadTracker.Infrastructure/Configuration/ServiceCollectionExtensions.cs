using Microsoft.Extensions.DependencyInjection;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Configuration;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Register tenant filter service
        services.AddScoped<ITenantFilterService, TenantFilterService>();
        
        return services;
    }
}
