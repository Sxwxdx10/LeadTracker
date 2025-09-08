using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.Models;
using LeadTracker.Core.Services;
using FluentValidation;
using System.Security.Claims;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Authentication controller for user registration, login, and password management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
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
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration failed for email {Email}", request.Email);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during registration for email {Email}", request.Email);
            return StatusCode(500, new { message = "An unexpected error occurred during registration" });
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
            _logger.LogError(ex, "Unexpected error during login for email {Email}", request.Email);
            return StatusCode(500, new { message = "An unexpected error occurred during login" });
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
