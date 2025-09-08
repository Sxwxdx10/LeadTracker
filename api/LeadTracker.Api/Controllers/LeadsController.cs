using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing leads
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(LeadTrackerDbContext context, ILogger<LeadsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all leads for the current organization
    /// </summary>
    /// <returns>List of leads</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<Lead>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeads()
    {
        try
        {
            var leads = await _context.GetLeadsForCurrentTenant()
                .Include(l => l.Stage)
                .Include(l => l.AssignedUser)
                .ToListAsync();

            return Ok(leads);
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
    [ProducesResponseType(typeof(Lead), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLead(Guid id)
    {
        try
        {
            var lead = await _context.GetLeadsForCurrentTenant()
                .Include(l => l.Stage)
                .Include(l => l.AssignedUser)
                .FirstOrDefaultAsync(l => l.Id == id);

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
}
