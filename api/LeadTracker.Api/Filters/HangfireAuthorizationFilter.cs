using Hangfire.Dashboard;

namespace LeadTracker.Api.Filters;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // In development, allow all access
        // In production, implement proper authorization
        return true;
    }
}
