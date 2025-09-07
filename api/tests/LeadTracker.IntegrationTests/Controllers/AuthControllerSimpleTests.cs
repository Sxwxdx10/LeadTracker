using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LeadTracker.Api.Models;
using LeadTracker.Infrastructure;
using System.Net;
using System.Text.Json;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Simple integration tests for AuthController endpoints
/// </summary>
    public class AuthControllerSimpleTests : IClassFixture<TestWebApplicationFactory>, IAsyncLifetime
    {
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

        public AuthControllerSimpleTests(TestWebApplicationFactory factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

    public async System.Threading.Tasks.Task InitializeAsync()
    {
        // Seed data using the same scope as the application
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Ensure database is created asynchronously
        await context.Database.EnsureCreatedAsync();
        
        var seeder = scope.ServiceProvider.GetRequiredService<ITestDataSeeder>();
        await seeder.SeedAsync();
    }

    public async System.Threading.Tasks.Task DisposeAsync()
    {
        // Clean up using the same scope as the application
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        await context.Database.EnsureDeletedAsync();
        _client.Dispose();
    }

    [Fact]
    public async System.Threading.Tasks.Task Register_WithValidData_ShouldReturnAuthResponse()
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
    public async System.Threading.Tasks.Task Login_WithValidCredentials_ShouldReturnAuthResponse()
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
            Password = "TestPassword123!",
            OrganizationDomain = "test-company"
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
    public async System.Threading.Tasks.Task Register_WithInvalidEmail_ShouldReturnBadRequest()
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
    public async System.Threading.Tasks.Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "test-company"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
