using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing pipeline stages
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class StagesController : ControllerBase
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger<StagesController> _logger;

    public StagesController(LeadTrackerDbContext context, ILogger<StagesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all stages for the current organization
    /// </summary>
    /// <returns>List of stages</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<Stage>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStages()
    {
        try
        {
            var stages = await _context.GetStagesForCurrentTenant()
                .Include(s => s.Organization)
                .OrderBy(s => s.Order)
                .ToListAsync();

            return Ok(stages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stages");
            return StatusCode(500, new { message = "An error occurred while retrieving stages" });
        }
    }

    /// <summary>
    /// Get a specific stage by ID
    /// </summary>
    /// <param name="id">Stage ID</param>
    /// <returns>Stage details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Stage), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStage(Guid id)
    {
        try
        {
            var stage = await _context.GetStagesForCurrentTenant()
                .Include(s => s.Organization)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (stage == null)
            {
                return NotFound();
            }

            return Ok(stage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stage {StageId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the stage" });
        }
    }
}
