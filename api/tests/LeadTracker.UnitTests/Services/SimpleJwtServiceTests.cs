using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Api.Services;
using LeadTracker.Core.Entities;
using Xunit;
using System.Collections.Generic;
using System.Security.Claims;

namespace LeadTracker.UnitTests.Services;

/// <summary>
/// Simple JWT service tests
/// </summary>
public class SimpleJwtServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtService> _logger;
    private readonly JwtService _jwtService;

    public SimpleJwtServiceTests()
    {
        // Create real configuration instead of mocking
        var configurationData = new Dictionary<string, string>
        {
            {"JWT:SecretKey", "ThisIsAVeryLongSecretKeyForJWTTokenGenerationThatIsAtLeast32CharactersLong"},
            {"JWT:Issuer", "LeadTracker"},
            {"JWT:Audience", "LeadTrackerUsers"},
            {"JWT:ExpiryMinutes", "15"},
            {"JWT:RefreshTokenExpiryDays", "7"}
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();

        _logger = Mock.Of<ILogger<JwtService>>();

        _jwtService = new JwtService(_configuration, _logger);
    }

    [Fact]
    public void GenerateAccessToken_WithValidUser_ShouldReturnToken()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = Guid.NewGuid()
        };

        var roles = new List<string> { "User" };

        // Act
        var token = _jwtService.GenerateAccessToken(user, roles);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnToken()
    {
        // Act
        var token = _jwtService.GenerateRefreshToken();

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GetUserIdFromToken_WithValidToken_ShouldReturnUserId()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = Guid.NewGuid()
        };

        var roles = new List<string> { "User" };
        var token = _jwtService.GenerateAccessToken(user, roles);

        // Act
        var userId = _jwtService.GetUserIdFromToken(token);

        // Assert
        Assert.NotNull(userId);
        Assert.Equal(user.Id, userId);
    }

    [Fact]
    public void GetUserIdFromToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var userId = _jwtService.GetUserIdFromToken(invalidToken);

        // Assert
        Assert.Null(userId);
    }

    [Fact]
    public void GetUserRolesFromToken_WithMultipleRoles_ShouldReturnAllRoles()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = Guid.NewGuid()
        };

        var roles = new List<string> { "User", "Admin", "Manager" };
        var token = _jwtService.GenerateAccessToken(user, roles);

        // Act
        var tokenRoles = _jwtService.GetUserRolesFromToken(token);

        // Assert
        Assert.NotNull(tokenRoles);
        Assert.Equal(3, tokenRoles.Count);
        Assert.Contains("User", tokenRoles);
        Assert.Contains("Admin", tokenRoles);
        Assert.Contains("Manager", tokenRoles);
    }
}
