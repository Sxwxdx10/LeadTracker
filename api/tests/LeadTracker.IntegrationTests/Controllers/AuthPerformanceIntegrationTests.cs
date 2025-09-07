using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LeadTracker.Api.Models;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Performance integration tests for AuthController endpoints
/// </summary>
public class AuthPerformanceIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly LeadTrackerDbContext _context;

    public AuthPerformanceIntegrationTests(WebApplicationFactory<Program> factory)
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
                    options.UseInMemoryDatabase("PerformanceTestDb_" + Guid.NewGuid().ToString());
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

    #region Registration Performance Tests

    [Fact]
    public async Task Register_ShouldCompleteWithinAcceptableTime()
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
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(2000); // Should complete within 2 seconds
    }

    [Fact]
    public async Task Register_WithMultipleConcurrentRequests_ShouldHandleGracefully()
    {
        // Arrange
        var tasks = new List<Task<HttpResponseMessage>>();
        var requestCount = 10;

        for (int i = 0; i < requestCount; i++)
        {
            var request = new RegisterRequest
            {
                FirstName = "John",
                LastName = "Doe",
                Email = $"john.doe{i}@example.com",
                Password = "TestPassword123!",
                ConfirmPassword = "TestPassword123!",
                OrganizationName = $"Test Company {i}",
                OrganizationDomain = $"test-company-{i}"
            };

            tasks.Add(_client.PostAsJsonAsync("/api/auth/register", request));
        }

        // Act
        var stopwatch = Stopwatch.StartNew();
        var responses = await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.OK));
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000); // All requests should complete within 5 seconds
    }

    #endregion

    #region Login Performance Tests

    [Fact]
    public async Task Login_ShouldCompleteWithinAcceptableTime()
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
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000); // Should complete within 1 second
    }

    [Fact]
    public async Task Login_WithMultipleConcurrentRequests_ShouldHandleGracefully()
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

        var tasks = new List<Task<HttpResponseMessage>>();
        var requestCount = 20;

        for (int i = 0; i < requestCount; i++)
        {
            var loginRequest = new LoginRequest
            {
                Email = "john.doe@example.com",
                Password = "TestPassword123!"
            };

            tasks.Add(_client.PostAsJsonAsync("/api/auth/login", loginRequest));
        }

        // Act
        var stopwatch = Stopwatch.StartNew();
        var responses = await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.OK));
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(3000); // All requests should complete within 3 seconds
    }

    #endregion

    #region Password Reset Performance Tests

    [Fact]
    public async Task ResetPassword_ShouldCompleteWithinAcceptableTime()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Email = "john.doe@example.com"
        };

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.PostAsJsonAsync("/api/auth/reset-password", request);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000); // Should complete within 1 second
    }

    [Fact]
    public async Task ConfirmResetPassword_ShouldCompleteWithinAcceptableTime()
    {
        // Arrange
        var request = new ConfirmResetPasswordRequest
        {
            Email = "john.doe@example.com",
            Token = "valid-token",
            NewPassword = "NewPassword123!"
        };

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.PostAsJsonAsync("/api/auth/confirm-reset-password", request);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000); // Should complete within 1 second
    }

    #endregion

    #region Refresh Token Performance Tests

    [Fact]
    public async Task RefreshToken_ShouldCompleteWithinAcceptableTime()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            RefreshToken = "valid-refresh-token"
        };

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.PostAsJsonAsync("/api/auth/refresh", request);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotImplemented, HttpStatusCode.Unauthorized);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000); // Should complete within 1 second
    }

    #endregion

    #region Memory Usage Tests

    [Fact]
    public async Task Register_MultipleUsers_ShouldNotCauseMemoryLeaks()
    {
        // Arrange
        var initialMemory = GC.GetTotalMemory(true);
        var requestCount = 100;

        // Act
        for (int i = 0; i < requestCount; i++)
        {
            var request = new RegisterRequest
            {
                FirstName = "John",
                LastName = "Doe",
                Email = $"john.doe{i}@example.com",
                Password = "TestPassword123!",
                ConfirmPassword = "TestPassword123!",
                OrganizationName = $"Test Company {i}",
                OrganizationDomain = $"test-company-{i}"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/register", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        // Force garbage collection
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();

        var finalMemory = GC.GetTotalMemory(false);

        // Assert
        var memoryIncrease = finalMemory - initialMemory;
        memoryIncrease.Should().BeLessThan(50 * 1024 * 1024); // Should not increase by more than 50MB
    }

    #endregion

    #region Database Performance Tests

    [Fact]
    public async Task Login_WithLargeDatabase_ShouldMaintainPerformance()
    {
        // Arrange - Create many users to simulate a large database
        var organization = new Core.Entities.Organization
        {
            Id = Guid.NewGuid(),
            Name = "Large Test Company",
            Domain = "large-test-company",
            Description = "Test organization with many users",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Organizations.Add(organization);

        // Create 1000 users
        for (int i = 0; i < 1000; i++)
        {
            var user = new Core.Entities.ApplicationUser
            {
                Id = Guid.NewGuid(),
                FirstName = "User",
                LastName = $"Number{i}",
                Email = $"user{i}@example.com",
                UserName = $"user{i}@example.com",
                EmailConfirmed = true,
                IsActive = true,
                OrganizationId = organization.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
        }

        await _context.SaveChangesAsync();

        var loginRequest = new LoginRequest
        {
            Email = "user500@example.com",
            Password = "TestPassword123!"
        };

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized); // User doesn't have a password set
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(2000); // Should still complete within 2 seconds even with large database
    }

    #endregion
}
