using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace LeadTracker.Api.Attributes;

/// <summary>
/// Authorization attribute that requires specific roles
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireRoleAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _requiredRoles;

    public RequireRoleAttribute(params string[] roles)
    {
        _requiredRoles = roles ?? throw new ArgumentNullException(nameof(roles));
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Authentication required" });
            return;
        }

        var userRoles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        
        if (!_requiredRoles.Any(role => userRoles.Contains(role)))
        {
            context.Result = new ForbidResult();
            return;
        }
    }
}
