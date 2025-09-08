using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;
using LeadTracker.IntegrationTests;
using System.Net.Http.Json;
using System.Net;
using Xunit;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LeadTracker.IntegrationTests.Controllers;

public class LeadsControllerIntegrationTests : AuthenticatedControllerTestBase
{
    public LeadsControllerIntegrationTests(TestWebApplicationFactory factory) : base(factory)
    {
    }

    /// <summary>
    /// Gets the first stage from the test organization
    /// </summary>
    private async Task<Guid> GetTestOrganizationStageIdAsync(Guid organizationId)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        var stage = await context.Stages
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Order)
            .FirstAsync();
            
        return stage.Id;
    }

    [Fact]
    public async Task GetLeads_ShouldReturnPaginatedLeads_WhenCalled()
    {
        // Arrange
        var query = new LeadQueryDto
        {
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var response = await GetAsync($"/api/leads?pageNumber={query.PageNumber}&pageSize={query.PageSize}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await DeserializeResponseAsync<LeadListResponseDto>(response);

        Assert.NotNull(result);
        Assert.True(result.Leads.Count <= query.PageSize);
        Assert.True(result.TotalCount >= 0);
        Assert.Equal(query.PageNumber, result.PageNumber);
        Assert.Equal(query.PageSize, result.PageSize);
    }

    [Fact]
    public async Task GetLeads_ShouldFilterBySearchTerm_WhenProvided()
    {
        // Arrange
        var searchTerm = "TechCorp"; // From our demo data
        var query = new LeadQueryDto
        {
            PageNumber = 1,
            PageSize = 10,
            SearchTerm = searchTerm
        };

        // Act
        var response = await GetAsync($"/api/leads?pageNumber={query.PageNumber}&pageSize={query.PageSize}&searchTerm={searchTerm}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await DeserializeResponseAsync<LeadListResponseDto>(response);

        Assert.NotNull(result);
        // All returned leads should contain the search term in at least one field
        Assert.All(result.Leads, lead =>
        {
            var containsSearchTerm = 
                (lead.Title?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (lead.FirstName?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (lead.LastName?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (lead.Email?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (lead.Company?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (lead.Notes?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false);
            
            Assert.True(containsSearchTerm, $"Lead {lead.Id} should contain search term '{searchTerm}'");
        });
    }

    [Fact]
    public async Task GetLeads_ShouldSortByTitle_WhenSortByTitle()
    {
        // Arrange
        var query = new LeadQueryDto
        {
            PageNumber = 1,
            PageSize = 10,
            SortBy = "title",
            SortDirection = "asc"
        };

        // Act
        var response = await GetAsync($"/api/leads?pageNumber={query.PageNumber}&pageSize={query.PageSize}&sortBy={query.SortBy}&sortDirection={query.SortDirection}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await DeserializeResponseAsync<LeadListResponseDto>(response);

        Assert.NotNull(result);
        if (result.Leads.Count > 1)
        {
            for (int i = 0; i < result.Leads.Count - 1; i++)
            {
                Assert.True(string.Compare(result.Leads[i].Title, result.Leads[i + 1].Title, StringComparison.OrdinalIgnoreCase) <= 0,
                    $"Leads should be sorted by title in ascending order. Found: '{result.Leads[i].Title}' after '{result.Leads[i + 1].Title}'");
            }
        }
    }

    [Fact]
    public async Task GetLead_ShouldReturnLead_WhenValidId()
    {
        // Arrange - Get a lead first
        var leadsResponse = await _client.GetAsync("/api/leads?pageNumber=1&pageSize=1");
        var leadsContent = await leadsResponse.Content.ReadAsStringAsync();
        var leadsResult = JsonSerializer.Deserialize<LeadListResponseDto>(leadsContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (leadsResult?.Leads.Count > 0)
        {
            var leadId = leadsResult.Leads[0].Id;

        // Act
        var response = await GetAsync($"/api/leads/{leadId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await DeserializeResponseAsync<LeadResponseDto>(response);

            Assert.NotNull(result);
            Assert.Equal(leadId, result.Id);
            Assert.NotNull(result.Title);
        }
    }

    [Fact]
    public async Task GetLead_ShouldReturnNotFound_WhenInvalidId()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var response = await GetAsync($"/api/leads/{invalidId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateLead_ShouldReturnCreatedLead_WhenValidData()
    {
        // Arrange
        var stageId = await GetTestOrganizationStageIdAsync(_organizationId);
        var createDto = new CreateLeadDto
        {
            Title = "Test Lead - Integration Test",
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@test.com",
            PhoneNumber = "+15551234567",
            Company = "Test Company",
            JobTitle = "Test Manager",
            EstimatedValue = 50000,
            Probability = 75,
            ExpectedCloseDate = DateTime.UtcNow.AddDays(30),
            Notes = "Test lead created during integration test",
            Source = "Test",
            StageId = stageId // Use stage from test organization
        };

        // Act
        var response = await PostAsJsonAsync("/api/leads", createDto);

        // Debug: Log response details
        var responseContent = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Response Status: {response.StatusCode}");
        Console.WriteLine($"Response Content: {responseContent}");

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await DeserializeResponseAsync<LeadResponseDto>(response);

        Assert.NotNull(result);
        Assert.Equal(createDto.Title, result.Title);
        Assert.Equal(createDto.FirstName, result.FirstName);
        Assert.Equal(createDto.LastName, result.LastName);
        Assert.Equal(createDto.Email, result.Email);
        Assert.Equal(createDto.PhoneNumber, result.PhoneNumber);
        Assert.Equal(createDto.Company, result.Company);
        Assert.Equal(createDto.JobTitle, result.JobTitle);
        Assert.Equal(createDto.EstimatedValue, result.EstimatedValue);
        Assert.Equal(createDto.Probability, result.Probability);
        Assert.Equal(createDto.Notes, result.Notes);
        Assert.Equal(createDto.Source, result.Source);
        Assert.Equal(createDto.StageId, result.StageId);
        Assert.NotNull(result.Id);
        Assert.True(result.CreatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task CreateLead_ShouldReturnBadRequest_WhenInvalidData()
    {
        // Arrange
        var createDto = new CreateLeadDto
        {
            Title = "", // Invalid: empty title
            Email = "invalid-email", // Invalid: invalid email format
            PhoneNumber = "invalid-phone", // Invalid: invalid phone format
            Probability = 150 // Invalid: probability > 100
        };

        // Act
        var response = await PostAsJsonAsync("/api/leads", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateLead_ShouldReturnUpdatedLead_WhenValidData()
    {
        // Arrange - Create a lead first
        var stageId = await GetTestOrganizationStageIdAsync(_organizationId);
        var createDto = new CreateLeadDto
        {
            Title = "Test Lead for Update",
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@test.com",
            PhoneNumber = "+15550123456",
            Company = "Test Company",
            JobTitle = "Test Manager",
            EstimatedValue = 25000,
            Probability = 50,
            StageId = stageId
        };

        var createResponse = await _client.PostAsJsonAsync("/api/leads", createDto);
        var createdLead = await DeserializeResponseAsync<LeadResponseDto>(createResponse);

        Assert.NotNull(createdLead);

        // Update data
        var updateStageId = await GetTestOrganizationStageIdAsync(_organizationId);
        var updateDto = new UpdateLeadDto
        {
            Title = "Updated Test Lead",
            FirstName = "Jane",
            LastName = "Smith-Updated",
            Email = "jane.smith.updated@test.com",
            PhoneNumber = "+15551234567",
            Company = "Updated Test Company",
            JobTitle = "Senior Test Manager",
            EstimatedValue = 75000,
            Probability = 85,
            Notes = "Updated notes",
            Status = "Open",
            StageId = updateStageId
        };

        // Act
        var response = await PutAsJsonAsync($"/api/leads/{createdLead.Id}", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await DeserializeResponseAsync<LeadResponseDto>(response);

        Assert.NotNull(result);
        Assert.Equal(updateDto.Title, result.Title);
        Assert.Equal(updateDto.FirstName, result.FirstName);
        Assert.Equal(updateDto.LastName, result.LastName);
        Assert.Equal(updateDto.Email, result.Email);
        Assert.Equal(updateDto.PhoneNumber, result.PhoneNumber);
        Assert.Equal(updateDto.Company, result.Company);
        Assert.Equal(updateDto.JobTitle, result.JobTitle);
        Assert.Equal(updateDto.EstimatedValue, result.EstimatedValue);
        Assert.Equal(updateDto.Probability, result.Probability);
        Assert.Equal(updateDto.Notes, result.Notes);
        Assert.Equal(updateDto.Status, result.Status);
        Assert.Equal(updateDto.StageId, result.StageId);
        Assert.True(result.UpdatedAt > result.CreatedAt);
    }

    [Fact]
    public async Task UpdateLead_ShouldReturnNotFound_WhenInvalidId()
    {
        // Arrange
        var invalidId = Guid.NewGuid();
        var stageId = await GetTestOrganizationStageIdAsync(_organizationId);
        var updateDto = new UpdateLeadDto
        {
            Title = "Updated Lead",
            StageId = stageId
        };

        // Act
        var response = await PutAsJsonAsync($"/api/leads/{invalidId}", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteLead_ShouldReturnNoContent_WhenValidId()
    {
        // Arrange - Create a lead first
        var stageId = await GetTestOrganizationStageIdAsync(_organizationId);
        var createDto = new CreateLeadDto
        {
            Title = "Test Lead for Deletion",
            FirstName = "Delete",
            LastName = "Test",
            Email = "delete.test@test.com",
            PhoneNumber = "+15551234568",
            Company = "Delete Test Company",
            JobTitle = "Delete Manager",
            EstimatedValue = 10000,
            Probability = 25,
            StageId = stageId
        };

        var createResponse = await _client.PostAsJsonAsync("/api/leads", createDto);
        var createdLead = await DeserializeResponseAsync<LeadResponseDto>(createResponse);

        Assert.NotNull(createdLead);

        // Act
        var response = await DeleteAsync($"/api/leads/{createdLead.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the lead is actually deleted
        var getResponse = await GetAsync($"/api/leads/{createdLead.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteLead_ShouldReturnNotFound_WhenInvalidId()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var response = await DeleteAsync($"/api/leads/{invalidId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetLeadStats_ShouldReturnStatistics_WhenCalled()
    {
        // Act
        var response = await GetAsync("/api/leads/stats");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await DeserializeResponseAsync<LeadStatsDto>(response);

        Assert.NotNull(result);
        Assert.True(result.TotalLeads >= 0);
        Assert.True(result.OpenLeads >= 0);
        Assert.True(result.WonLeads >= 0);
        Assert.True(result.LostLeads >= 0);
        Assert.True(result.TotalValue >= 0);
        Assert.True(result.WonValue >= 0);
        Assert.True(result.AverageDealSize >= 0);
        Assert.True(result.WinRate >= 0);
        Assert.True(result.WinRate <= 100);
    }
}
