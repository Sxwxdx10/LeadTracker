using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Api.Middleware;
using LeadTracker.Api.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using LeadTracker.UnitTests.Common;
using Xunit;
using FluentAssertions;
using System.Security.Claims;

namespace LeadTracker.UnitTests.Services;

/// <summary>
/// Tests for multi-tenant resolution (org_id extraction and context management)
/// </summary>
public class MultiTenantResolutionTests : TestBase
{
    private readonly Mock<ILogger<TenantResolutionMiddleware>> _loggerMock;
    private readonly TenantResolutionMiddleware _middleware;
    private readonly TenantContext _tenantContext;

    public MultiTenantResolutionTests()
    {
        _loggerMock = new Mock<ILogger<TenantResolutionMiddleware>>();
        _tenantContext = new TenantContext();
        _middleware = new TenantResolutionMiddleware(
            context => System.Threading.Tasks.Task.CompletedTask, 
            _loggerMock.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithValidOrgIdHeader_ShouldSetOrganizationContext()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Company",
            Domain = "test.com",
            IsActive = true
        };

        await Context.Organizations.AddAsync(organization);
        await Context.SaveChangesAsync();

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Org-Id"] = orgId.ToString();

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().Be(orgId);
        _tenantContext.OrganizationName.Should().Be("Test Company");
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithInvalidOrgIdHeader_ShouldNotSetOrganizationContext()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Org-Id"] = "invalid-guid";

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().BeNull();
        _tenantContext.OrganizationName.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithNonExistentOrgId_ShouldNotSetOrganizationContext()
    {
        // Arrange
        var nonExistentOrgId = Guid.NewGuid();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Org-Id"] = nonExistentOrgId.ToString();

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().BeNull();
        _tenantContext.OrganizationName.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithInactiveOrganization_ShouldNotSetOrganizationContext()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Inactive Company",
            Domain = "inactive.com",
            IsActive = false // Inactive organization
        };

        await Context.Organizations.AddAsync(organization);
        await Context.SaveChangesAsync();

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Org-Id"] = orgId.ToString();

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().BeNull();
        _tenantContext.OrganizationName.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithEmptyOrgIdHeader_ShouldNotSetOrganizationContext()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Org-Id"] = "";

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().BeNull();
        _tenantContext.OrganizationName.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithMissingOrgIdHeader_ShouldNotSetOrganizationContext()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        // No X-Org-Id header set

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().BeNull();
        _tenantContext.OrganizationName.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithAuthenticatedUser_ShouldSetUserContext()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var userEmail = "test@example.com";
        
        var claims = new List<Claim>
        {
            new("user_id", userId.ToString()),
            new(ClaimTypes.Email, userEmail)
        };

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext();
        httpContext.User = principal;

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.UserId.Should().Be(userId);
        _tenantContext.UserEmail.Should().Be(userEmail);
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithUnauthenticatedUser_ShouldNotSetUserContext()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(); // No authenticated user

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.UserId.Should().BeNull();
        _tenantContext.UserEmail.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithMissingUserIdClaim_ShouldNotSetUserContext()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "test@example.com")
            // Missing user_id claim
        };

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext();
        httpContext.User = principal;

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.UserId.Should().BeNull();
        _tenantContext.UserEmail.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithInvalidUserIdClaim_ShouldNotSetUserContext()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new("user_id", "invalid-guid"),
            new(ClaimTypes.Email, "test@example.com")
        };

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext();
        httpContext.User = principal;

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.UserId.Should().BeNull();
        _tenantContext.UserEmail.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithBothOrgAndUser_ShouldSetBothContexts()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var userEmail = "test@example.com";
        
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Company",
            Domain = "test.com",
            IsActive = true
        };

        await Context.Organizations.AddAsync(organization);
        await Context.SaveChangesAsync();

        var claims = new List<Claim>
        {
            new("user_id", userId.ToString()),
            new(ClaimTypes.Email, userEmail)
        };

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Org-Id"] = orgId.ToString();
        httpContext.User = principal;

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().Be(orgId);
        _tenantContext.OrganizationName.Should().Be("Test Company");
        _tenantContext.UserId.Should().Be(userId);
        _tenantContext.UserEmail.Should().Be(userEmail);
    }

    [Fact]
    public async System.Threading.Tasks.Task InvokeAsync_WithValidOrgId_ShouldSetOrganizationContext()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = orgId,
            Name = "Test Company",
            Domain = "test.com",
            IsActive = true
        };

        await Context.Organizations.AddAsync(organization);
        await Context.SaveChangesAsync();

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Org-Id"] = orgId.ToString();

        // Act
        await _middleware.InvokeAsync(httpContext, _tenantContext, Context);

        // Assert
        _tenantContext.OrganizationId.Should().Be(orgId);
        _tenantContext.OrganizationName.Should().Be("Test Company");
    }

}
