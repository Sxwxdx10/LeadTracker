using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using LeadTracker.Core.Entities;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for data repair and migration utilities
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RepairController : ControllerBase
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger<RepairController> _logger;

    public RepairController(LeadTrackerDbContext context, ILogger<RepairController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Create missing BusinessUsers for ApplicationUsers that don't have them
    /// </summary>
    [HttpPost("create-missing-business-users")]
    [AllowAnonymous] // Temporary for repair - should be protected in production
    public async Task<IActionResult> CreateMissingBusinessUsers()
    {
        try
        {
            _logger.LogInformation("Starting repair: Creating missing BusinessUsers");

            // Find ApplicationUsers without BusinessUsers
            var usersWithoutBusinessUser = await _context.Users
                .IgnoreQueryFilters()
                .Where(u => u.DomainUserId == null || !_context.BusinessUsers.Any(bu => bu.IdentityUserId == u.Id))
                .ToListAsync();

            _logger.LogInformation("Found {Count} users without BusinessUser", usersWithoutBusinessUser.Count);

            var created = 0;
            var updated = 0;

            foreach (var appUser in usersWithoutBusinessUser)
            {
                // Check if BusinessUser already exists with this email
                var existingBusinessUser = await _context.BusinessUsers
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(bu => bu.Email == appUser.Email);

                if (existingBusinessUser != null)
                {
                    // Link existing BusinessUser to ApplicationUser
                    appUser.DomainUserId = existingBusinessUser.Id;
                    _context.Users.Update(appUser);
                    updated++;
                    _logger.LogInformation("Linked existing BusinessUser {Id} to ApplicationUser {Email}", 
                        existingBusinessUser.Id, appUser.Email);
                }
                else
                {
                    // Create new BusinessUser
                    var businessUser = new User
                    {
                        FirstName = appUser.FirstName,
                        LastName = appUser.LastName,
                        Email = appUser.Email!,
                        JobTitle = appUser.JobTitle,
                        IsActive = appUser.IsActive,
                        OrganizationId = appUser.OrganizationId,
                        IdentityUserId = appUser.Id,
                        CreatedAt = appUser.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.BusinessUsers.Add(businessUser);
                    await _context.SaveChangesAsync(); // Save to get the ID

                    // Update ApplicationUser with BusinessUser reference
                    appUser.DomainUserId = businessUser.Id;
                    _context.Users.Update(appUser);
                    
                    created++;
                    _logger.LogInformation("Created BusinessUser {Id} for ApplicationUser {Email}", 
                        businessUser.Id, appUser.Email);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Repair complete: {Created} created, {Updated} updated", created, updated);

            return Ok(new
            {
                message = "Repair completed successfully",
                usersFound = usersWithoutBusinessUser.Count,
                businessUsersCreated = created,
                linksUpdated = updated,
                details = usersWithoutBusinessUser.Select(u => new
                {
                    email = u.Email,
                    appUserId = u.Id,
                    domainUserId = u.DomainUserId
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during BusinessUser repair");
            return StatusCode(500, new { message = "Error during repair", error = ex.Message });
        }
    }

    /// <summary>
    /// Check user status
    /// </summary>
    [HttpGet("check-user/{email}")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckUser(string email)
    {
        try
        {
            var appUser = await _context.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == email);

            if (appUser == null)
            {
                return NotFound(new { message = "ApplicationUser not found" });
            }

            var businessUser = await _context.BusinessUsers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(bu => bu.IdentityUserId == appUser.Id || bu.Email == email);

            return Ok(new
            {
                applicationUser = new
                {
                    id = appUser.Id,
                    email = appUser.Email,
                    firstName = appUser.FirstName,
                    lastName = appUser.LastName,
                    organizationId = appUser.OrganizationId,
                    domainUserId = appUser.DomainUserId,
                    isActive = appUser.IsActive
                },
                businessUser = businessUser != null ? new
                {
                    id = businessUser.Id,
                    email = businessUser.Email,
                    firstName = businessUser.FirstName,
                    lastName = businessUser.LastName,
                    organizationId = businessUser.OrganizationId,
                    identityUserId = businessUser.IdentityUserId,
                    isActive = businessUser.IsActive
                } : null,
                isLinked = appUser.DomainUserId.HasValue && businessUser != null && appUser.DomainUserId == businessUser.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user {Email}", email);
            return StatusCode(500, new { message = "Error checking user", error = ex.Message });
        }
    }
}

