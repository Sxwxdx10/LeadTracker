using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using LeadTracker.Core.Services;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using LeadTracker.Core.Models;
using LeadTracker.IntegrationTests.Services;
using System.Net.Http.Json;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Base class for authenticated controller integration tests
/// </summary>
public abstract class AuthenticatedControllerTestBase : IClassFixture<TestWebApplicationFactory>
{
    protected readonly TestWebApplicationFactory _factory;
    protected readonly HttpClient _client;
    protected readonly string _authToken;
    protected readonly Guid _organizationId;
    protected readonly Guid _userId;

    protected AuthenticatedControllerTestBase(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        
        // Set up authentication
        (_authToken, _organizationId, _userId) = SetupAuthenticationAsync().GetAwaiter().GetResult();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authToken);
        _client.DefaultRequestHeaders.Add("X-Org-Id", _organizationId.ToString());
    }

    private async Task<(string token, Guid organizationId, Guid userId)> SetupAuthenticationAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();

        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Get the first organization and user
        var organization = await context.Organizations.FirstAsync();
        var user = await context.BusinessUsers.FirstAsync();

        // Create a test user account with a unique organization domain and email
        var uniqueId = Guid.NewGuid().ToString("N")[..8]; // Short unique ID
        var testDomain = $"test-leadtracker-{uniqueId}.com";
        var testEmail = $"test-{uniqueId}@leadtracker.com";
        var registerDto = new RegisterRequest
        {
            Email = testEmail,
            Password = "TestPassword123!",
            ConfirmPassword = "TestPassword123!",
            FirstName = "Test",
            LastName = "User",
            OrganizationName = $"Test Organization {uniqueId}",
            OrganizationDomain = testDomain // Use unique domain for test
        };

        try
        {
            var registerResult = await authService.RegisterAsync(registerDto);
            // Registration successful - use the newly created organization
            organization = await context.Organizations
                .FirstAsync(o => o.Domain == testDomain);
            
            // Create default stages for the test organization
            // Note: This would need to be implemented if stages are required for tests
        }
        catch (Exception ex)
        {
            // If user already exists, try to login instead
            if (ex.Message.Contains("User with this email already exists") || 
                ex.Message.Contains("Organization with this domain already exists"))
            {
                // Try to find existing user and organization
                organization = await context.Organizations
                    .FirstOrDefaultAsync(o => o.Domain == testDomain);
                
                if (organization == null)
                {
                    // Fallback to existing organization
                    organization = await context.Organizations.FirstAsync();
                }
                else
                {
                    // Ensure stages exist for the test organization
                    var existingStages = await context.Stages
                        .Where(s => s.OrganizationId == organization.Id)
                        .CountAsync();
                    
                    if (existingStages == 0)
                    {
                        // Note: This would need to be implemented if stages are required for tests
                    }
                }
            }
            else
            {
                throw new InvalidOperationException($"Failed to register test user: {ex.Message}");
            }
        }

        // Login to get token
        var loginDto = new LoginRequest
        {
            Email = testEmail,
            Password = "TestPassword123!",
            OrganizationDomain = organization.Domain // Use the actual domain from the organization
        };

        var loginResult = await authService.LoginAsync(loginDto);
        return (loginResult.AccessToken, organization.Id, loginResult.User.Id);
    }

    protected async Task<HttpResponseMessage> GetAsync(string requestUri)
    {
        return await _client.GetAsync(requestUri);
    }

    protected async Task<HttpResponseMessage> PostAsJsonAsync<T>(string requestUri, T value)
    {
        return await _client.PostAsJsonAsync(requestUri, value);
    }

    protected async Task<HttpResponseMessage> PutAsJsonAsync<T>(string requestUri, T value)
    {
        return await _client.PutAsJsonAsync(requestUri, value);
    }

    protected async Task<HttpResponseMessage> DeleteAsync(string requestUri)
    {
        return await _client.DeleteAsync(requestUri);
    }

    protected async Task<T?> DeserializeResponseAsync<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        if (string.IsNullOrEmpty(content))
            return default;


        return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        });
    }
}
