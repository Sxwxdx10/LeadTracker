using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// JWT service implementation
/// </summary>
public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IConfiguration configuration, ILogger<JwtService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var jwtSettings = _configuration.GetSection("JWT");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is required");
        var issuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer is required");
        var audience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience is required");
        var expiryMinutes = jwtSettings.GetValue<int>("ExpiryMinutes", 15);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName),
            new("user_id", user.Id.ToString()),
            new("org_id", user.OrganizationId.ToString()),
            new("first_name", user.FirstName),
            new("last_name", user.LastName),
            new("job_title", user.JobTitle ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public bool ValidateRefreshToken(string refreshToken)
    {
        try
        {
            // Basic validation - in production, you might want to store refresh tokens in database
            // and validate against stored tokens with expiration
            if (string.IsNullOrEmpty(refreshToken))
                return false;

            // Check if it's a valid base64 string
            Convert.FromBase64String(refreshToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid refresh token format");
            return false;
        }
    }

    public Guid? GetUserIdFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);
            var userIdClaim = jsonToken.Claims.FirstOrDefault(x => x.Type == "user_id");
            return userIdClaim != null ? Guid.Parse(userIdClaim.Value) : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract user ID from token");
            return null;
        }
    }

    public Guid? GetOrganizationIdFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);
            var orgIdClaim = jsonToken.Claims.FirstOrDefault(x => x.Type == "org_id");
            return orgIdClaim != null ? Guid.Parse(orgIdClaim.Value) : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract organization ID from token");
            return null;
        }
    }

    public IList<string> GetUserRolesFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);
            return jsonToken.Claims
                .Where(x => x.Type == ClaimTypes.Role)
                .Select(x => x.Value)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract user roles from token");
            return new List<string>();
        }
    }
}
