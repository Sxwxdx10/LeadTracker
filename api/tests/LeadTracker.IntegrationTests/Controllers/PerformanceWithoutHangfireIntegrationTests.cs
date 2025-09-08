using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using LeadTracker.IntegrationTests;
using LeadTracker.Core.Services;
using Xunit;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using LeadTracker.Core.Models;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Performance tests to validate that the application works correctly without Hangfire
/// and maintains good performance characteristics
/// </summary>
public class PerformanceWithoutHangfireIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PerformanceWithoutHangfireIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public void Application_Startup_ShouldBeFast_WithoutHangfire()
    {
        // Arrange
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Create a new client to test startup time
        using var newClient = _factory.CreateClient();
        stopwatch.Stop();
        
        // Assert - Startup should be fast without Hangfire initialization
        Assert.True(stopwatch.ElapsedMilliseconds < 2000, 
            $"Application startup took {stopwatch.ElapsedMilliseconds}ms, expected < 2000ms");
    }

    [Fact]
    public async Task HealthCheck_ShouldRespondQuickly_WithoutHangfire()
    {
        // Arrange
        var stopwatch = Stopwatch.StartNew();
        
        // Act
        var response = await _client.GetAsync("/health");
        stopwatch.Stop();
        
        // Assert
        Assert.True(response.IsSuccessStatusCode);
        Assert.True(stopwatch.ElapsedMilliseconds < 500, 
            $"Health check took {stopwatch.ElapsedMilliseconds}ms, expected < 500ms");
    }

    [Fact]
    public async Task MultipleConcurrentRequests_ShouldHandleGracefully_WithoutHangfire()
    {
        // Arrange
        const int concurrentRequests = 10;
        var tasks = new List<Task<HttpResponseMessage>>();
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Send multiple concurrent requests
        for (int i = 0; i < concurrentRequests; i++)
        {
            tasks.Add(_client.GetAsync("/health"));
        }
        
        var responses = await Task.WhenAll(tasks);
        stopwatch.Stop();
        
        // Assert
        Assert.All(responses, response => Assert.True(response.IsSuccessStatusCode));
        Assert.True(stopwatch.ElapsedMilliseconds < 2000, 
            $"Concurrent requests took {stopwatch.ElapsedMilliseconds}ms, expected < 2000ms");
    }

    [Fact]
    public async Task Authentication_ShouldPerformWell_WithoutHangfire()
    {
        // Arrange
        var registerRequest = new
        {
            Email = $"perf-test-{Guid.NewGuid()}@example.com",
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            FirstName = "Performance",
            LastName = "Test",
            OrganizationName = "PerfTest Org",
            OrganizationDomain = $"perftest-{Guid.NewGuid()}.com"
        };

        var registerContent = new StringContent(
            JsonSerializer.Serialize(registerRequest),
            Encoding.UTF8,
            "application/json");

        var stopwatch = Stopwatch.StartNew();
        
        // Act - Register user
        var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        stopwatch.Stop();
        
        // Assert
        Assert.True(registerResponse.IsSuccessStatusCode);
        Assert.True(stopwatch.ElapsedMilliseconds < 3000, 
            $"User registration took {stopwatch.ElapsedMilliseconds}ms, expected < 3000ms");
    }

    [Fact]
    public async Task DatabaseOperations_ShouldMaintainPerformance_WithoutHangfire()
    {
        // Arrange
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Test database operations through API
        var healthResponse = await _client.GetAsync("/health");
        var readyResponse = await _client.GetAsync("/health/ready");
        var liveResponse = await _client.GetAsync("/health/live");
        
        stopwatch.Stop();
        
        // Assert
        Assert.True(healthResponse.IsSuccessStatusCode);
        Assert.True(readyResponse.IsSuccessStatusCode);
        Assert.True(liveResponse.IsSuccessStatusCode);
        Assert.True(stopwatch.ElapsedMilliseconds < 1000, 
            $"Database operations took {stopwatch.ElapsedMilliseconds}ms, expected < 1000ms");
    }

    [Fact]
    public async Task MemoryUsage_ShouldRemainStable_WithoutHangfire()
    {
        // Arrange
        var initialMemory = GC.GetTotalMemory(false);
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Perform multiple operations
        for (int i = 0; i < 50; i++)
        {
            var response = await _client.GetAsync("/health");
            Assert.True(response.IsSuccessStatusCode);
        }
        
        stopwatch.Stop();
        var finalMemory = GC.GetTotalMemory(true);
        var memoryIncrease = finalMemory - initialMemory;
        
        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds < 5000, 
            $"Operations took {stopwatch.ElapsedMilliseconds}ms, expected < 5000ms");
        Assert.True(memoryIncrease < 10 * 1024 * 1024, // 10MB
            $"Memory increased by {memoryIncrease / 1024 / 1024}MB, expected < 10MB");
    }

    [Fact]
    public void ConfigurationLoading_ShouldBeFast_WithoutHangfire()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Access configuration values
        var hangfireEnabled = configuration.GetValue<bool>("Hangfire:Enabled");
        var hangfireDisabled = configuration.GetValue<bool>("Hangfire:DisableForTesting");
        var skipConnection = configuration.GetValue<bool>("Hangfire:SkipDatabaseConnection");
        var environment = configuration.GetValue<string>("Environment");
        
        stopwatch.Stop();
        
        // Assert
        Assert.False(hangfireEnabled);
        Assert.True(hangfireDisabled);
        Assert.True(skipConnection);
        Assert.Equal("Testing", environment);
        Assert.True(stopwatch.ElapsedMilliseconds < 100, 
            $"Configuration access took {stopwatch.ElapsedMilliseconds}ms, expected < 100ms");
    }

    [Fact]
    public void ServiceResolution_ShouldBeFast_WithoutHangfire()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Resolve services
        var tenantContext = scope.ServiceProvider.GetService<ITenantContext>();
        var currentUserService = scope.ServiceProvider.GetService<ICurrentUserService>();
        var jwtService = scope.ServiceProvider.GetService<IJwtService>();
        var authService = scope.ServiceProvider.GetService<IAuthService>();
        
        stopwatch.Stop();
        
        // Assert
        Assert.NotNull(tenantContext);
        Assert.NotNull(currentUserService);
        Assert.NotNull(jwtService);
        Assert.NotNull(authService);
        Assert.True(stopwatch.ElapsedMilliseconds < 50, 
            $"Service resolution took {stopwatch.ElapsedMilliseconds}ms, expected < 50ms");
    }

    [Fact]
    public async Task ErrorHandling_ShouldWorkCorrectly_WithoutHangfire()
    {
        // Arrange
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Test error handling
        var notFoundResponse = await _client.GetAsync("/api/nonexistent");
        var badRequestResponse = await _client.PostAsync("/api/auth/login", 
            new StringContent("invalid json", Encoding.UTF8, "application/json"));
        
        stopwatch.Stop();
        
        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, notFoundResponse.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, badRequestResponse.StatusCode);
        Assert.True(stopwatch.ElapsedMilliseconds < 1000, 
            $"Error handling took {stopwatch.ElapsedMilliseconds}ms, expected < 1000ms");
    }

    [Fact]
    public async Task CORS_ShouldWorkCorrectly_WithoutHangfire()
    {
        // Arrange
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Test CORS
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/leads");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "Content-Type");
        
        var response = await _client.SendAsync(request);
        stopwatch.Stop();
        
        // Assert
        Assert.True(response.IsSuccessStatusCode);
        Assert.True(stopwatch.ElapsedMilliseconds < 500, 
            $"CORS handling took {stopwatch.ElapsedMilliseconds}ms, expected < 500ms");
    }

    [Fact]
    public void Logging_ShouldWorkCorrectly_WithoutHangfire()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<PerformanceWithoutHangfireIntegrationTests>>();
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Test logging
        logger.LogInformation("Performance test logging without Hangfire");
        logger.LogWarning("Performance test warning without Hangfire");
        logger.LogError("Performance test error without Hangfire");
        
        stopwatch.Stop();
        
        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds < 100, 
            $"Logging took {stopwatch.ElapsedMilliseconds}ms, expected < 100ms");
    }
}
