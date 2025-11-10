using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.Models;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
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
    private readonly Func<string, Task<Organization?>>? _getOrganizationByDomain;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtService jwtService,
        LeadTrackerDbContext context,
        ILogger<AuthService> logger,
        Func<string, Task<Organization?>>? getOrganizationByDomain = null)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
        _context = context;
        _logger = logger;
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
            
            if (existingOrg != null)
            {
                // Use existing organization if domain already exists
                organization = existingOrg;
                _logger.LogInformation("User {Email} joining existing organization {OrgName} with domain {Domain}", 
                    request.Email, organization.Name, organization.Domain);
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

            // Add user to default role
            await _userManager.AddToRoleAsync(user, "User");

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
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _jwtService.GenerateAccessToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Reset access failed count on successful login
            await _userManager.ResetAccessFailedCountAsync(user);

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            // Ensure DomainUserId is set (should be set during registration)
            if (!user.DomainUserId.HasValue)
            {
                _logger.LogError("User {Email} has no DomainUserId set", user.Email);
                throw new InvalidOperationException("User account is not properly configured");
            }

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
}
