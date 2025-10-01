using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// User invitation service implementation
/// </summary>
public class UserInvitationService : IUserInvitationService
{
    private readonly LeadTrackerDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly ILogger<UserInvitationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly ITenantContext _tenantContext;

    public UserInvitationService(
        LeadTrackerDbContext context,
        UserManager<ApplicationUser> userManager,
        IEmailService emailService,
        ILogger<UserInvitationService> logger,
        IConfiguration configuration,
        ITenantContext tenantContext)
    {
        _context = context;
        _userManager = userManager;
        _emailService = emailService;
        _logger = logger;
        _configuration = configuration;
        _tenantContext = tenantContext;
    }

    public async Task<InviteUserResponse> CreateInvitationAsync(InviteUserRequest request, Guid invitedByUserId, Guid organizationId)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "A user with this email address already exists"
                };
            }

            // Check if there's already a pending invitation for this email
            var existingInvitation = await _context.UserInvitations
                .FirstOrDefaultAsync(i => i.Email == request.Email && 
                                        i.OrganizationId == organizationId && 
                                        !i.IsAccepted && 
                                        !i.IsExpired);

            if (existingInvitation != null)
            {
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "A pending invitation already exists for this email address"
                };
            }

            // Get the inviter user
            var inviterUser = await _userManager.FindByIdAsync(invitedByUserId.ToString());
            if (inviterUser == null)
            {
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "Invalid inviter user"
                };
            }

            // Get organization
            var organization = await _context.Organizations.FindAsync(organizationId);
            if (organization == null)
            {
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "Organization not found"
                };
            }

            // Generate invitation token
            var invitationToken = GenerateInvitationToken();

            // Create invitation
            var invitation = new UserInvitation
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                JobTitle = request.JobTitle,
                Role = request.Role,
                InvitationToken = invitationToken,
                OrganizationId = organizationId,
                InvitedByUserId = invitedByUserId,
                ExpiresAt = DateTime.UtcNow.AddDays(7), // 7 days expiry
                Message = request.Message
            };

            _context.UserInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            // Send invitation email
            var invitationUrl = GenerateInvitationUrl(invitationToken);
            var emailInvitation = new UserInvitationEmail
            {
                ToEmail = request.Email,
                ToName = $"{request.FirstName} {request.LastName}".Trim(),
                InviterName = inviterUser.FullName,
                OrganizationName = organization.Name,
                InvitationToken = invitationToken,
                InvitationUrl = invitationUrl,
                Role = request.Role
            };

            var emailSent = await _emailService.SendUserInvitationAsync(emailInvitation);
            if (!emailSent)
            {
                _logger.LogWarning("Failed to send invitation email to {Email}, but invitation was created", request.Email);
            }

            _logger.LogInformation("User invitation created for {Email} by {InviterEmail}", request.Email, inviterUser.Email);

            return new InviteUserResponse
            {
                Success = true,
                Message = "Invitation sent successfully",
                InvitationId = invitation.Id
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user invitation for {Email}", request.Email);
            return new InviteUserResponse
            {
                Success = false,
                Message = "An error occurred while creating the invitation"
            };
        }
    }

    public async Task<UserInvitation?> ValidateInvitationTokenAsync(string token)
    {
        try
        {
            var invitation = await _context.UserInvitations
                .Include(i => i.Organization)
                .Include(i => i.InvitedByUser)
                .FirstOrDefaultAsync(i => i.InvitationToken == token);

            if (invitation == null)
            {
                return null;
            }

            // Check if invitation is expired or already accepted
            if (invitation.IsExpired || invitation.IsAccepted)
            {
                return null;
            }

            return invitation;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating invitation token");
            return null;
        }
    }

    public async Task<bool> AcceptInvitationAsync(AcceptInvitationRequest request)
    {
        try
        {
            var invitation = await ValidateInvitationTokenAsync(request.InvitationToken);
            if (invitation == null)
            {
                return false;
            }

            // Create ApplicationUser
            var user = new ApplicationUser
            {
                UserName = invitation.Email,
                Email = invitation.Email,
                FirstName = invitation.FirstName,
                LastName = invitation.LastName,
                JobTitle = invitation.JobTitle,
                OrganizationId = invitation.OrganizationId,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                _logger.LogError("Failed to create user account for invitation {InvitationId}: {Errors}", 
                    invitation.Id, string.Join(", ", result.Errors.Select(e => e.Description)));
                return false;
            }

            // Add user to role
            await _userManager.AddToRoleAsync(user, invitation.Role);

            // Create domain User entity
            var domainUser = new User
            {
                FirstName = invitation.FirstName,
                LastName = invitation.LastName,
                Email = invitation.Email,
                JobTitle = invitation.JobTitle,
                IsActive = true,
                OrganizationId = invitation.OrganizationId,
                IdentityUserId = user.Id
            };

            _context.BusinessUsers.Add(domainUser);
            await _context.SaveChangesAsync();

            // Update ApplicationUser with domain user reference
            user.DomainUserId = domainUser.Id;
            await _userManager.UpdateAsync(user);

            // Mark invitation as accepted
            invitation.IsAccepted = true;
            invitation.AcceptedAt = DateTime.UtcNow;
            invitation.AcceptedUserId = user.Id;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User invitation accepted for {Email}", invitation.Email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting invitation with token {Token}", request.InvitationToken);
            return false;
        }
    }

    public async Task<List<UserInvitation>> GetPendingInvitationsAsync(Guid organizationId)
    {
        try
        {
            return await _context.UserInvitations
                .Include(i => i.InvitedByUser)
                .Where(i => i.OrganizationId == organizationId && !i.IsAccepted && !i.IsExpired)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending invitations for organization {OrganizationId}", organizationId);
            return new List<UserInvitation>();
        }
    }

    public async Task<bool> CancelInvitationAsync(Guid invitationId, Guid cancelledByUserId)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return false;
            }

            var invitation = await _context.UserInvitations
                .FirstOrDefaultAsync(i => i.Id == invitationId && i.OrganizationId == organizationId);

            if (invitation == null || invitation.IsAccepted)
            {
                return false;
            }

            _context.UserInvitations.Remove(invitation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User invitation {InvitationId} cancelled by user {UserId}", invitationId, cancelledByUserId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling invitation {InvitationId}", invitationId);
            return false;
        }
    }

    public async Task<bool> ResendInvitationAsync(Guid invitationId, Guid resendByUserId)
    {
        try
        {
            var organizationId = _tenantContext.OrganizationId;
            if (organizationId == null)
            {
                return false;
            }

            var invitation = await _context.UserInvitations
                .Include(i => i.Organization)
                .Include(i => i.InvitedByUser)
                .FirstOrDefaultAsync(i => i.Id == invitationId && i.OrganizationId == organizationId);

            if (invitation == null || invitation.IsAccepted || invitation.IsExpired)
            {
                return false;
            }

            // Generate new token and extend expiry
            invitation.InvitationToken = GenerateInvitationToken();
            invitation.ExpiresAt = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            // Send invitation email
            var invitationUrl = GenerateInvitationUrl(invitation.InvitationToken);
            var emailInvitation = new UserInvitationEmail
            {
                ToEmail = invitation.Email,
                ToName = invitation.FullName,
                InviterName = invitation.InvitedByUser.FullName,
                OrganizationName = invitation.Organization.Name,
                InvitationToken = invitation.InvitationToken,
                InvitationUrl = invitationUrl,
                Role = invitation.Role
            };

            var emailSent = await _emailService.SendUserInvitationAsync(emailInvitation);
            if (!emailSent)
            {
                _logger.LogWarning("Failed to resend invitation email to {Email}", invitation.Email);
                return false;
            }

            _logger.LogInformation("User invitation {InvitationId} resent by user {UserId}", invitationId, resendByUserId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending invitation {InvitationId}", invitationId);
            return false;
        }
    }

    private string GenerateInvitationToken()
    {
        return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
    }

    private string GenerateInvitationUrl(string token)
    {
        var baseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
        return $"{baseUrl}/accept-invitation?token={token}";
    }
}
