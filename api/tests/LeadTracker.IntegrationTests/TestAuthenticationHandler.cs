using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace LeadTracker.IntegrationTests;

/// <summary>
/// Test authentication handler for integration tests
/// </summary>
public class TestAuthenticationHandler : AuthenticationHandler<TestAuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(IOptionsMonitor<TestAuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock)
        : base(options, logger, encoder, clock)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if there's an Authorization header
        if (!Request.Headers.ContainsKey("Authorization"))
        {
            return Task.FromResult(AuthenticateResult.Fail("No authorization header"));
        }

        // Try to extract organization ID from X-Org-Id header
        var orgIdHeader = Request.Headers["X-Org-Id"].FirstOrDefault();
        var orgId = !string.IsNullOrEmpty(orgIdHeader) ? orgIdHeader : "test-org-id";

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
            new Claim("sub", "test-user-id"),
            new Claim("email", "test@example.com"),
            new Claim("org_id", orgId)
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

/// <summary>
/// Test authentication scheme options
/// </summary>
public class TestAuthenticationSchemeOptions : AuthenticationSchemeOptions
{
}
