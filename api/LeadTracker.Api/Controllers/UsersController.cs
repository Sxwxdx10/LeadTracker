using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using LeadTracker.Core.Entities;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;
using LeadTracker.Core.Models;
using LeadTracker.Infrastructure;
using LeadTracker.Api.Attributes;
using System.Security.Claims;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing business users
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger<UsersController> _logger;
    private readonly IUserInvitationService _invitationService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantContext _tenantContext;

    public UsersController(
        LeadTrackerDbContext context, 
        ILogger<UsersController> logger,
        IUserInvitationService invitationService,
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService,
        ITenantContext tenantContext)
    {
        _context = context;
        _logger = logger;
        _invitationService = invitationService;
        _userManager = userManager;
        _currentUserService = currentUserService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// Update the currently authenticated user's profile
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateProfileRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentUserId = _currentUserService.GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var user = await _context.BusinessUsers
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value && u.OrganizationId == organizationId);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            ApplicationUser? applicationUser = null;
            if (user.IdentityUserId.HasValue)
            {
                applicationUser = await _userManager.FindByIdAsync(user.IdentityUserId.Value.ToString());
                if (applicationUser == null)
                {
                    _logger.LogWarning("Identity user not found for domain user {UserId}", user.Id);
                }
            }

            var hasChanges = false;

            if (!string.IsNullOrWhiteSpace(request.FirstName) && request.FirstName.Trim() != user.FirstName)
            {
                user.FirstName = request.FirstName.Trim();
                hasChanges = true;
            }

            if (!string.IsNullOrWhiteSpace(request.LastName) && request.LastName.Trim() != user.LastName)
            {
                user.LastName = request.LastName.Trim();
                hasChanges = true;
            }

            if (request.JobTitle != null && request.JobTitle != user.JobTitle)
            {
                user.JobTitle = string.IsNullOrWhiteSpace(request.JobTitle) ? null : request.JobTitle.Trim();
                hasChanges = true;
            }

            if (!string.IsNullOrWhiteSpace(request.Email) && !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
            {
                var normalizedEmail = request.Email.Trim();

                var emailExists = await _userManager.Users
                    .AnyAsync(u => u.Email == normalizedEmail && u.OrganizationId == user.OrganizationId && u.Id != user.IdentityUserId);

                if (emailExists)
                {
                    return BadRequest(new { message = "Cette adresse email est déjà utilisée." });
                }

                user.Email = normalizedEmail;
                hasChanges = true;

                if (applicationUser != null)
                {
                    var emailResult = await _userManager.SetEmailAsync(applicationUser, normalizedEmail);
                    if (!emailResult.Succeeded)
                    {
                        return BadRequest(new { message = "Impossible de mettre à jour l'email.", errors = emailResult.Errors });
                    }

                    var usernameResult = await _userManager.SetUserNameAsync(applicationUser, normalizedEmail);
                    if (!usernameResult.Succeeded)
                    {
                        return BadRequest(new { message = "Impossible de mettre à jour l'identifiant.", errors = usernameResult.Errors });
                    }
                }
            }

            if (!hasChanges)
            {
                var existingRoles = applicationUser != null
                    ? await _userManager.GetRolesAsync(applicationUser)
                    : new List<string>();

                return Ok(new UserInfo
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    FullName = user.FullName,
                    JobTitle = user.JobTitle,
                    Roles = existingRoles.ToList()
                });
            }

            if (applicationUser != null)
            {
                applicationUser.FirstName = user.FirstName;
                applicationUser.LastName = user.LastName;
                applicationUser.JobTitle = user.JobTitle;

                var identityUpdateResult = await _userManager.UpdateAsync(applicationUser);
                if (!identityUpdateResult.Succeeded)
                {
                    return BadRequest(new { message = "Impossible de mettre à jour le profil utilisateur.", errors = identityUpdateResult.Errors });
                }
            }

            _context.BusinessUsers.Update(user);
            await _context.SaveChangesAsync();

            var roles = applicationUser != null
                ? await _userManager.GetRolesAsync(applicationUser)
                : new List<string>();

            _logger.LogInformation("Current user {UserId} updated their profile", user.Id);

            return Ok(new UserInfo
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                FullName = user.FullName,
                JobTitle = user.JobTitle,
                Roles = roles.ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating current user profile");
            return StatusCode(500, new { message = "An error occurred while updating the profile" });
        }
    }

    /// <summary>
    /// Test endpoint for seeding
    /// </summary>
    /// <returns>Test message</returns>
    [HttpGet("test-seeding")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult TestSeeding()
    {
        return Ok(new { message = "Seeding test endpoint is working from UsersController!" });
    }

    /// <summary>
    /// Get simple list of users for task assignment (all authenticated users)
    /// </summary>
    /// <returns>Simple list of users for selection</returns>
    [HttpGet("simple")]
    [ProducesResponseType(typeof(List<SimpleUserInfo>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSimpleUsers()
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var users = await _context.BusinessUsers
                .Where(u => u.OrganizationId == organizationId && u.IsActive)
                .Select(u => new SimpleUserInfo
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    FullName = u.FullName,
                    Email = u.Email
                })
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving simple user list");
            return StatusCode(500, new { message = "An error occurred while retrieving users" });
        }
    }

    /// <summary>
    /// Get all business users for the current organization (Admin only)
    /// </summary>
    /// <returns>List of business users with management info</returns>
    [HttpGet]
    [RequireAdmin]
    [ProducesResponseType(typeof(UserListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var query = _context.BusinessUsers
                .Where(u => u.OrganizationId == organizationId)
                .Include(u => u.Organization);

            var totalCount = await query.CountAsync();

            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserManagementInfo
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    FullName = u.FullName,
                    Email = u.Email,
                    JobTitle = u.JobTitle,
                    PhoneNumber = u.PhoneNumber,
                    IsActive = u.IsActive,
                    LastLoginAt = u.LastLoginAt,
                    CreatedAt = u.CreatedAt,
                    OrganizationName = u.Organization.Name,
                    Roles = _context.UserRoles
                        .Where(ur => ur.UserId == u.IdentityUserId)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .ToList()
                })
                .ToListAsync();

            var response = new UserListResponse
            {
                Users = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving business users");
            return StatusCode(500, new { message = "An error occurred while retrieving users" });
        }
    }

    /// <summary>
    /// Get a specific business user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User details</returns>
    [HttpGet("{id}")]
    [RequireAdmin]
    [ProducesResponseType(typeof(UserManagementInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUser(Guid id)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var user = await _context.BusinessUsers
                .Where(u => u.Id == id && u.OrganizationId == organizationId)
                .Include(u => u.Organization)
                .Select(u => new UserManagementInfo
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    FullName = u.FullName,
                    Email = u.Email,
                    JobTitle = u.JobTitle,
                    PhoneNumber = u.PhoneNumber,
                    IsActive = u.IsActive,
                    LastLoginAt = u.LastLoginAt,
                    CreatedAt = u.CreatedAt,
                    OrganizationName = u.Organization.Name,
                    Roles = _context.UserRoles
                        .Where(ur => ur.UserId == u.IdentityUserId)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the user" });
        }
    }

    /// <summary>
    /// Invite a new user to the organization
    /// </summary>
    /// <param name="request">Invitation request</param>
    /// <returns>Invitation response</returns>
    [HttpPost("invite")]
    [RequireAdmin]
    [ProducesResponseType(typeof(InviteUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> InviteUser([FromBody] InviteUserRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var currentUserId = _currentUserService.GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            _logger.LogInformation("Inviting user {Email} with role {Role} to organization {OrgId}", 
                request.Email, request.Role, organizationId.Value);
            
            var result = await _invitationService.CreateInvitationAsync(request, currentUserId.Value, organizationId.Value);
            
            _logger.LogInformation("Invitation result: Success={Success}, Message={Message}", 
                result.Success, result.Message);
            
            // Return appropriate HTTP status code based on result
            if (!result.Success)
            {
                _logger.LogWarning("Invitation failed: {Message}", result.Message);
                // Check if it's a client error (validation, duplicate, etc.) or server error
                if (result.Message.Contains("already exists") || 
                    result.Message.Contains("Invalid inviter") || 
                    result.Message.Contains("Organization not found"))
                {
                    return BadRequest(result);
                }
                // Server error
                return StatusCode(500, result);
            }
            
            _logger.LogInformation("Invitation created successfully for {Email}", request.Email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inviting user {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred while inviting the user" });
        }
    }

    /// <summary>
    /// Accept an invitation
    /// </summary>
    /// <param name="request">Accept invitation request</param>
    /// <returns>Success response</returns>
    [HttpPost("accept-invitation")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _invitationService.AcceptInvitationAsync(request);
            if (success)
            {
                return Ok(new { message = "Invitation accepted successfully" });
            }

            return BadRequest(new { message = "Invalid or expired invitation" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting invitation");
            return StatusCode(500, new { message = "An error occurred while accepting the invitation" });
        }
    }

    /// <summary>
    /// Update user roles
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Update roles request</param>
    /// <returns>Success response</returns>
    [HttpPut("{id}/roles")]
    [RequireAdmin]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateUserRoles(Guid id, [FromBody] UpdateUserRolesRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var user = await _context.BusinessUsers
                .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId);

            if (user == null)
            {
                return NotFound();
            }

            var applicationUser = await _userManager.FindByIdAsync(user.IdentityUserId.ToString());
            if (applicationUser == null)
            {
                return NotFound();
            }

            // Remove all existing roles
            var existingRoles = await _userManager.GetRolesAsync(applicationUser);
            await _userManager.RemoveFromRolesAsync(applicationUser, existingRoles);

            // Add new roles
            var result = await _userManager.AddToRolesAsync(applicationUser, request.Roles);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to update user roles", errors = result.Errors });
            }

            _logger.LogInformation("User {UserId} roles updated to {Roles}", id, string.Join(", ", request.Roles));
            return Ok(new { message = "User roles updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user roles for {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while updating user roles" });
        }
    }

    /// <summary>
    /// Update user status (active/inactive)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Update status request</param>
    /// <returns>Success response</returns>
    [HttpPut("{id}/status")]
    [RequireAdmin]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var user = await _context.BusinessUsers
                .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId);

            if (user == null)
            {
                return NotFound();
            }

            var applicationUser = await _userManager.FindByIdAsync(user.IdentityUserId.ToString());
            if (applicationUser == null)
            {
                return NotFound();
            }

            // Update both domain user and application user
            user.IsActive = request.IsActive;
            applicationUser.IsActive = request.IsActive;

            _context.BusinessUsers.Update(user);
            await _userManager.UpdateAsync(applicationUser);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} status updated to {Status}", id, request.IsActive ? "Active" : "Inactive");
            return Ok(new { message = "User status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user status for {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while updating user status" });
        }
    }

    /// <summary>
    /// Update user information
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Update user request</param>
    /// <returns>Success response</returns>
    [HttpPut("{id:guid}")]
    [RequireAdmin]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var user = await _context.BusinessUsers
                .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId);

            if (user == null)
            {
                return NotFound();
            }

            var applicationUser = await _userManager.FindByIdAsync(user.IdentityUserId.ToString());
            if (applicationUser == null)
            {
                return NotFound();
            }

            // Update domain user
            if (!string.IsNullOrEmpty(request.FirstName))
            {
                user.FirstName = request.FirstName;
                applicationUser.FirstName = request.FirstName;
            }

            if (!string.IsNullOrEmpty(request.LastName))
            {
                user.LastName = request.LastName;
                applicationUser.LastName = request.LastName;
            }

            if (request.JobTitle != null)
            {
                user.JobTitle = request.JobTitle;
                applicationUser.JobTitle = request.JobTitle;
            }

            if (request.PhoneNumber != null)
            {
                user.PhoneNumber = request.PhoneNumber;
                applicationUser.PhoneNumber = request.PhoneNumber;
            }

            _context.BusinessUsers.Update(user);
            await _userManager.UpdateAsync(applicationUser);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} information updated", id);
            return Ok(new { message = "User information updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user information for {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while updating user information" });
        }
    }

    /// <summary>
    /// Get pending invitations for the organization
    /// </summary>
    /// <returns>List of pending invitations</returns>
    [HttpGet("invitations")]
    [RequireAdmin]
    [ProducesResponseType(typeof(List<UserInvitation>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPendingInvitations()
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return BadRequest(new { message = "Organization not found" });
            }

            var invitations = await _invitationService.GetPendingInvitationsAsync(organizationId.Value);
            return Ok(invitations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending invitations");
            return StatusCode(500, new { message = "An error occurred while retrieving invitations" });
        }
    }

    /// <summary>
    /// Cancel an invitation
    /// </summary>
    /// <param name="invitationId">Invitation ID</param>
    /// <returns>Success response</returns>
    [HttpDelete("invitations/{invitationId}")]
    [RequireAdmin]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelInvitation(Guid invitationId)
    {
        try
        {
            var currentUserId = _currentUserService.GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var success = await _invitationService.CancelInvitationAsync(invitationId, currentUserId.Value);
            if (success)
            {
                return Ok(new { message = "Invitation cancelled successfully" });
            }

            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling invitation {InvitationId}", invitationId);
            return StatusCode(500, new { message = "An error occurred while cancelling the invitation" });
        }
    }

    /// <summary>
    /// Resend an invitation
    /// </summary>
    /// <param name="invitationId">Invitation ID</param>
    /// <returns>Success response</returns>
    [HttpPost("invitations/{invitationId}/resend")]
    [RequireAdmin]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResendInvitation(Guid invitationId)
    {
        try
        {
            var currentUserId = _currentUserService.GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var success = await _invitationService.ResendInvitationAsync(invitationId, currentUserId.Value);
            if (success)
            {
                return Ok(new { message = "Invitation resent successfully" });
            }

            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending invitation {InvitationId}", invitationId);
            return StatusCode(500, new { message = "An error occurred while resending the invitation" });
        }
    }
}
