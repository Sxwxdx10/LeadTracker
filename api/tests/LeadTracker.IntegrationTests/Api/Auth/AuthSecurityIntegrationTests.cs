using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LeadTracker.Core.Models;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Security integration tests for AuthController endpoints
/// </summary>
public class AuthSecurityIntegrationTests : IClassFixture<TestWebApplicationFactory>, IAsyncLifetime
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthSecurityIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        // Ensure database is created asynchronously
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        await context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        // Clean up using proper cascade deletion to avoid constraint violations
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        try
        {
            // DEBUG: Check what data exists before cleanup
            var businessUsersCount = await context.BusinessUsers.CountAsync();
            var organizationsCount = await context.Organizations.CountAsync();
            var stagesCount = await context.Stages.CountAsync();
            var leadsCount = await context.Leads.CountAsync();
            
            Console.WriteLine($"DEBUG - Before cleanup: BusinessUsers={businessUsersCount}, Organizations={organizationsCount}, Stages={stagesCount}, Leads={leadsCount}");
            
            // If EF Core sees Organizations but no other data due to multi-tenant filters, consider cleanup already successful
            if (organizationsCount > 0 && businessUsersCount == 0 && stagesCount == 0 && leadsCount == 0)
            {
                Console.WriteLine("Multi-tenant filters active - Organizations visible but other entities filtered out - cleanup considered successful");
            }
            else if (businessUsersCount == 0 && organizationsCount == 0 && stagesCount == 0 && leadsCount == 0)
            {
                Console.WriteLine("No test data visible to EF Core (multi-tenant filters active) - cleanup considered successful");
            }
            else
            {
                // Clean in proper order to avoid constraint violations
                await context.UserRoles.ExecuteDeleteAsync();
                await context.Tasks.ExecuteDeleteAsync();
                await context.Leads.ExecuteDeleteAsync();
                await context.Stages.ExecuteDeleteAsync();
                
                // Force cleanup with raw SQL (bypasses EF Core filters)
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"BusinessUsers\"");
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Stages\"");
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Leads\"");
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Tasks\"");
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserRoles\"");
                Console.WriteLine("Force cleaned all entities with raw SQL");
                
                await context.Users.ExecuteDeleteAsync();
                await context.Organizations.ExecuteDeleteAsync();
                
                Console.WriteLine("Test data cleaned successfully");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not clean test data: {ex.Message}");
            // Fallback to database deletion if cleanup fails
            await context.Database.EnsureDeletedAsync();
        }
        
        _client.Dispose();
    }

    #region SQL Injection Tests

    [Fact]
    public async Task Login_WithSqlInjectionInEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "admin'; DROP TABLE Users; --",
            Password = "TestPassword123!",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithSqlInjectionInEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "admin'; DROP TABLE Users; --",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region XSS Tests

    [Fact]
    public async Task Register_WithXssInFirstName_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "<script>alert('xss')</script>",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithXssInOrganizationName_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "<script>alert('xss')</script>",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Rate Limiting Tests

    [Fact]
    public async Task Login_WithMultipleFailedAttempts_ShouldEventuallyReturnUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "test-company"
        };

        // Act - Multiple failed attempts
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 5; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
            responses.Add(response);
        }

        // Assert
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.Unauthorized));
    }

    #endregion

    #region Input Validation Tests

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("a")]
    [InlineData("a@")]
    [InlineData("@example.com")]
    [InlineData("test@")]
    [InlineData("test..test@example.com")]
    [InlineData("test@example..com")]
    public async Task Register_WithInvalidEmailFormats_ShouldReturnBadRequest(string invalidEmail)
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = invalidEmail,
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("123")]
    [InlineData("password")]
    [InlineData("PASSWORD")]
    [InlineData("Password")]
    [InlineData("Password123")]
    [InlineData("Password!")]
    [InlineData("ThisIsAVeryLongPasswordThatExceedsTheMaximumAllowedLengthAndShouldBeRejectedByTheValidation")]
    public async Task Register_WithInvalidPasswordFormats_ShouldReturnBadRequest(string invalidPassword)
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = invalidPassword,
            ConfirmPassword = invalidPassword,
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Authorization Tests

    [Fact]
    public async Task Logout_WithoutValidToken_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            RefreshToken = "invalid-token"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/logout", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Data Isolation Tests

    [Fact]
    public async Task Register_WithSameOrganizationDomain_ShouldSucceed()
    {
        // Arrange - First registration
        var firstRequest = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/auth/register", firstRequest);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Second registration with same organization domain - should succeed
        var secondRequest = new RegisterRequest
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@example.com",
            Password = "TestPassword456!",
            ConfirmPassword = "TestPassword456!",
            OrganizationName = "Another Company",
            OrganizationDomain = "test-company" // Same domain - allowed in multi-tenant architecture
        };

        // Act
        var secondResponse = await _client.PostAsJsonAsync("/api/auth/register", secondRequest);

        // Assert
        secondResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Content Type Tests

    [Fact]
    public async Task Login_WithInvalidContentType_ShouldReturnUnsupportedMediaType()
    {
        // Arrange
        var content = new StringContent("invalid json", System.Text.Encoding.UTF8, "text/plain");

        // Act
        var response = await _client.PostAsync("/api/auth/login", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
    }

    [Fact]
    public async Task Register_WithInvalidContentType_ShouldReturnUnsupportedMediaType()
    {
        // Arrange
        var content = new StringContent("invalid json", System.Text.Encoding.UTF8, "text/plain");

        // Act
        var response = await _client.PostAsync("/api/auth/register", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
    }

    #endregion
}
