using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing activities
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;
    private readonly ILogger<ActivitiesController> _logger;

    public ActivitiesController(IActivityService activityService, ILogger<ActivitiesController> logger)
    {
        _activityService = activityService;
        _logger = logger;
    }

    /// <summary>
    /// Get activities with pagination and filtering
    /// </summary>
    /// <param name="query">Query parameters for filtering and pagination</param>
    /// <returns>Paginated list of activities</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ActivityListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActivities([FromQuery] ActivityQueryDto query)
    {
        try
        {
            // Validate pagination parameters
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1 || query.PageSize > 1000) query.PageSize = 10;

            var result = await _activityService.GetActivitiesAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving activities");
            return StatusCode(500, new { message = "An error occurred while retrieving activities" });
        }
    }

    /// <summary>
    /// Get a specific activity by ID
    /// </summary>
    /// <param name="id">Activity ID</param>
    /// <returns>Activity details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ActivityResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActivity(Guid id)
    {
        try
        {
            var activity = await _activityService.GetActivityByIdAsync(id);
            if (activity == null)
            {
                return NotFound();
            }

            return Ok(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving activity {ActivityId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the activity" });
        }
    }

    /// <summary>
    /// Create a new activity
    /// </summary>
    /// <param name="createDto">Activity creation data</param>
    /// <returns>Created activity</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ActivityResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateActivity([FromBody] CreateActivityDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var activity = await _activityService.CreateActivityAsync(createDto);
            return CreatedAtAction(nameof(GetActivity), new { id = activity.Id }, activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating activity");
            return StatusCode(500, new { message = "An error occurred while creating the activity" });
        }
    }

    /// <summary>
    /// Update an existing activity
    /// </summary>
    /// <param name="id">Activity ID</param>
    /// <param name="updateDto">Activity update data</param>
    /// <returns>Updated activity</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ActivityResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateActivity(Guid id, [FromBody] UpdateActivityDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var activity = await _activityService.UpdateActivityAsync(id, updateDto);
            if (activity == null)
            {
                return NotFound();
            }

            return Ok(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating activity {ActivityId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the activity" });
        }
    }

    /// <summary>
    /// Delete an activity
    /// </summary>
    /// <param name="id">Activity ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteActivity(Guid id)
    {
        try
        {
            var deleted = await _activityService.DeleteActivityAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting activity {ActivityId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the activity" });
        }
    }

    /// <summary>
    /// Get activities for a specific lead
    /// </summary>
    /// <param name="leadId">Lead ID</param>
    /// <returns>List of activities</returns>
    [HttpGet("lead/{leadId}")]
    [ProducesResponseType(typeof(List<ActivityResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActivitiesByLead(Guid leadId)
    {
        try
        {
            var activities = await _activityService.GetActivitiesByLeadIdAsync(leadId);
            return Ok(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving activities for lead {LeadId}", leadId);
            return StatusCode(500, new { message = "An error occurred while retrieving activities" });
        }
    }

    /// <summary>
    /// Get activities for the current user
    /// </summary>
    /// <returns>List of activities</returns>
    [HttpGet("my-activities")]
    [ProducesResponseType(typeof(List<ActivityResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyActivities()
    {
        try
        {
            var activities = await _activityService.GetMyActivitiesAsync();
            return Ok(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user activities");
            return StatusCode(500, new { message = "An error occurred while retrieving your activities" });
        }
    }

    /// <summary>
    /// Mark an activity as completed
    /// </summary>
    /// <param name="id">Activity ID</param>
    /// <param name="request">Completion details</param>
    /// <returns>Updated activity</returns>
    [HttpPost("{id}/complete")]
    [ProducesResponseType(typeof(ActivityResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteActivity(Guid id, [FromBody] CompleteActivityRequest? request = null)
    {
        try
        {
            var activity = await _activityService.CompleteActivityAsync(
                id,
                request?.Outcome,
                request?.DurationMinutes);

            if (activity == null)
            {
                return NotFound();
            }

            return Ok(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing activity {ActivityId}", id);
            return StatusCode(500, new { message = "An error occurred while completing the activity" });
        }
    }
}

/// <summary>
/// Request for completing an activity
/// </summary>
public class CompleteActivityRequest
{
    public string? Outcome { get; set; }
    public int? DurationMinutes { get; set; }
}

