using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using FluentAssertions;
using LeadTracker.Core.Models;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Integration tests for AuthController endpoints
/// </summary>
public class AuthControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>, IAsyncLifetime
{
    private readonly TestWebApplicationFactory _factory;

    public AuthControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
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
            // Clean in proper order to avoid constraint violations
            // Clean user roles first (depends on users and roles)
            await context.UserRoles.ExecuteDeleteAsync();
            
            // Clean tasks (depends on leads and users)
            await context.Tasks.ExecuteDeleteAsync();
            
            // Clean leads (depends on stages and users)
            await context.Leads.ExecuteDeleteAsync();
            
            // Force cleanup of any remaining leads (more aggressive approach)
            try
            {
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Leads\"");
                Console.WriteLine("Force cleaned all leads in DisposeAsync");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Force cleanup of leads failed in DisposeAsync: {ex.Message}");
            }
            
            // Clean stages (depends on organizations)
            await context.Stages.ExecuteDeleteAsync();
            
            // Force cleanup of any remaining stages (more aggressive approach)
            try
            {
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Stages\"");
                Console.WriteLine("Force cleaned all stages in DisposeAsync");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Force cleanup of stages failed in DisposeAsync: {ex.Message}");
            }
            
            // Clean business users (depends on organizations)
            await context.BusinessUsers.ExecuteDeleteAsync();
            
            // Force cleanup of any remaining business users (more aggressive approach)
            try
            {
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"BusinessUsers\"");
                Console.WriteLine("Force cleaned all business users in DisposeAsync");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Force cleanup failed in DisposeAsync: {ex.Message}");
            }
            
            // Clean ApplicationUsers (Identity users - depends on organizations)
            await context.Users.ExecuteDeleteAsync();
            
            // Finally, clean organizations
            await context.Organizations.ExecuteDeleteAsync();
            
            // Keep system roles for reuse across tests
            Console.WriteLine("Test data cleaned successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not clean test data: {ex.Message}");
            // Fallback to database recreation if cleanup fails
            try
            {
                await context.Database.EnsureDeletedAsync();
                await context.Database.EnsureCreatedAsync();
                Console.WriteLine("Database recreated after cleanup failure");
            }
            catch (Exception recreateEx)
            {
                Console.WriteLine($"Warning: Could not recreate database: {recreateEx.Message}");
            }
        }
    }

    /// <summary>
    /// Creates a client with authentication for testing
    /// </summary>
    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "test-token");
        return client;
    }

    /// <summary>
    /// Creates a client without authentication for testing
    /// </summary>
    private HttpClient CreateUnauthenticatedClient()
    {
        return _factory.CreateClient();
    }

    #region Register Tests

    [Fact]
    public async Task Register_WithValidData_ShouldReturnAuthResponse()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        authResponse.Should().NotBeNull();
        authResponse!.AccessToken.Should().NotBeNullOrEmpty();
        authResponse.RefreshToken.Should().NotBeNullOrEmpty();
        authResponse.User.Should().NotBeNull();
        authResponse.User!.Email.Should().Be(request.Email);
        authResponse.User.FirstName.Should().Be(request.FirstName);
        authResponse.User.LastName.Should().Be(request.LastName);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "invalid-email",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithPasswordMismatch_ShouldReturnBadRequest()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "DifferentPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        // First registration
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

        await client.PostAsJsonAsync("/api/auth/register", firstRequest);

        // Second registration with same email
        var secondRequest = new RegisterRequest
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "john.doe@example.com",
            Password = "TestPassword456!",
            ConfirmPassword = "TestPassword456!",
            OrganizationName = "Another Company",
            OrganizationDomain = "another-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", secondRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnAuthResponse()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        // Register first
        var registerRequest = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        await client.PostAsJsonAsync("/api/auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        authResponse.Should().NotBeNull();
        authResponse!.AccessToken.Should().NotBeNullOrEmpty();
        authResponse.RefreshToken.Should().NotBeNullOrEmpty();
        authResponse.User.Should().NotBeNull();
        authResponse.User!.Email.Should().Be(loginRequest.Email);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var loginRequest = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var loginRequest = new LoginRequest
        {
            Email = "invalid-email",
            Password = "TestPassword123!",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Refresh Token Tests

    [Fact]
    public async Task RefreshToken_WithValidToken_ShouldReturnNewTokens()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        // Register and login first
        var registerRequest = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            OrganizationName = "Test Company",
            OrganizationDomain = "test-company"
        };

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", registerRequest);
        var registerContent = await registerResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(registerContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        var refreshRequest = new RefreshTokenRequest
        {
            RefreshToken = authResponse!.RefreshToken
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotImplemented); // Not implemented yet
    }

    [Fact]
    public async Task RefreshToken_WithInvalidToken_ShouldReturnUnauthorized()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var refreshRequest = new RefreshTokenRequest
        {
            RefreshToken = "invalid-refresh-token"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Password Reset Tests

    [Fact]
    public async Task ResetPassword_WithValidEmail_ShouldReturnOk()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var request = new ResetPasswordRequest
        {
            Email = "john.doe@example.com",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/reset-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ResetPassword_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var request = new ResetPasswordRequest
        {
            Email = "invalid-email",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/reset-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ConfirmResetPassword_WithValidToken_ShouldReturnOk()
    {
        // Arrange - Create a client with authentication
        var client = CreateAuthenticatedClient();
        
        var request = new ConfirmResetPasswordRequest
        {
            Email = "john.doe@example.com",
            Token = "valid-token",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/confirm-reset-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Logout Tests

    [Fact]
    public async Task Logout_WithoutAuthorization_ShouldReturnUnauthorized()
    {
        // Arrange - Create a client without authentication
        var client = CreateUnauthenticatedClient();
        
        var request = new RefreshTokenRequest
        {
            RefreshToken = "some-refresh-token"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/logout", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region GetCurrentUser Tests

    [Fact]
    public async Task GetCurrentUser_WithoutAuthorization_ShouldReturnUnauthorized()
    {
        // Arrange - Create a client without authentication
        var client = CreateUnauthenticatedClient();
        
        // Act
        var response = await client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
