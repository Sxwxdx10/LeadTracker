using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Api.Commands;
using Microsoft.Extensions.Logging;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for seeding demo data
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for seeding
public class SeedController : ControllerBase
{
    private readonly SeedDemoDataCommand _seedCommand;
    private readonly ILogger<SeedController> _logger;

    public SeedController(SeedDemoDataCommand seedCommand, ILogger<SeedController> logger)
    {
        _seedCommand = seedCommand;
        _logger = logger;
    }

    /// <summary>
    /// Seeds demo data including 50 realistic leads
    /// </summary>
    /// <returns>Result of the seeding operation</returns>
    [HttpPost("demo-data")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SeedDemoData()
    {
        try
        {
            _logger.LogInformation("Demo data seeding requested by user {UserId}", User.Identity?.Name);
            
            await _seedCommand.ExecuteAsync();
            
            return Ok(new
            {
                success = true,
                message = "Demo data seeded successfully",
                timestamp = DateTime.UtcNow,
                data = new
                {
                    leads = 50,
                    stages = 7,
                    tasks = "Variable (1-3 per lead)",
                    users = 3,
                    organizations = 1
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during demo data seeding");
            
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred during demo data seeding",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Gets information about the current demo data
    /// </summary>
    /// <returns>Information about seeded data</returns>
    [HttpGet("demo-data/info")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDemoDataInfo()
    {
        try
        {
            // This would typically query the database to get actual counts
            // For now, we'll return static information
            return Ok(new
            {
                success = true,
                message = "Demo data information",
                timestamp = DateTime.UtcNow,
                data = new
                {
                    description = "Comprehensive demo dataset with 50 realistic leads",
                    features = new[]
                    {
                        "50 leads with realistic company names and contact information",
                        "7 pipeline stages from Initial Contact to Closed Won/Lost",
                        "1-3 tasks per lead with various types and priorities",
                        "3 sales team members for lead assignment",
                        "Realistic probability and estimated values",
                        "Varied sources and industries",
                        "Proper distribution across pipeline stages"
                    },
                    statistics = new
                    {
                        totalLeads = 50,
                        totalStages = 7,
                        totalUsers = 3,
                        totalOrganizations = 1,
                        averageTasksPerLead = 2,
                        industries = 20,
                        sources = 20
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting demo data info");
            
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while getting demo data information",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
