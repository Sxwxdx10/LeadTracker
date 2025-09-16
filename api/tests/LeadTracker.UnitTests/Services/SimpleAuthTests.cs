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
using System.Collections.Generic;

namespace LeadTracker.UnitTests.Services;

/// <summary>
/// Simple authentication tests with proper data cleanup
/// </summary>
public class SimpleAuthTests : TestBase
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly AuthService _authService;

    public SimpleAuthTests()
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

        _authService = new AuthService(
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _jwtServiceMock.Object,
            Context,
            _loggerMock.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task RegisterAsync_WithValidData_ShouldCreateUserAndOrganization()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            OrganizationName = "Test Corp",
            OrganizationDescription = "Test organization",
            OrganizationDomain = "test-corp"
        };

        var accessToken = "access-token";
        var refreshToken = "refresh-token";

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });

        _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns(accessToken);

        _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
            .Returns(refreshToken);

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(accessToken, result.AccessToken);
        Assert.Equal(refreshToken, result.RefreshToken);
        Assert.Equal(request.FirstName, result.User.FirstName);
        Assert.Equal(request.LastName, result.User.LastName);
        Assert.Equal(request.Email, result.User.Email);
        Assert.Equal(request.OrganizationName, result.Organization.Name);
        Assert.Equal(request.OrganizationDomain, result.Organization.Domain);

        // Verify organization was created
        var organization = await Context.Organizations
            .FirstOrDefaultAsync(o => o.Domain == request.OrganizationDomain);
        Assert.NotNull(organization);
        Assert.Equal(request.OrganizationName, organization.Name);
    }

    [Fact]
    public async System.Threading.Tasks.Task RegisterAsync_WithExistingOrganizationDomain_ShouldUseExistingOrganization()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange
        var existingOrg = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Existing Corp",
            Domain = "existing-corp",
            Description = "Existing organization",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(existingOrg);
        await Context.SaveChangesAsync();

        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            OrganizationName = "Test Corp",
            OrganizationDescription = "Test organization",
            OrganizationDomain = "existing-corp" // Same domain as existing org
        };

        // Setup mocks to return successful results
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);
        
        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });

        _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns("fake-access-token");
        
        _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
            .Returns("fake-refresh-token");

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("john.doe@example.com", result.User.Email);
        Assert.Equal("John", result.User.FirstName);
        Assert.Equal("Doe", result.User.LastName);
        Assert.Equal(existingOrg.Id, result.Organization.Id);
        Assert.Equal("Existing Corp", result.Organization.Name); // Should use existing org name, not new one
        Assert.Equal("existing-corp", result.Organization.Domain);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithInvalidCredentials_ShouldThrowException()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange
        var request = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword",
            OrganizationDomain = "test-corp"
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }
}