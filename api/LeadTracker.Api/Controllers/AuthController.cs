using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.Models;
using LeadTracker.Core.Services;
using LeadTracker.Core.DTOs;
using FluentValidation;
using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Authentication controller for user registration, login, and password management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserInvitationService _invitationService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService, 
        IUserInvitationService invitationService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _invitationService = invitationService;
        _logger = logger;
    }

    /// <summary>
    /// Test endpoint for seeding
    /// </summary>
    /// <returns>Test message</returns>
    [HttpGet("test-seeding")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult TestSeeding()
    {
        return Ok(new { message = "Seeding test endpoint is working from AuthController!" });
    }

    /// <summary>
    /// Test POST endpoint without validation
    /// </summary>
    [HttpPost("test-post")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult TestPost([FromBody] object data)
    {
        _logger.LogInformation("TestPost endpoint reached with data: {Data}", data?.ToString() ?? "null");
        return Ok(new { message = "POST test successful", receivedData = data });
    }

    /// <summary>
    /// Test POST with RegisterRequest but no auth service call
    /// </summary>
    [HttpPost("test-register-model")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult TestRegisterModel([FromBody] RegisterRequest request)
    {
        _logger.LogInformation("TestRegisterModel endpoint reached for email: {Email}", request?.Email ?? "null");
        return Ok(new { 
            message = "Model binding successful", 
            firstName = request?.FirstName,
            email = request?.Email 
        });
    }

    /// <summary>
    /// Register a new user and organization
    /// </summary>
    /// <param name="request">Registration request</param>
    /// <returns>Authentication response with tokens</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // LOG EVERYTHING for debugging
        _logger.LogInformation("===== Register endpoint REACHED =====");
        _logger.LogInformation("Request object is null: {IsNull}", request == null);
        
        if (request != null)
        {
            _logger.LogInformation("Email: {Email}", request.Email);
            _logger.LogInformation("FirstName: {FirstName}", request.FirstName);
            _logger.LogInformation("OrganizationDomain: {Domain}", request.OrganizationDomain);
        }
        
        _logger.LogInformation("ModelState.IsValid: {IsValid}", ModelState.IsValid);
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("ModelState errors: {Errors}", 
                string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            return BadRequest(ModelState);
        }
        
        try
        {
            _logger.LogInformation("===== Register endpoint called for email {Email} =====", request?.Email ?? "null");

            _logger.LogInformation("Calling AuthService.RegisterAsync for {Email}", request?.Email);
            var response = await _authService.RegisterAsync(request!);
            _logger.LogInformation("Registration successful for {Email}", request?.Email);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration failed for email {Email}: {Message}", request?.Email, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during registration for email {Email}: {Message}. StackTrace: {StackTrace}", 
                request?.Email, ex.Message, ex.StackTrace);
            return StatusCode(500, new { message = "An unexpected error occurred during registration", details = ex.Message });
        }
    }

    /// <summary>
    /// Register a new user via invitation token
    /// </summary>
    /// <param name="request">Registration with invitation request</param>
    /// <returns>Authentication response with tokens</returns>
    [HttpPost("register-with-invitation")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RegisterWithInvitation([FromBody] LeadTracker.Core.DTOs.AcceptInvitationRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Register with invitation endpoint called for token {Token}", request?.InvitationToken);
            var response = await _authService.RegisterWithInvitationAsync(request!);
            _logger.LogInformation("Registration with invitation successful");
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration with invitation failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during registration with invitation: {Message}", ex.Message);
            return StatusCode(500, new { message = "An unexpected error occurred during registration", details = ex.Message });
        }
    }

    /// <summary>
    /// Login user and return authentication tokens
    /// </summary>
    /// <param name="request">Login request</param>
    /// <returns>Authentication response with tokens</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Login failed for email {Email}", request.Email);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during login for email {Email}: {Message}", request.Email, ex.Message);
            
            // Include exception details in development mode for debugging
            #if DEBUG
            return StatusCode(500, new { 
                message = "An unexpected error occurred during login",
                details = ex.Message,
                stackTrace = ex.StackTrace
            });
            #else
            return StatusCode(500, new { message = "An unexpected error occurred during login" });
            #endif
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    /// <param name="request">Refresh token request</param>
    /// <returns>New authentication tokens</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(RefreshTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.RefreshTokenAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Token refresh failed");
            return Unauthorized(new { message = ex.Message });
        }
        catch (NotImplementedException ex)
        {
            _logger.LogWarning(ex, "Token refresh not implemented");
            return StatusCode(501, new { message = "Token refresh not implemented yet" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token refresh");
            return StatusCode(500, new { message = "An unexpected error occurred during token refresh" });
        }
    }

    /// <summary>
    /// Initiate password reset process
    /// </summary>
    /// <param name="request">Password reset request</param>
    /// <returns>Success status</returns>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _authService.InitiatePasswordResetAsync(request);
            return Ok(new { success, message = "If the email exists, a password reset link has been sent" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during password reset for email {Email}", request.Email);
            return StatusCode(500, new { message = "An unexpected error occurred during password reset" });
        }
    }

    /// <summary>
    /// Confirm password reset with token
    /// </summary>
    /// <param name="request">Password reset confirmation request</param>
    /// <returns>Success status</returns>
    [HttpPost("confirm-reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ConfirmResetPassword([FromBody] ConfirmResetPasswordRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _authService.ConfirmPasswordResetAsync(request);
            return Ok(new { success, message = success ? "Password reset successfully" : "Invalid or expired token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during password reset confirmation for email {Email}", request.Email);
            return StatusCode(500, new { message = "An unexpected error occurred during password reset confirmation" });
        }
    }

    /// <summary>
    /// Logout user and invalidate refresh token
    /// </summary>
    /// <param name="request">Logout request with refresh token</param>
    /// <returns>Success status</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var success = await _authService.LogoutAsync(request.RefreshToken);
            return Ok(new { success, message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during logout");
            return StatusCode(500, new { message = "An unexpected error occurred during logout" });
        }
    }

    /// <summary>
    /// Validate an invitation token
    /// </summary>
    /// <param name="token">Invitation token</param>
    /// <returns>Invitation validation response</returns>
    [HttpGet("validate-invitation")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateInvitation([FromQuery] string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { valid = false, message = "Token is required" });
            }

            var invitation = await _invitationService.ValidateInvitationTokenAsync(token);
            if (invitation == null)
            {
                return Ok(new { 
                    valid = false, 
                    message = "Ce lien d'invitation est invalide ou a expiré." 
                });
            }

            return Ok(new
            {
                valid = true,
                invitation = new
                {
                    email = invitation.Email,
                    firstName = invitation.FirstName,
                    lastName = invitation.LastName,
                    jobTitle = invitation.JobTitle,
                    role = invitation.Role,
                    organization = new
                    {
                        id = invitation.OrganizationId.ToString(),
                        name = invitation.Organization.Name,
                        domain = invitation.Organization.Domain
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating invitation token");
            return StatusCode(500, new { valid = false, message = "An error occurred while validating the invitation" });
        }
    }

    /// <summary>
    /// Get current user information
    /// </summary>
    /// <returns>Current user information</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst("user_id")?.Value;
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var firstName = User.FindFirst("first_name")?.Value;
            var lastName = User.FindFirst("last_name")?.Value;
            var jobTitle = User.FindFirst("job_title")?.Value;
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            if (userId == null || !Guid.TryParse(userId, out var userIdGuid))
            {
                return Unauthorized(new { message = "Invalid user information" });
            }

            var userInfo = new UserInfo
            {
                Id = userIdGuid,
                FirstName = firstName ?? string.Empty,
                LastName = lastName ?? string.Empty,
                Email = userEmail ?? string.Empty,
                FullName = $"{firstName} {lastName}".Trim(),
                JobTitle = jobTitle,
                Roles = roles
            };

            return Ok(userInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting current user information");
            return StatusCode(500, new { message = "An unexpected error occurred" });
        }
    }
}
