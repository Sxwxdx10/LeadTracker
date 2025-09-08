using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Hangfire;
using LeadTracker.IntegrationTests;
using Xunit;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Integration tests to verify that Hangfire is completely disabled in testing environment
/// </summary>
public class HangfireDisabledIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public HangfireDisabledIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public void Hangfire_ShouldNotBeRegistered_WhenInTestingEnvironment()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        
        // Assert - Hangfire services should not be registered
        var hangfireStorage = scope.ServiceProvider.GetService<JobStorage>();
        var hangfireClient = scope.ServiceProvider.GetService<IBackgroundJobClient>();
        
        Assert.Null(hangfireStorage);
        Assert.Null(hangfireClient);
    }

    [Fact]
    public void Configuration_ShouldHaveHangfireDisabled_WhenInTestingEnvironment()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        
        // Act & Assert
        var isHangfireEnabled = configuration.GetValue<bool>("Hangfire:Enabled");
        var isHangfireDisabledForTesting = configuration.GetValue<bool>("Hangfire:DisableForTesting");
        var skipDatabaseConnection = configuration.GetValue<bool>("Hangfire:SkipDatabaseConnection");
        var environment = configuration.GetValue<string>("Environment");
        
        Assert.False(isHangfireEnabled);
        Assert.True(isHangfireDisabledForTesting);
        Assert.True(skipDatabaseConnection);
        Assert.Equal("Testing", environment);
    }

    [Fact]
    public async Task HangfireDashboard_ShouldNotBeAccessible_WhenInTestingEnvironment()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/hangfire");
        
        // Assert - Dashboard should not be accessible (404 or redirect)
        Assert.True(response.StatusCode == System.Net.HttpStatusCode.NotFound || 
                   response.StatusCode == System.Net.HttpStatusCode.Redirect);
    }

    [Fact]
    public void EnvironmentVariables_ShouldBeSetCorrectly_ForTesting()
    {
        // Arrange & Act
        var aspnetCoreEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        var disableHangfire = Environment.GetEnvironmentVariable("DISABLE_HANGFIRE");
        
        // Assert
        Assert.Equal("Testing", aspnetCoreEnvironment);
        Assert.Equal("true", disableHangfire);
    }

    [Fact]
    public void Application_ShouldStartSuccessfully_WithoutHangfireConnection()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        
        // Assert - Application should start without requiring Hangfire database connection
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        Assert.NotNull(connectionString);
        
        // Verify that Hangfire is not trying to use the connection string
        var hangfireConnectionString = configuration.GetConnectionString("HangfireConnection");
        Assert.Null(hangfireConnectionString);
    }
}
