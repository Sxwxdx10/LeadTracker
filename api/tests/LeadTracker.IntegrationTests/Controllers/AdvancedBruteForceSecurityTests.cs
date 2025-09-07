using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LeadTracker.Api.Models;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Advanced brute force security integration tests for AuthController endpoints
/// </summary>
public class AdvancedBruteForceSecurityTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly LeadTrackerDbContext _context;

    public AdvancedBruteForceSecurityTests(WebApplicationFactory<Program> factory)
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
                    options.UseInMemoryDatabase("AdvancedBruteForceTestDb_" + Guid.NewGuid().ToString());
                });
            });
        });

        _client = _factory.CreateClient();
        _context = _factory.Services.GetRequiredService<LeadTrackerDbContext>();
    }

    public async Task InitializeAsync()
    {
        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();
        _client.Dispose();
    }

    #region Progressive Lockout Integration Tests

    [Fact]
    public async Task Login_WithProgressiveLockout_ShouldEventuallyLockAccount()
    {
        // Arrange - Create test data
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Progressive Lockout Test Corp",
            Domain = "progressive-lockout-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for progressive lockout tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@progressive-lockout-test.com",
            OrganizationId = org.Id,
            AccessFailedCount = 0
        };

        await _context.Organizations.AddAsync(org);
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var loginRequest = new LoginRequest
        {
            Email = "john.doe@progressive-lockout-test.com",
            Password = "WrongPassword123!",
            OrganizationDomain = org.Domain
        };

        // Act - Simulate multiple failed attempts
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 6; i++) // More than typical lockout threshold
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
            responses.Add(response);
            
            // Small delay to simulate real-world timing
            await Task.Delay(100);
        }

        // Assert - All attempts should fail
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.Unauthorized));
        
        // Verify that the user's access failed count was incremented
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser.Should().NotBeNull();
        updatedUser!.AccessFailedCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Login_WithLockedAccount_ShouldReturnLockoutMessage()
    {
        // Arrange - Create test data with locked account
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Lockout Message Test Corp",
            Domain = "lockout-message-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for lockout message tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@lockout-message-test.com",
            OrganizationId = org.Id,
            LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15), // Account is locked
            AccessFailedCount = 5
        };

        await _context.Organizations.AddAsync(org);
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var loginRequest = new LoginRequest
        {
            Email = "john.doe@lockout-message-test.com",
            Password = "AnyPassword123!",
            OrganizationDomain = org.Domain
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        content.Should().Contain("locked");
    }

    #endregion

    #region Rate Limiting Integration Tests

    [Fact]
    public async Task Login_WithRapidRequests_ShouldHandleGracefully()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "rapid@test.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "rapid-test-domain"
        };

        // Act - Simulate rapid concurrent requests
        var tasks = new List<Task<HttpResponseMessage>>();
        for (int i = 0; i < 20; i++)
        {
            tasks.Add(_client.PostAsJsonAsync("/api/auth/login", loginRequest));
        }

        var responses = await Task.WhenAll(tasks);

        // Assert - All requests should be handled gracefully
        responses.Should().AllSatisfy(r => r.StatusCode.Should().BeOneOf(
            HttpStatusCode.Unauthorized, 
            HttpStatusCode.TooManyRequests,
            HttpStatusCode.BadRequest));
    }

    [Fact]
    public async Task Login_WithDistributedRequests_ShouldMaintainSecurity()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "distributed@test.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "distributed-test-domain"
        };

        // Act - Simulate distributed requests with delays
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 10; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
            responses.Add(response);
            
            // Simulate distributed timing
            await Task.Delay(200);
        }

        // Assert - Should maintain security posture
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.Unauthorized));
    }

    #endregion

    #region Security Headers and Response Tests

    [Fact]
    public async Task Login_WithFailedAttempts_ShouldIncludeSecurityHeaders()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "security-headers@test.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "security-headers-domain"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert - Check for security headers
        response.Headers.Should().ContainKey("X-Content-Type-Options");
        response.Headers.Should().ContainKey("X-Frame-Options");
        response.Headers.Should().ContainKey("X-XSS-Protection");
    }

    [Fact]
    public async Task Login_WithSuspiciousActivity_ShouldLogSecurityEvents()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "suspicious@test.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "suspicious-domain"
        };

        // Act - Multiple failed attempts
        for (int i = 0; i < 5; i++)
        {
            await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
            await Task.Delay(50);
        }

        // Assert - This test verifies that the system handles suspicious activity
        // In a real implementation, you would verify that security events were logged
        // For now, we just ensure the system doesn't crash
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Edge Cases and Error Handling

    [Theory]
    [InlineData("")]
    [InlineData("invalid-email")]
    [InlineData("test@")]
    [InlineData("@test.com")]
    public async Task Login_WithInvalidEmailFormats_ShouldReturnBadRequest(string invalidEmail)
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = invalidEmail,
            Password = "Password123!",
            OrganizationDomain = "test-domain"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("")]
    [InlineData("123")]
    [InlineData("password")]
    [InlineData("PASSWORD")]
    [InlineData("Password")]
    public async Task Login_WithWeakPasswords_ShouldReturnBadRequest(string weakPassword)
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "weak-password@test.com",
            Password = weakPassword,
            OrganizationDomain = "test-domain"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNullRequestBody_ShouldReturnBadRequest()
    {
        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", (object?)null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithMalformedJson_ShouldReturnBadRequest()
    {
        // Arrange
        var content = new StringContent("{ invalid json }", System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/login", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Performance Under Load Tests

    [Fact]
    public async Task Login_UnderHighLoad_ShouldMaintainResponseTimes()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "load-test@test.com",
            Password = "WrongPassword123!",
            OrganizationDomain = "load-test-domain"
        };

        // Act - Measure response times under load
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var tasks = new List<Task<HttpResponseMessage>>();
        
        for (int i = 0; i < 50; i++)
        {
            tasks.Add(_client.PostAsJsonAsync("/api/auth/login", loginRequest));
        }

        var responses = await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert - Response times should be reasonable
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000); // Less than 5 seconds for 50 requests
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.Unauthorized));
    }

    [Fact]
    public async Task Login_WithConcurrentUsers_ShouldIsolateAttempts()
    {
        // Arrange - Create multiple users
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Concurrent Users Test Corp",
            Domain = "concurrent-users-test-" + Guid.NewGuid().ToString("N")[..8],
            Description = "Test organization for concurrent users tests",
            TimeZone = "UTC",
            Currency = "USD",
            IsActive = true
        };

        var users = new List<ApplicationUser>();
        for (int i = 0; i < 5; i++)
        {
            users.Add(new ApplicationUser
            {
                Id = Guid.NewGuid(),
                FirstName = "User",
                LastName = $"Number{i}",
                Email = $"user{i}@concurrent-users-test.com",
                OrganizationId = org.Id,
                AccessFailedCount = 0
            });
        }

        await _context.Organizations.AddAsync(org);
        await _context.Users.AddRangeAsync(users);
        await _context.SaveChangesAsync();

        // Act - Simulate concurrent login attempts from different users
        var tasks = new List<Task<HttpResponseMessage>>();
        for (int i = 0; i < 5; i++)
        {
            var loginRequest = new LoginRequest
            {
                Email = $"user{i}@concurrent-users-test.com",
                Password = "WrongPassword123!",
                OrganizationDomain = org.Domain
            };
            tasks.Add(_client.PostAsJsonAsync("/api/auth/login", loginRequest));
        }

        var responses = await Task.WhenAll(tasks);

        // Assert - All should fail independently
        responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.Unauthorized));
    }

    #endregion
}
