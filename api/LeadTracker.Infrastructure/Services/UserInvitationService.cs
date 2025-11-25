using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
        _logger.LogInformation("CreateInvitationAsync called for email: {Email}, role: {Role}, invitedBy: {InvitedBy}, orgId: {OrgId}", 
            request.Email, request.Role, invitedByUserId, organizationId);
        
        try
        {
            _logger.LogInformation("Step 1: Checking if user already exists for {Email}", request.Email);
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
            // Note: IsExpired is a computed property, so we need to check ExpiresAt directly
            var now = DateTime.UtcNow;
            var existingInvitation = await _context.UserInvitations
                .FirstOrDefaultAsync(i => i.Email == request.Email && 
                                        i.OrganizationId == organizationId && 
                                        !i.IsAccepted && 
                                        i.ExpiresAt > now);

            if (existingInvitation != null)
            {
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "A pending invitation already exists for this email address"
                };
            }

            _logger.LogInformation("Step 4: Resolving inviter user. DomainUserId={DomainUserId}", invitedByUserId);

            // Resolve inviter's domain user (BusinessUser) to get the Identity (ApplicationUser) ID
            var inviterDomainUser = await _context.BusinessUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == invitedByUserId && u.OrganizationId == organizationId);

            if (inviterDomainUser == null)
            {
                _logger.LogWarning("Inviter domain user not found. DomainUserId={DomainUserId}", invitedByUserId);
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "Invalid inviter user"
                };
            }

            if (!inviterDomainUser.IdentityUserId.HasValue)
            {
                _logger.LogWarning("Inviter domain user does not have an associated IdentityUserId. DomainUserId={DomainUserId}", invitedByUserId);
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "Invalid inviter user"
                };
            }

            var inviterIdentityUserId = inviterDomainUser.IdentityUserId.Value;
            var inviterUser = await _userManager.FindByIdAsync(inviterIdentityUserId.ToString());
            if (inviterUser == null)
            {
                _logger.LogWarning("Inviter identity user not found. IdentityUserId={IdentityUserId}", inviterIdentityUserId);
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

            _logger.LogInformation("Step 5: Normalizing role name from {OriginalRole}", request.Role);
            // Normalize role name (map common variations to standard roles)
            var normalizedRole = NormalizeRoleName(request.Role);
            _logger.LogInformation("Normalized role: {NormalizedRole}", normalizedRole);
            
            _logger.LogInformation("Step 6: Verifying role exists");
            // Verify role exists or create it
            var roleExists = await _context.Roles.AnyAsync(r => r.NormalizedName == normalizedRole.ToUpper());
            if (!roleExists)
            {
                _logger.LogInformation("Role {Role} does not exist, creating it", normalizedRole);
                var role = new Microsoft.AspNetCore.Identity.IdentityRole<Guid>
                {
                    Id = Guid.NewGuid(),
                    Name = normalizedRole,
                    NormalizedName = normalizedRole.ToUpper(),
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Role {Role} created successfully", normalizedRole);
            }
            else
            {
                _logger.LogInformation("Role {Role} already exists", normalizedRole);
            }

            _logger.LogInformation("Step 7: Creating invitation entity");
            // Create invitation
            var invitation = new UserInvitation
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                JobTitle = request.JobTitle,
                Role = normalizedRole,
                InvitationToken = invitationToken,
                OrganizationId = organizationId,
                InvitedByUserId = inviterIdentityUserId,
                ExpiresAt = DateTime.UtcNow.AddDays(7), // 7 days expiry
                Message = request.Message
            };

            _logger.LogInformation("Step 8: Adding invitation to context");
            _context.UserInvitations.Add(invitation);
            
            _logger.LogInformation("Step 9: Saving changes to database");
            await _context.SaveChangesAsync();
            _logger.LogInformation("Invitation saved successfully with ID: {InvitationId}", invitation.Id);

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
                InvitationId = invitation.Id,
                InvitationUrl = invitationUrl
            };
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error creating user invitation for {Email}", request.Email);
            _logger.LogError(dbEx, "Inner exception: {InnerException}", dbEx.InnerException?.Message);
            
            // Check for specific database errors
            var innerMessage = dbEx.InnerException?.Message ?? "";
            if (innerMessage.Contains("duplicate key") || innerMessage.Contains("unique constraint"))
            {
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "A pending invitation already exists for this email address"
                };
            }
            
            if (innerMessage.Contains("foreign key") || innerMessage.Contains("violates foreign key constraint"))
            {
                return new InviteUserResponse
                {
                    Success = false,
                    Message = "Invalid organization or user reference"
                };
            }
            
            return new InviteUserResponse
            {
                Success = false,
                Message = $"Database error: {innerMessage}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user invitation for {Email}: {ExceptionMessage}", request.Email, ex.Message);
            _logger.LogError(ex, "Stack trace: {StackTrace}", ex.StackTrace);
            _logger.LogError(ex, "Inner exception: {InnerException}", ex.InnerException?.Message);
            
            // Return more detailed error message for debugging
            var errorMessage = $"An error occurred while creating the invitation";
            if (ex.InnerException != null)
            {
                errorMessage += $": {ex.InnerException.Message}";
            }
            else
            {
                errorMessage += $": {ex.Message}";
            }
            
            return new InviteUserResponse
            {
                Success = false,
                Message = errorMessage
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
            // Note: IsExpired is a computed property, check ExpiresAt directly
            if (invitation.ExpiresAt <= DateTime.UtcNow || invitation.IsAccepted)
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

            // Add user to role - ensure role exists first
            var roleExists = await _context.Roles.AnyAsync(r => r.NormalizedName == invitation.Role.ToUpper());
            if (!roleExists)
            {
                _logger.LogWarning("Role {Role} does not exist, creating it", invitation.Role);
                var role = new Microsoft.AspNetCore.Identity.IdentityRole<Guid>
                {
                    Id = Guid.NewGuid(),
                    Name = invitation.Role,
                    NormalizedName = invitation.Role.ToUpper(),
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }
            
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
            // Note: IsExpired is a computed property, check ExpiresAt directly
            var now = DateTime.UtcNow;
            return await _context.UserInvitations
                .Include(i => i.InvitedByUser)
                .Where(i => i.OrganizationId == organizationId && !i.IsAccepted && i.ExpiresAt > now)
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

            // Note: IsExpired is a computed property, check ExpiresAt directly
            if (invitation == null || invitation.IsAccepted || invitation.ExpiresAt <= DateTime.UtcNow)
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
        return $"{baseUrl}/register?token={token}";
    }

    /// <summary>
    /// Normalize role name from frontend format to backend format
    /// Maps common role variations to standard role names
    /// </summary>
    private string NormalizeRoleName(string role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return "User";
        }

        // Normalize to lowercase for comparison
        var normalized = role.Trim().ToLowerInvariant();

        // Map frontend role names to backend role names
        return normalized switch
        {
            "admin" or "administrateur" or "administrator" => "Admin",
            "manager" => "Manager",
            "sales_rep" or "salesrep" or "commercial" => "SalesRep",
            "viewer" or "user" or "lecture seule" => "User",
            _ => role.Trim() // Keep original if no mapping found
        };
    }
}
