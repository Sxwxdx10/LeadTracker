using LeadTracker.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for seeding test data
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication
public class SeedController : ControllerBase
{
    private readonly ILeadSeederService _seederService;
    private readonly ILogger<SeedController> _logger;

    public SeedController(ILeadSeederService seederService, ILogger<SeedController> logger)
    {
        _seederService = seederService;
        _logger = logger;
    }

    /// <summary>
    /// Seeds test leads for the current organization
    /// </summary>
    /// <param name="count">Number of leads to create (default: 20)</param>
    /// <returns>Result of the seeding operation</returns>
    [HttpPost("leads")]
    public async Task<IActionResult> SeedLeads([FromQuery] int count = 20)
    {
        try
        {
            // Get organization ID from current user context
            var organizationId = GetCurrentOrganizationId();
            if (!organizationId.HasValue)
            {
                return BadRequest("Unable to determine organization context");
            }

            _logger.LogInformation("Starting to seed {Count} leads for organization {OrganizationId}", count, organizationId.Value);

            var leadsCreated = await _seederService.SeedTestLeadsAsync(organizationId.Value, count);

            return Ok(new
            {
                message = $"Successfully seeded {leadsCreated} test leads",
                leadsCreated,
                organizationId = organizationId.Value
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding leads");
            return StatusCode(500, new { message = "An error occurred while seeding leads", error = ex.Message });
        }
    }

    /// <summary>
    /// Seeds default stages for the current organization
    /// </summary>
    /// <returns>Result of the seeding operation</returns>
    [HttpPost("stages")]
    public async Task<IActionResult> SeedStages()
    {
        try
        {
            var organizationId = GetCurrentOrganizationId();
            if (!organizationId.HasValue)
            {
                return BadRequest("Unable to determine organization context");
            }

            _logger.LogInformation("Starting to seed default stages for organization {OrganizationId}", organizationId.Value);

            var stagesCreated = await _seederService.SeedDefaultStagesAsync(organizationId.Value);

            return Ok(new
            {
                message = $"Successfully seeded {stagesCreated} default stages",
                stagesCreated,
                organizationId = organizationId.Value
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding stages");
            return StatusCode(500, new { message = "An error occurred while seeding stages", error = ex.Message });
        }
    }

    /// <summary>
    /// Seeds test users for the current organization
    /// </summary>
    /// <returns>Result of the seeding operation</returns>
    [HttpPost("users")]
    public async Task<IActionResult> SeedUsers()
    {
        try
        {
            var organizationId = GetCurrentOrganizationId();
            if (!organizationId.HasValue)
            {
                return BadRequest("Unable to determine organization context");
            }

            _logger.LogInformation("Starting to seed test users for organization {OrganizationId}", organizationId.Value);

            var usersCreated = await _seederService.SeedTestUsersAsync(organizationId.Value);

            return Ok(new
            {
                message = $"Successfully seeded {usersCreated} test users",
                usersCreated,
                organizationId = organizationId.Value
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding users");
            return StatusCode(500, new { message = "An error occurred while seeding users", error = ex.Message });
        }
    }

    /// <summary>
    /// Seeds all test data (stages, users, and leads) for the current organization
    /// </summary>
    /// <param name="leadCount">Number of leads to create (default: 20)</param>
    /// <returns>Result of the seeding operation</returns>
    [HttpPost("all")]
    public async Task<IActionResult> SeedAll([FromQuery] int leadCount = 20)
    {
        try
        {
            var organizationId = GetCurrentOrganizationId();
            if (!organizationId.HasValue)
            {
                return BadRequest("Unable to determine organization context");
            }

            _logger.LogInformation("Starting to seed all test data for organization {OrganizationId}", organizationId.Value);

            // Seed stages first
            var stagesCreated = await _seederService.SeedDefaultStagesAsync(organizationId.Value);
            
            // Seed users
            var usersCreated = await _seederService.SeedTestUsersAsync(organizationId.Value);
            
            // Seed leads
            var leadsCreated = await _seederService.SeedTestLeadsAsync(organizationId.Value, leadCount);

            return Ok(new
            {
                message = "Successfully seeded all test data",
                stagesCreated,
                usersCreated,
                leadsCreated,
                organizationId = organizationId.Value
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding all data");
            return StatusCode(500, new { message = "An error occurred while seeding all data", error = ex.Message });
        }
    }

    /// <summary>
    /// Gets the current organization ID from the user context
    /// </summary>
    /// <returns>Organization ID or null if not found</returns>
    private Guid? GetCurrentOrganizationId()
    {
        // Try to get from claims first
        var organizationIdClaim = User.FindFirst("org_id") ?? User.FindFirst("organization_id");
        if (organizationIdClaim != null && Guid.TryParse(organizationIdClaim.Value, out var orgId))
        {
            return orgId;
        }

        // Fallback: try to get from user ID and look up in database
        var userIdClaim = User.FindFirst("sub") ?? User.FindFirst("user_id");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            // This would require database access, but for now we'll return null
            // In a real implementation, you'd inject a service to get the user's organization
            _logger.LogWarning("Could not determine organization ID from claims. User ID: {UserId}", userId);
        }

        return null;
    }
}
