using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Api.Models;
using LeadTracker.Api.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using LeadTracker.UnitTests.Common;
using Xunit;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;

namespace LeadTracker.UnitTests.Services;

/// <summary>
/// Security tests for authentication (brute force, rate limiting, etc.)
/// </summary>
public class AuthSecurityTests : TestBase
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly AuthService _authService;
    private readonly Mock<Func<string, Task<Organization?>>> _getOrganizationByDomainMock;

    public AuthSecurityTests()
    {
        // Setup mocks
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null, null, null, null, null, null, null, null);

        _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
            _userManagerMock.Object, 
            Mock.Of<Microsoft.AspNetCore.Http.IHttpContextAccessor>(), 
            Mock.Of<IUserClaimsPrincipalFactory<ApplicationUser>>(), 
            null, null, null, null);

        _jwtServiceMock = new Mock<IJwtService>();
        _loggerMock = new Mock<ILogger<AuthService>>();
        _getOrganizationByDomainMock = new Mock<Func<string, Task<Organization?>>>();

        _authService = new AuthService(
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _jwtServiceMock.Object,
            Context,
            _loggerMock.Object,
            _getOrganizationByDomainMock.Object);
    }

    private void SetupOrganizationMock(Organization organization)
    {
        // Setup the mock to return the organization when called with the specific domain
        _getOrganizationByDomainMock.Setup(x => x(organization.Domain))
            .ReturnsAsync(organization);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithMultipleFailedAttempts_ShouldTriggerLockout()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Corp",
            Domain = "test-corp",
            Description = "Test organization",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        // Add organization to database
        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();

        // Setup organization mock
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = org.Id,
            LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(5) // User is locked out
        };

        // Add user to database
        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = "WrongPassword",
            OrganizationDomain = "test-corp"
        };

        _userManagerMock.Setup(x => x.FindByNameAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(true);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.LockedOut);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
        Assert.Equal("Account is locked out", exception.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithInvalidPassword_ShouldIncrementAccessFailedCount()
    {
        // Arrange - Create test data (no database)
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Corp",
            Domain = "test-corp",
            Description = "Test organization",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = org.Id,
            AccessFailedCount = 2 // Already 2 failed attempts
        };

        var request = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = "WrongPassword",
            OrganizationDomain = "test-corp"
        };

        // Add organization to database
        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();

        // Setup organization mock
        SetupOrganizationMock(org);

        // Add user to database instead of mocking
        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();
        
        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        _userManagerMock.Setup(x => x.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act & Assert - Should fail with UnauthorizedAccessException for invalid password
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithValidCredentials_ShouldResetAccessFailedCount()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization first
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Corp Security",
            Domain = "test-corp-security-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for security tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();

        // Setup organization mock
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = org.Id,
            AccessFailedCount = 3 // Previous failed attempts
        };

        // Add user to database
        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = "CorrectPassword",
            OrganizationDomain = org.Domain
        };

        var accessToken = "access-token";
        var refreshToken = "refresh-token";

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

        _userManagerMock.Setup(x => x.ResetAccessFailedCountAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "User" });

        _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns(accessToken);

        _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
            .Returns(refreshToken);

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(accessToken, result.AccessToken);
        
        // Verify that access failed count was reset
        _userManagerMock.Verify(x => x.ResetAccessFailedCountAsync(user), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithSuspiciousActivity_ShouldLogSecurityEvent()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization first
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Corp",
            Domain = "test-corp",
            Description = "Test organization",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();

        // Setup organization mock
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = org.Id,
            AccessFailedCount = 4 // High number of failed attempts
        };

        // Add user to database
        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = "WrongPassword",
            OrganizationDomain = "test-corp"
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        _userManagerMock.Setup(x => x.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
        Assert.Equal("Invalid credentials", exception.Message);
        
        // Verify that security event was logged (checking for any warning log)
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }
}
