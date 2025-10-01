using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace LeadTracker.Api.Attributes;

/// <summary>
/// Authorization attribute that requires admin role
/// </summary>
public class RequireAdminAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Authentication required" });
            return;
        }

        var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        
        if (!roles.Contains("Admin"))
        {
            context.Result = new ForbidResult();
            return;
        }
    }
}
