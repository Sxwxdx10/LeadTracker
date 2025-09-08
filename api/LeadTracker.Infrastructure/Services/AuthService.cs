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
            var existingOrg = await _context.Organizations
                .FirstOrDefaultAsync(o => o.Domain == request.OrganizationDomain);
            
            if (existingOrg != null)
            {
                throw new InvalidOperationException("Organization with this domain already exists");
            }

            // Create organization
            var organization = new Organization
            {
                Name = request.OrganizationName,
                Description = request.OrganizationDescription,
                Domain = request.OrganizationDomain ?? GenerateDomainFromName(request.OrganizationName),
                TimeZone = "UTC",
                Currency = "USD",
                IsActive = true
            };

            _context.Organizations.Add(organization);
            await _context.SaveChangesAsync();

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
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"User creation failed: {errors}");
            }

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
                    Id = user.Id,
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
                organization = _context.Organizations
                    .FirstOrDefault(o => o.Domain == request.OrganizationDomain && o.IsActive);
            }
            
            if (organization == null)
            {
                throw new UnauthorizedAccessException("Invalid organization domain");
            }

            // Find user by email and organization
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.OrganizationId == organization.Id && u.IsActive);
            
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }

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

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // Should match JWT config
                User = new UserInfo
                {
                    Id = user.Id,
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
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.OrganizationId == organization.Id && u.IsActive);
            
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
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.OrganizationId == organization.Id && u.IsActive);
            
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
