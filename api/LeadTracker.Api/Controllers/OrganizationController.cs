using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing organization settings
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationController : ControllerBase
{
    private readonly IOrganizationService _organizationService;
    private readonly ILogger<OrganizationController> _logger;

    public OrganizationController(
        IOrganizationService organizationService,
        ILogger<OrganizationController> logger)
    {
        _organizationService = organizationService;
        _logger = logger;
    }

    /// <summary>
    /// Get current organization
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(OrganizationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrganization()
    {
        try
        {
            var organization = await _organizationService.GetCurrentOrganizationAsync();
            return Ok(organization);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Organization not found or context unavailable");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving organization");
            return StatusCode(500, new { message = "An error occurred while retrieving organization" });
        }
    }

    /// <summary>
    /// Update organization
    /// </summary>
    [HttpPut]
    [ProducesResponseType(typeof(OrganizationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateOrganization([FromBody] UpdateOrganizationDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organization = await _organizationService.UpdateOrganizationAsync(updateDto);
            return Ok(organization);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Organization not found or context unavailable");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating organization");
            return StatusCode(500, new { message = "An error occurred while updating organization" });
        }
    }

    /// <summary>
    /// Upload organization logo
    /// </summary>
    [HttpPost("logo")]
    [ProducesResponseType(typeof(OrganizationLogoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadLogo(IFormFile logo)
    {
        try
        {
            if (logo == null || logo.Length == 0)
            {
                return BadRequest(new { message = "No file provided" });
            }

            if (logo.Length > 2 * 1024 * 1024) // 2MB max
            {
                return BadRequest(new { message = "File size exceeds 2MB limit" });
            }

            using (var stream = logo.OpenReadStream())
            {
                var result = await _organizationService.UploadLogoAsync(stream, logo.FileName, logo.ContentType);
                return Ok(result);
            }
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid file provided for logo upload");
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Organization not found or context unavailable");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading logo");
            return StatusCode(500, new { message = "An error occurred while uploading logo" });
        }
    }
}

