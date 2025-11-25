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
/// Multi-tenant tests for authentication (data isolation, organization boundaries)
/// </summary>
public class AuthMultiTenantTests : TestBase
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly Mock<IUserInvitationService> _invitationServiceMock;
    private readonly Mock<Func<string, System.Threading.Tasks.Task<Organization?>>> _getOrganizationByDomainMock;
    private readonly AuthService _authService;

    public AuthMultiTenantTests()
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
        // Setup the mock to return the organization when called with the specific domain
        _getOrganizationByDomainMock.Setup(x => x(organization.Domain))
            .ReturnsAsync(organization);
    }

    [Fact]
    public async System.Threading.Tasks.Task RegisterAsync_ShouldCreateUserInCorrectOrganization()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange
        var uniqueDomain = "company1-" + Guid.NewGuid().ToString("N")[..8];
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@company1.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            OrganizationName = "Company 1",
            OrganizationDescription = "First company",
            OrganizationDomain = uniqueDomain
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
        Assert.Equal("Company 1", result.Organization.Name);
        Assert.Equal(uniqueDomain, result.Organization.Domain);
        
        // Verify organization was created with correct domain
        var organization = await Context.Organizations
            .FirstOrDefaultAsync(o => o.Domain == uniqueDomain);
        Assert.NotNull(organization);
        Assert.Equal("Company 1", organization.Name);
        Assert.Equal(uniqueDomain, organization.Domain);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithWrongOrganization_ShouldFail()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization 1
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Company 1",
            Domain = "company1",
            Description = "First company",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org1);
        await Context.SaveChangesAsync();

        // Setup organization mock to return null for wrong domain
        _getOrganizationByDomainMock.Setup(x => x("company2"))
            .ReturnsAsync((Organization?)null);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@company1.com",
            OrganizationId = org1.Id
        };

        var request = new LoginRequest
        {
            Email = "john.doe@company1.com",
            Password = "CorrectPassword",
            OrganizationDomain = "company2" // Wrong organization domain
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithCorrectOrganization_ShouldSucceed()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create organization
        var uniqueDomain = "company1-login-" + Guid.NewGuid().ToString("N")[..8];
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Company 1",
            Domain = uniqueDomain,
            Description = "First company",
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
            Email = "john.doe@company1.com",
            OrganizationId = org.Id
        };

        // Add user to database
        await Context.Users.AddAsync(user);
        await Context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "john.doe@company1.com",
            Password = "CorrectPassword",
            OrganizationDomain = uniqueDomain // Correct organization domain
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
        Assert.Equal(refreshToken, result.RefreshToken);
        Assert.Equal(org.Id, result.Organization.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task RegisterAsync_WithSameEmailInDifferentOrganizations_ShouldSucceed()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create first organization and user
        var org1 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Company 1",
            Domain = "company1",
            Description = "First company",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        await Context.Organizations.AddAsync(org1);
        await Context.SaveChangesAsync();

        var user1 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            OrganizationId = org1.Id
        };

        await Context.Users.AddAsync(user1);
        await Context.SaveChangesAsync();

        // Try to register same email in different organization
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com", // Same email
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            OrganizationName = "Company 2",
            OrganizationDescription = "Second company",
            OrganizationDomain = "company2" // Different organization
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
        Assert.Equal("Company 2", result.Organization.Name);
        Assert.Equal("company2", result.Organization.Domain);
        
        // Verify both organizations exist
        var org1FromDb = await Context.Organizations.FirstOrDefaultAsync(o => o.Domain == "company1");
        var org2FromDb = await Context.Organizations.FirstOrDefaultAsync(o => o.Domain == "company2");
        
        Assert.NotNull(org1FromDb);
        Assert.NotNull(org2FromDb);
        Assert.NotEqual(org1FromDb.Id, org2FromDb.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_WithInactiveOrganization_ShouldFail()
    {
        // Clean up before test
        await CleanupAsync();
        
        // Arrange - Create inactive organization
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Inactive Company",
            Domain = "inactive-company",
            Description = "Inactive company",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = false // Inactive organization
        };

        await Context.Organizations.AddAsync(org);
        await Context.SaveChangesAsync();

        // Setup organization mock to return the inactive organization
        SetupOrganizationMock(org);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@inactive-company.com",
            OrganizationId = org.Id
        };

        var request = new LoginRequest
        {
            Email = "john.doe@inactive-company.com",
            Password = "CorrectPassword",
            OrganizationDomain = "inactive-company"
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }
}
