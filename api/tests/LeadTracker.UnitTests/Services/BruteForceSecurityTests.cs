using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Core.Models;
using LeadTracker.Core.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using LeadTracker.Infrastructure.Services;
using LeadTracker.UnitTests.Common;
using Xunit;
using FluentAssertions;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;

namespace LeadTracker.UnitTests.Services;

/// <summary>
/// Comprehensive brute force security tests for authentication
/// </summary>
public class BruteForceSecurityTests : TestBase
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly Mock<IUserInvitationService> _invitationServiceMock;
    private readonly AuthService _authService;
    private readonly Mock<Func<string, System.Threading.Tasks.Task<Organization?>>> _getOrganizationByDomainMock;

    public BruteForceSecurityTests()
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
        _invitationServiceMock = new Mock<IUserInvitationService>();
        _getOrganizationByDomainMock = new Mock<Func<string, System.Threading.Tasks.Task<Organization?>>>();

        _authService = new AuthService(
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _jwtServiceMock.Object,
            Context,
            _loggerMock.Object,
            _invitationServiceMock.Object,
            _getOrganizationByDomainMock.Object);
    }

    private void SetupOrganizationMock(Organization organization)
    {
        _getOrganizationByDomainMock.Setup(x => x(organization.Domain))
            .ReturnsAsync(organization);
    }

    #region Progressive Lockout Tests

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithProgressiveLockout_ShouldLockAfterMaxAttempts()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Security Test Corp",
            Domain = "security-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for security tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@security-test.com",
            OrganizationId = org.Id,
            AccessFailedCount = 0
        };

        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@security-test.com",
            Password = "WrongPassword",
            OrganizationDomain = org.Domain
        };

        // Setup mocks for progressive lockout
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        _userManagerMock.Setup(x => x.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act - Simulate multiple failed attempts
        var exceptions = new List<Exception>();
        for (int i = 0; i < 5; i++)
        {
            try
            {
                await _authService.LoginAsync(request);
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
            }
        }

        // Assert - All attempts should fail
        Assert.Equal(5, exceptions.Count);
        exceptions.Should().AllSatisfy(ex => ex.Should().BeOfType<UnauthorizedAccessException>());
        
        // Verify access failed count was incremented
        _userManagerMock.Verify(x => x.AccessFailedAsync(user), Times.Exactly(5));
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithLockedAccount_ShouldReturnLockoutException()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Lockout Test Corp",
            Domain = "lockout-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for lockout tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@lockout-test.com",
            OrganizationId = org.Id,
            LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15) // Account is locked
        };

        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@lockout-test.com",
            Password = "AnyPassword",
            OrganizationDomain = org.Domain
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
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
    public async System.Threading.Tasks.Task LoginAsync_WithSuccessfulLogin_ShouldResetAccessFailedCount()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Reset Test Corp",
            Domain = "reset-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for reset tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@reset-test.com",
            OrganizationId = org.Id,
            AccessFailedCount = 3 // Previous failed attempts
        };

        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@reset-test.com",
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

    #endregion

    #region Rate Limiting Tests

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithRapidRequests_ShouldHandleGracefully()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Rate Limit Test Corp",
            Domain = "rate-limit-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for rate limiting tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@rate-limit-test.com",
            OrganizationId = org.Id
        };

        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@rate-limit-test.com",
            Password = "WrongPassword",
            OrganizationDomain = org.Domain
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        _userManagerMock.Setup(x => x.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act - Simulate rapid requests
        var tasks = new List<System.Threading.Tasks.Task<Exception?>>();
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(System.Threading.Tasks.Task.Run(async () =>
            {
                try
                {
                    await _authService.LoginAsync(request);
                    return null;
                }
                catch (Exception ex)
                {
                    return ex;
                }
            }));
        }

        var results = await System.Threading.Tasks.Task.WhenAll(tasks);

        // Assert - All requests should fail gracefully
        results.Should().AllSatisfy(result => 
        {
            result.Should().Match(r => r is UnauthorizedAccessException || r is InvalidOperationException);
        });
    }

    #endregion

    #region Security Logging Tests

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithSuspiciousActivity_ShouldLogSecurityEvents()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Logging Test Corp",
            Domain = "logging-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for logging tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@logging-test.com",
            OrganizationId = org.Id,
            AccessFailedCount = 4 // High number of failed attempts
        };

        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@logging-test.com",
            Password = "WrongPassword",
            OrganizationDomain = org.Domain
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        _userManagerMock.Setup(x => x.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));

        // Assert - Verify security event was logged
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed login attempt")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithAccountLockout_ShouldLogLockoutEvent()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Lockout Logging Test Corp",
            Domain = "lockout-logging-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for lockout logging tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@lockout-logging-test.com",
            OrganizationId = org.Id,
            LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15) // Account is locked
        };

        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@lockout-logging-test.com",
            Password = "AnyPassword",
            OrganizationDomain = org.Domain
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(true);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.LockedOut);

        // Act
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));

        // Assert - Verify lockout event was logged
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Account locked out")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Edge Cases Tests

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithNonExistentUser_ShouldNotIncrementAccessFailedCount()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Non-existent User Test Corp",
            Domain = "non-existent-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for non-existent user tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        SetupOrganizationMock(org);

        var request = new LoginRequest
        {
            Email = "nonexistent@non-existent-test.com",
            Password = "AnyPassword",
            OrganizationDomain = org.Domain
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));

        // Assert - Verify no access failed count was incremented (no user to increment)
        _userManagerMock.Verify(x => x.AccessFailedAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithInactiveOrganization_ShouldNotAllowLogin()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create inactive organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Inactive Security Test Corp",
            Domain = "inactive-security-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for inactive security tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = false // Inactive organization
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();
        
        // Don't setup organization mock - let the service use the fallback query
        // which will find the inactive organization and reject it

        var request = new LoginRequest
        {
            Email = "john.doe@inactive-security-test.com",
            Password = "CorrectPassword",
            OrganizationDomain = org.Domain
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }

    #endregion
}
