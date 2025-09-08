using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service for getting current user information
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetCurrentUserId()
    {
        var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("user_id");
        return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId) ? userId : null;
    }

    public string? GetCurrentUserEmail()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;
    }

    public Guid? GetCurrentOrganizationId()
    {
        var orgIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("org_id");
        return orgIdClaim != null && Guid.TryParse(orgIdClaim.Value, out var orgId) ? orgId : null;
    }

    public IList<string> GetCurrentUserRoles()
    {
        return _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList() ?? new List<string>();
    }

    public ClaimsPrincipal? GetCurrentUser()
    {
        return _httpContextAccessor.HttpContext?.User;
    }
}
