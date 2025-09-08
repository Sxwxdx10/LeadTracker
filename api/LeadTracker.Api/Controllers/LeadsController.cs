using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing leads
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(ILeadService leadService, ILogger<LeadsController> logger)
    {
        _leadService = leadService;
        _logger = logger;
    }

    /// <summary>
    /// Get leads with pagination, filtering, and sorting
    /// </summary>
    /// <param name="query">Query parameters for filtering and pagination</param>
    /// <returns>Paginated list of leads</returns>
    [HttpGet]
    [ProducesResponseType(typeof(LeadListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeads([FromQuery] LeadQueryDto query)
    {
        try
        {
            // Validate pagination parameters
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1 || query.PageSize > 100) query.PageSize = 10;

            var result = await _leadService.GetLeadsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leads");
            return StatusCode(500, new { message = "An error occurred while retrieving leads" });
        }
    }

    /// <summary>
    /// Get a specific lead by ID
    /// </summary>
    /// <param name="id">Lead ID</param>
    /// <returns>Lead details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(LeadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLead(Guid id)
    {
        try
        {
            var lead = await _leadService.GetLeadByIdAsync(id);
            if (lead == null)
            {
                return NotFound();
            }

            return Ok(lead);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving lead {LeadId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the lead" });
        }
    }

    /// <summary>
    /// Create a new lead
    /// </summary>
    /// <param name="createDto">Lead creation data</param>
    /// <returns>Created lead</returns>
    [HttpPost]
    [ProducesResponseType(typeof(LeadResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var lead = await _leadService.CreateLeadAsync(createDto);
            return CreatedAtAction(nameof(GetLead), new { id = lead.Id }, lead);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating lead");
            return StatusCode(500, new { message = "An error occurred while creating the lead" });
        }
    }

    /// <summary>
    /// Update an existing lead
    /// </summary>
    /// <param name="id">Lead ID</param>
    /// <param name="updateDto">Lead update data</param>
    /// <returns>Updated lead</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(LeadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var lead = await _leadService.UpdateLeadAsync(id, updateDto);
            if (lead == null)
            {
                return NotFound();
            }

            return Ok(lead);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating lead {LeadId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the lead" });
        }
    }

    /// <summary>
    /// Delete a lead
    /// </summary>
    /// <param name="id">Lead ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteLead(Guid id)
    {
        try
        {
            var deleted = await _leadService.DeleteLeadAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting lead {LeadId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the lead" });
        }
    }

    /// <summary>
    /// Get lead statistics for the current organization
    /// </summary>
    /// <returns>Lead statistics</returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(LeadStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeadStats()
    {
        try
        {
            var stats = await _leadService.GetLeadStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving lead statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving lead statistics" });
        }
    }
}
