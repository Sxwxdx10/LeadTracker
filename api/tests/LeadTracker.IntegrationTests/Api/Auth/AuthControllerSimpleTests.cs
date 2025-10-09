using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LeadTracker.Core.Models;
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
        // Ensure database is created asynchronously
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        await context.Database.EnsureCreatedAsync();
    }

    public async System.Threading.Tasks.Task DisposeAsync()
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
