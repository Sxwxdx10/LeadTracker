using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.Models;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using LeadTracker.Core.DTOs;
using LeadTracker.Infrastructure;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Authentication service implementation
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtService _jwtService;
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger<AuthService> _logger;
    private readonly IUserInvitationService _invitationService;
    private readonly Func<string, Task<Organization?>>? _getOrganizationByDomain;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtService jwtService,
        LeadTrackerDbContext context,
        ILogger<AuthService> logger,
        IUserInvitationService invitationService,
        Func<string, Task<Organization?>>? getOrganizationByDomain = null)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
        _context = context;
        _logger = logger;
        _invitationService = invitationService;
        _getOrganizationByDomain = getOrganizationByDomain;
        
        _logger.LogInformation("AuthService initialized with mock: {HasMock}", _getOrganizationByDomain != null);
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Check if organization domain already exists
            // Use IgnoreQueryFilters() to bypass tenant filtering during registration
            var existingOrg = await _context.Organizations
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(o => o.Domain == request.OrganizationDomain);
            
            Organization organization;
            bool isFirstUser = false;
            
            if (existingOrg != null)
            {
                // Organization already exists - registration is only allowed via invitation
                _logger.LogWarning("Registration attempt for existing organization {OrgName} with domain {Domain} by {Email}. Invitation required.", 
                    existingOrg.Name, existingOrg.Domain, request.Email);
                throw new InvalidOperationException("Cette organisation existe déjà. Veuillez contacter un administrateur pour recevoir une invitation.");
            }
            else
            {
                // Create new organization only if domain doesn't exist
                organization = new Organization
                {
                    Id = Guid.NewGuid(), // Ensure ID is set
                    Name = request.OrganizationName,
                    Description = request.OrganizationDescription,
                    Domain = request.OrganizationDomain ?? GenerateDomainFromName(request.OrganizationName),
                    TimeZone = "UTC",
                    Currency = "USD",
                    IsActive = true
                };

                try
                {
                    _context.Organizations.Add(organization);
                    await _context.SaveChangesAsync();
                    
                    // Ensure the organization is properly tracked and has an ID
                    _context.Entry(organization).Reload();
                    
                    _logger.LogInformation("Created new organization {OrgName} with domain {Domain} and ID {OrgId} for user {Email}", 
                        organization.Name, organization.Domain, organization.Id, request.Email);
                    
                    // This is the first user of the organization
                    isFirstUser = true;
                }
                catch (Exception ex)
                {
                    // If creation fails due to domain conflict, fetch the existing organization
                    if (ex.Message.Contains("duplicate") || ex.Message.Contains("unique") || ex.Message.Contains("already exists"))
                    {
                        _logger.LogWarning("Organization domain {Domain} was created by another process, fetching existing organization", request.OrganizationDomain);
                        organization = await _context.Organizations
                            .IgnoreQueryFilters()
                            .FirstOrDefaultAsync(o => o.Domain == request.OrganizationDomain);
                        
                        if (organization == null)
                        {
                            throw new InvalidOperationException($"Failed to create or find organization with domain {request.OrganizationDomain}");
                        }
                        
                        // Organization was created by another process - invitation required
                        throw new InvalidOperationException("Cette organisation existe déjà. Veuillez contacter un administrateur pour recevoir une invitation.");
                    }
                    else
                    {
                        throw;
                    }
                }
            }

            // Create user
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                OrganizationId = organization.Id,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (result == null || !result.Succeeded)
            {
                var errors = result?.Errors?.Select(e => e.Description) ?? new[] { "Unknown error during user creation" };
                throw new InvalidOperationException($"User creation failed: {string.Join(", ", errors)}");
            }

            // Ensure the user is properly saved before adding roles
            await _context.SaveChangesAsync();

            // Assign role: Admin for first user, User for others
            // Note: isFirstUser is only true when we just created the organization
            var userRole = isFirstUser ? "Admin" : "User";
            
            // Ensure role exists before assigning it
            await EnsureRoleExistsAsync(userRole);
            
            // Assign role with error handling
            var roleResult = await _userManager.AddToRoleAsync(user, userRole);
            if (!roleResult.Succeeded)
            {
                // If role assignment failed, try to ensure role exists again and retry
                _logger.LogWarning("Failed to assign role {Role} to user {Email}: {Errors}. Retrying...", 
                    userRole, user.Email, string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                
                // Ensure role exists again (in case it was deleted or there's a timing issue)
                await EnsureRoleExistsAsync(userRole);
                
                // Retry role assignment
                roleResult = await _userManager.AddToRoleAsync(user, userRole);
                if (!roleResult.Succeeded)
                {
                    var errorMessage = $"Failed to assign role {userRole} to user: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}";
                    _logger.LogError(errorMessage);
                    throw new InvalidOperationException($"Role {userRole} does not exist.");
                }
            }
            
            if (isFirstUser)
            {
                _logger.LogInformation("First user {Email} assigned Admin role for organization {OrgName}", 
                    user.Email, organization.Name);
            }

            // Create domain User entity
            var domainUser = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                JobTitle = null,
                IsActive = true,
                OrganizationId = organization.Id,
                IdentityUserId = user.Id
            };

            _context.BusinessUsers.Add(domainUser);
            await _context.SaveChangesAsync();

            // Update ApplicationUser with domain user reference
            user.DomainUserId = domainUser.Id;
            await _userManager.UpdateAsync(user);

            // Generate tokens
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _jwtService.GenerateAccessToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {Email} registered successfully for organization {OrgName}", 
                user.Email, organization.Name);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // Should match JWT config
                User = new UserInfo
                {
                    Id = domainUser.Id, // Use DomainUser.Id for task assignments
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email!,
                    FullName = user.FullName,
                    JobTitle = user.JobTitle,
                    Roles = roles.ToList()
                },
                Organization = new OrganizationInfo
                {
                    Id = organization.Id,
                    Name = organization.Name,
                    Domain = organization.Domain,
                    TimeZone = organization.TimeZone,
                    Currency = organization.Currency
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for email {Email}", request.Email);
            throw;
        }
    }

    public async Task<AuthResponse> RegisterWithInvitationAsync(AcceptInvitationRequest request)
    {
        try
        {
            // Validate invitation token
            var invitation = await _invitationService.ValidateInvitationTokenAsync(request.InvitationToken);
            if (invitation == null)
            {
                throw new InvalidOperationException("Ce lien d'invitation est invalide ou a expiré.");
            }

            // Get organization
            var organization = await _context.Organizations
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(o => o.Id == invitation.OrganizationId);
            
            if (organization == null)
            {
                throw new InvalidOperationException("Organisation introuvable pour cette invitation.");
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
                var errors = result.Errors.Select(e => e.Description);
                throw new InvalidOperationException($"Échec de la création du compte: {string.Join(", ", errors)}");
            }

            // Ensure the user is properly saved before adding roles
            await _context.SaveChangesAsync();

            // Ensure role exists before assigning it
            await EnsureRoleExistsAsync(invitation.Role);
            
            // Add user to role specified in invitation
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

            // Generate tokens
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _jwtService.GenerateAccessToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {Email} registered successfully via invitation for organization {OrgName}", 
                user.Email, organization.Name);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // Should match JWT config
                User = new UserInfo
                {
                    Id = domainUser.Id, // Use DomainUser.Id for task assignments
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email!,
                    FullName = user.FullName,
                    JobTitle = user.JobTitle,
                    Roles = roles.ToList()
                },
                Organization = new OrganizationInfo
                {
                    Id = organization.Id,
                    Name = organization.Name,
                    Domain = organization.Domain,
                    TimeZone = organization.TimeZone,
                    Currency = organization.Currency
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration with invitation token {Token}", request.InvitationToken);
            throw;
        }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        try
        {
            // Find organization by domain
            Organization? organization;
            if (_getOrganizationByDomain != null)
            {
                organization = await _getOrganizationByDomain(request.OrganizationDomain);
            }
            else
            {
                // Fallback to synchronous query for unit tests
                // Use IgnoreQueryFilters() to bypass tenant filtering during login
                organization = await _context.Organizations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(o => o.Domain == request.OrganizationDomain && o.IsActive);
            }
            
            if (organization == null)
            {
                _logger.LogWarning("Organization not found for domain: {Domain}", request.OrganizationDomain);
                throw new UnauthorizedAccessException("Invalid organization domain");
            }

            // Find user by email and organization
            _logger.LogInformation("Looking for user with email: {Email} in organization: {OrgId} (domain: {Domain})", 
                request.Email, organization.Id, organization.Domain);
            
            // First try to find the ApplicationUser directly by email
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning("ApplicationUser not found with email: {Email}", request.Email);
                throw new UnauthorizedAccessException("Invalid credentials");
            }
            
            // Verify the user belongs to the correct organization
            if (user.OrganizationId != organization.Id)
            {
                _logger.LogWarning("User {Email} belongs to organization {UserOrgId} but trying to login to {RequestOrgId}", 
                    request.Email, user.OrganizationId, organization.Id);
                throw new UnauthorizedAccessException("Invalid credentials");
            }
            
            if (!user.IsActive)
            {
                _logger.LogWarning("User {Email} is not active", request.Email);
                throw new UnauthorizedAccessException("Invalid credentials");
            }
            
            _logger.LogInformation("Found ApplicationUser: {Email} in organization: {OrgId}", user.Email, organization.Id);

            // Validate password
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    _logger.LogWarning("Account locked out for user {Email}", user.Email);
                    throw new UnauthorizedAccessException("Account is locked out");
                }
                
                // Increment access failed count for security
                await _userManager.AccessFailedAsync(user);
                
                // Log security event for failed login attempt
                _logger.LogWarning("Failed login attempt for user {Email} from organization {OrganizationDomain}", 
                    user.Email, request.OrganizationDomain);
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            // Generate tokens
            IList<string> roles;
            try
            {
                roles = await _userManager.GetRolesAsync(user);
                if (roles == null || roles.Count == 0)
                {
                    _logger.LogWarning("User {Email} has no roles assigned, using empty list", user.Email);
                    roles = new List<string>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving roles for user {Email}, using empty list", user.Email);
                roles = new List<string>();
            }

            // Ensure DomainUserId is set (should be set during registration)
            if (!user.DomainUserId.HasValue)
            {
                _logger.LogWarning("User {Email} has no DomainUserId set, attempting to find or create DomainUser", user.Email);
                
                // Try to find existing DomainUser by email and organization
                var domainUser = await _context.BusinessUsers
                    .FirstOrDefaultAsync(u => u.Email == user.Email && u.OrganizationId == organization.Id);
                
                if (domainUser != null)
                {
                    // Link the DomainUser to the ApplicationUser
                    user.DomainUserId = domainUser.Id;
                    await _userManager.UpdateAsync(user);
                    _logger.LogInformation("Linked existing DomainUser {DomainUserId} to ApplicationUser {Email}", 
                        domainUser.Id, user.Email);
                }
                else
                {
                    _logger.LogError("User {Email} has no DomainUserId and no matching DomainUser found", user.Email);
                    throw new InvalidOperationException("User account is not properly configured. Please contact support.");
                }
            }

            var accessToken = _jwtService.GenerateAccessToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Reset access failed count on successful login
            await _userManager.ResetAccessFailedCountAsync(user);

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // Should match JWT config
                User = new UserInfo
                {
                    Id = user.DomainUserId.Value, // Use DomainUser.Id for task assignments
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email!,
                    FullName = user.FullName,
                    JobTitle = user.JobTitle,
                    Roles = roles.ToList()
                },
                Organization = new OrganizationInfo
                {
                    Id = organization.Id,
                    Name = organization.Name,
                    Domain = organization.Domain,
                    TimeZone = organization.TimeZone,
                    Currency = organization.Currency
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email {Email}", request.Email);
            throw;
        }
    }

    public async Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        try
        {
            if (!_jwtService.ValidateRefreshToken(request.RefreshToken))
            {
                throw new UnauthorizedAccessException("Invalid refresh token");
            }

            // In a real implementation, you would validate the refresh token against a stored token
            // For now, we'll generate a new access token (this is not secure for production)
            throw new NotImplementedException("Refresh token validation against database not implemented yet");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            throw;
        }
    }

    public async Task<bool> InitiatePasswordResetAsync(ResetPasswordRequest request)
    {
        try
        {
            // Find organization by domain
            Organization? organization;
            if (_getOrganizationByDomain != null)
            {
                organization = await _getOrganizationByDomain(request.OrganizationDomain);
            }
            else
            {
                // Fallback to synchronous query for unit tests
                organization = _context.Organizations
                    .FirstOrDefault(o => o.Domain == request.OrganizationDomain && o.IsActive);
            }
            
            if (organization == null)
            {
                return false; // Don't reveal if organization exists
            }

            // Find user by email and organization
            var domainUser = await _context.BusinessUsers
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.OrganizationId == organization.Id && u.IsActive);
            
            if (domainUser == null)
            {
                return false; // Don't reveal if user exists
            }

            // Get the ApplicationUser from Identity
            var user = await _userManager.FindByIdAsync(domainUser.IdentityUserId.ToString());
            if (user == null)
            {
                return false; // Don't reveal if user exists
            }

            // Generate reset token
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            
            // In a real implementation, you would send this token via email
            _logger.LogInformation("Password reset token for {Email}: {Token}", user.Email, token);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset initiation for email {Email}", request.Email);
            return false;
        }
    }

    public async Task<bool> ConfirmPasswordResetAsync(ConfirmResetPasswordRequest request)
    {
        try
        {
            // Find user by email
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
            {
                return false;
            }

            // Reset password
            var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
            return result.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset confirmation for email {Email}", request.Email);
            return false;
        }
    }

    public async Task<bool> LogoutAsync(string refreshToken)
    {
        try
        {
            // In a real implementation, you would invalidate the refresh token in the database
            _logger.LogInformation("User logged out");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return false;
        }
    }

    public async Task<ApplicationUser?> ValidateUserAsync(string email, string password, string organizationDomain)
    {
        try
        {
            // Find organization by domain
            Organization? organization;
            if (_getOrganizationByDomain != null)
            {
                organization = await _getOrganizationByDomain(organizationDomain);
            }
            else
            {
                // Fallback to synchronous query for unit tests
                organization = _context.Organizations
                    .FirstOrDefault(o => o.Domain == organizationDomain && o.IsActive);
            }
            
            if (organization == null)
            {
                return null;
            }

            // Find user by email and organization
            var domainUser = await _context.BusinessUsers
                .FirstOrDefaultAsync(u => u.Email == email && u.OrganizationId == organization.Id && u.IsActive);
            
            if (domainUser == null)
            {
                return null;
            }

            // Get the ApplicationUser from Identity
            var user = await _userManager.FindByIdAsync(domainUser.IdentityUserId.ToString());
            if (user == null)
            {
                return null;
            }

            // Validate password
            var result = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: false);
            return result.Succeeded ? user : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user validation for email {Email}", email);
            return null;
        }
    }

    private static string GenerateDomainFromName(string organizationName)
    {
        return organizationName
            .ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("_", "-")
            .Replace(".", "-")
            .Trim('-');
    }

    /// <summary>
    /// Ensures a role exists in the database, creating it if it doesn't exist
    /// </summary>
    private async Task EnsureRoleExistsAsync(string roleName)
    {
        var normalizedRoleName = roleName.ToUpper();
        
        // Check if role exists (ignore query filters to ensure we see all roles)
        var roleExists = await _context.Roles
            .IgnoreQueryFilters()
            .AnyAsync(r => r.NormalizedName == normalizedRoleName);
        
        if (!roleExists)
        {
            _logger.LogInformation("Role {Role} does not exist, creating it", roleName);
            
            try
            {
                var role = new Microsoft.AspNetCore.Identity.IdentityRole<Guid>
                {
                    Id = Guid.NewGuid(),
                    Name = roleName,
                    NormalizedName = normalizedRoleName,
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
                
                // Verify the role was created successfully (ignore query filters)
                roleExists = await _context.Roles
                    .IgnoreQueryFilters()
                    .AnyAsync(r => r.NormalizedName == normalizedRoleName);
                    
                if (roleExists)
                {
                    _logger.LogInformation("Role {Role} created and verified successfully", roleName);
                }
                else
                {
                    _logger.LogWarning("Role {Role} creation may have failed - role not found after save", roleName);
                    // Try one more time with a fresh query
                    await Task.Delay(100); // Small delay to ensure database consistency
                    roleExists = await _context.Roles
                        .IgnoreQueryFilters()
                        .AnyAsync(r => r.NormalizedName == normalizedRoleName);
                        
                    if (!roleExists)
                    {
                        throw new InvalidOperationException($"Role {roleName} was not created successfully");
                    }
                }
            }
            catch (Exception ex)
            {
                // If role creation fails (e.g., duplicate key), check if it exists now
                _logger.LogWarning(ex, "Error creating role {Role}, checking if it exists now", roleName);
                roleExists = await _context.Roles
                    .IgnoreQueryFilters()
                    .AnyAsync(r => r.NormalizedName == normalizedRoleName);
                
                if (!roleExists)
                {
                    _logger.LogError("Failed to create role {Role} and it still doesn't exist", roleName);
                    throw new InvalidOperationException($"Failed to create role {roleName}: {ex.Message}");
                }
                else
                {
                    _logger.LogInformation("Role {Role} exists after error (likely race condition)", roleName);
                }
            }
        }
        else
        {
            _logger.LogDebug("Role {Role} already exists", roleName);
        }
    }
}
