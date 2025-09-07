using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using FluentAssertions;
using LeadTracker.Api.Models;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Integration tests for AuthController endpoints
/// </summary>
public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly LeadTrackerDbContext _context;

    public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove the existing DbContext registration
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<LeadTrackerDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add in-memory database for testing
                services.AddDbContext<LeadTrackerDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid().ToString());
                });
            });
        });

        _client = _factory.CreateClient();
        
        // Get DbContext from the factory
        var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
    }

    public async Task InitializeAsync()
    {
        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();
        _context.Dispose();
        _client.Dispose();
    }

    #region Register Tests

    [Fact]
    public async Task Register_WithValidData_ShouldReturnAuthResponse()
    {
        // Arrange
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
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

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
        // Arrange
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
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithPasswordMismatch_ShouldReturnBadRequest()
    {
        // Arrange
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
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
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

        await _client.PostAsJsonAsync("/api/auth/register", firstRequest);

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
        var response = await _client.PostAsJsonAsync("/api/auth/register", secondRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnAuthResponse()
    {
        // Arrange - Register first
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

        await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = "TestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

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
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "invalid-email",
            Password = "TestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Refresh Token Tests

    [Fact]
    public async Task RefreshToken_WithValidToken_ShouldReturnNewTokens()
    {
        // Arrange - Register and login first
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

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
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
        var response = await _client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotImplemented); // Not implemented yet
    }

    [Fact]
    public async Task RefreshToken_WithInvalidToken_ShouldReturnUnauthorized()
    {
        // Arrange
        var refreshRequest = new RefreshTokenRequest
        {
            RefreshToken = "invalid-refresh-token"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Password Reset Tests

    [Fact]
    public async Task ResetPassword_WithValidEmail_ShouldReturnOk()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Email = "john.doe@example.com"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/reset-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ResetPassword_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Email = "invalid-email"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/reset-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ConfirmResetPassword_WithValidToken_ShouldReturnOk()
    {
        // Arrange
        var request = new ConfirmResetPasswordRequest
        {
            Email = "john.doe@example.com",
            Token = "valid-token",
            NewPassword = "NewPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/confirm-reset-password", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Logout Tests

    [Fact]
    public async Task Logout_WithoutAuthorization_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            RefreshToken = "some-refresh-token"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/logout", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region GetCurrentUser Tests

    [Fact]
    public async Task GetCurrentUser_WithoutAuthorization_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
