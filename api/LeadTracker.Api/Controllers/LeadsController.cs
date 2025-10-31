using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing leads
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;
    private readonly ILogger<LeadsController> _logger;
    private readonly LeadTrackerDbContext _context;

    public LeadsController(ILeadService leadService, ILogger<LeadsController> logger, LeadTrackerDbContext context)
    {
        _leadService = leadService;
        _logger = logger;
        _context = context;
    }


    /// <summary>
    /// Get search suggestions for full-text search
    /// </summary>
    /// <param name="query">Search query</param>
    /// <param name="limit">Maximum number of suggestions</param>
    /// <returns>List of search suggestions</returns>
    [HttpGet("search-suggestions")]
    [ProducesResponseType(typeof(List<SearchSuggestionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSearchSuggestions([FromQuery] string query, [FromQuery] int limit = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new List<SearchSuggestionDto>());
            }

            if (limit < 1 || limit > 50) limit = 10;

            var suggestions = await _leadService.GetSearchSuggestionsAsync(query, limit);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search suggestions for query: {Query}", query);
            return StatusCode(500, "An error occurred while getting search suggestions");
        }
    }

    /// <summary>
    /// Get leads with pagination, filtering, and sorting
    /// </summary>
    /// <param name="query">Query parameters for filtering and pagination</param>
    /// <returns>Paginated list of leads</returns>
    [HttpGet]
    [ProducesResponseType(typeof(LeadListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeads([FromQuery] LeadQueryDto query)
    {
        try
        {
            // Validate pagination parameters
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1 || query.PageSize > 1000) query.PageSize = 10;

            var result = await _leadService.GetLeadsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leads");
            return StatusCode(500, new { message = "An error occurred while retrieving leads" });
        }
    }

    /// <summary>
    /// Get a specific lead by ID
    /// </summary>
    /// <param name="id">Lead ID</param>
    /// <returns>Lead details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(LeadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLead(Guid id)
    {
        try
        {
            var lead = await _leadService.GetLeadByIdAsync(id);
            if (lead == null)
            {
                return NotFound();
            }

            return Ok(lead);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving lead {LeadId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the lead" });
        }
    }

    /// <summary>
    /// Create a new lead
    /// </summary>
    /// <param name="createDto">Lead creation data</param>
    /// <returns>Created lead</returns>
    [HttpPost]
    [ProducesResponseType(typeof(LeadResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var lead = await _leadService.CreateLeadAsync(createDto);
            return CreatedAtAction(nameof(GetLead), new { id = lead.Id }, lead);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating lead");
            return StatusCode(500, new { message = "An error occurred while creating the lead" });
        }
    }

    /// <summary>
    /// Update an existing lead
    /// </summary>
    /// <param name="id">Lead ID</param>
    /// <param name="updateDto">Lead update data</param>
    /// <returns>Updated lead</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(LeadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var lead = await _leadService.UpdateLeadAsync(id, updateDto);
            if (lead == null)
            {
                return NotFound();
            }

            return Ok(lead);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating lead {LeadId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the lead" });
        }
    }

    /// <summary>
    /// Delete a lead
    /// </summary>
    /// <param name="id">Lead ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteLead(Guid id)
    {
        try
        {
            var deleted = await _leadService.DeleteLeadAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting lead {LeadId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the lead" });
        }
    }

    /// <summary>
    /// Get lead statistics for the current organization
    /// </summary>
    /// <returns>Lead statistics</returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(LeadStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLeadStats()
    {
        try
        {
            var stats = await _leadService.GetLeadStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving lead statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving lead statistics" });
        }
    }

    /// <summary>
    /// Search leads with advanced filtering and full-text search
    /// </summary>
    /// <param name="request">Search criteria</param>
    /// <returns>Search results with pagination</returns>
    [HttpPost("search")]
    [ProducesResponseType(typeof(LeadSearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SearchLeads([FromBody] LeadSearchRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate pagination parameters
            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1 || request.PageSize > 100) request.PageSize = 20;

            var result = await _leadService.SearchLeadsAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching leads");
            return StatusCode(500, new { message = "An error occurred while searching leads" });
        }
    }

    /// <summary>
    /// Get autocomplete suggestions for search
    /// </summary>
    /// <param name="request">Autocomplete request</param>
    /// <returns>Autocomplete suggestions</returns>
    [HttpPost("autocomplete")]
    [ProducesResponseType(typeof(AutocompleteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAutocompleteSuggestions([FromBody] AutocompleteRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _leadService.GetAutocompleteSuggestionsAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting autocomplete suggestions");
            return StatusCode(500, new { message = "An error occurred while getting autocomplete suggestions" });
        }
    }

    /// <summary>
    /// Get available filter options for search
    /// </summary>
    /// <param name="baseRequest">Optional base search criteria to filter options</param>
    /// <returns>Available filter options</returns>
    [HttpPost("filter-options")]
    [ProducesResponseType(typeof(SearchFilterOptions), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetFilterOptions([FromBody] LeadSearchRequest? baseRequest = null)
    {
        try
        {
            var result = await _leadService.GetFilterOptionsAsync(baseRequest);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting filter options");
            return StatusCode(500, new { message = "An error occurred while getting filter options" });
        }
    }

    /// <summary>
    /// Save a search filter for future use
    /// </summary>
    /// <param name="request">Filter save request</param>
    /// <returns>Saved filter</returns>
    [HttpPost("filters")]
    [ProducesResponseType(typeof(LeadTracker.Core.DTOs.SavedSearchFilter), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SaveSearchFilter([FromBody] SaveSearchFilterRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _leadService.SaveSearchFilterAsync(request);
            return CreatedAtAction(nameof(GetSavedSearchFilters), new { }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving search filter");
            return StatusCode(500, new { message = "An error occurred while saving the search filter" });
        }
    }

    /// <summary>
    /// Get saved search filters for the current user
    /// </summary>
    /// <returns>List of saved filters</returns>
    [HttpGet("filters")]
    [ProducesResponseType(typeof(List<LeadTracker.Core.DTOs.SavedSearchFilter>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSavedSearchFilters()
    {
        try
        {
            var result = await _leadService.GetSavedSearchFiltersAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting saved search filters");
            return StatusCode(500, new { message = "An error occurred while getting saved search filters" });
        }
    }

    /// <summary>
    /// Update usage count for a saved filter
    /// </summary>
    /// <param name="filterId">Filter ID</param>
    /// <returns>No content</returns>
    [HttpPost("filters/{filterId}/use")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateFilterUsage(Guid filterId)
    {
        try
        {
            await _leadService.UpdateFilterUsageAsync(filterId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating filter usage for {FilterId}", filterId);
            return StatusCode(500, new { message = "An error occurred while updating filter usage" });
        }
    }

    /// <summary>
    /// Delete a saved search filter
    /// </summary>
    /// <param name="filterId">Filter ID</param>
    /// <returns>No content</returns>
    [HttpDelete("filters/{filterId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteSavedSearchFilter(Guid filterId)
    {
        try
        {
            var deleted = await _leadService.DeleteSavedSearchFilterAsync(filterId);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting saved search filter {FilterId}", filterId);
            return StatusCode(500, new { message = "An error occurred while deleting the search filter" });
        }
    }

    /// <summary>
    /// Test endpoint for seeding
    /// </summary>
    /// <returns>Test message</returns>
    [HttpGet("test-seeding")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult SeedTest()
    {
        return Ok(new { message = "Seeding test endpoint is working from LeadsController!" });
    }

    /// <summary>
    /// Seed test leads for the current organization
    /// </summary>
    /// <param name="count">Number of leads to create (default: 20)</param>
    /// <returns>Result of the seeding operation</returns>
    [HttpPost("seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SeedLeads([FromQuery] int count = 20)
    {
        try
        {
            // Get organization ID from current user context
            var organizationIdClaim = User.FindFirst("org_id");
            if (organizationIdClaim == null || !Guid.TryParse(organizationIdClaim.Value, out var organizationId))
            {
                return BadRequest("Unable to determine organization context");
            }

            _logger.LogInformation("Starting to seed {Count} test leads for organization {OrganizationId}", count, organizationId);

            // Get existing stages for the organization
            var stages = await _context.Stages
                .Where(s => s.OrganizationId == organizationId)
                .OrderBy(s => s.Order)
                .ToListAsync();

            if (!stages.Any())
            {
                _logger.LogWarning("No stages found for organization {OrganizationId}. Creating default stages first.", organizationId);
                
                // Create default stages
                var defaultStages = new[]
                {
                    new Stage { Id = Guid.NewGuid(), OrganizationId = organizationId, Name = "Nouveau", Description = "Lead nouvellement créé", Color = "#3B82F6", Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Stage { Id = Guid.NewGuid(), OrganizationId = organizationId, Name = "Qualifié", Description = "Lead qualifié et intéressé", Color = "#10B981", Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Stage { Id = Guid.NewGuid(), OrganizationId = organizationId, Name = "Proposition", Description = "Proposition envoyée", Color = "#F59E0B", Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Stage { Id = Guid.NewGuid(), OrganizationId = organizationId, Name = "Négociation", Description = "En cours de négociation", Color = "#8B5CF6", Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Stage { Id = Guid.NewGuid(), OrganizationId = organizationId, Name = "Fermé - Gagné", Description = "Deal conclu avec succès", Color = "#059669", Order = 5, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Stage { Id = Guid.NewGuid(), OrganizationId = organizationId, Name = "Fermé - Perdu", Description = "Deal perdu", Color = "#DC2626", Order = 6, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                };

                _context.Stages.AddRange(defaultStages);
                await _context.SaveChangesAsync();
                stages = defaultStages.ToList();
            }

            // Get existing users for assignment
            var users = await _context.BusinessUsers
                .Where(u => u.OrganizationId == organizationId)
                .ToListAsync();

            // Generate test leads
            var leads = GenerateTestLeads(organizationId, count, stages, users);
            
            _context.Leads.AddRange(leads);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully seeded {Count} test leads for organization {OrganizationId}", leads.Count, organizationId);

            return Ok(new
            {
                message = $"Successfully seeded {leads.Count} test leads",
                leadsCreated = leads.Count,
                organizationId = organizationId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding leads");
            return StatusCode(500, new { message = "An error occurred while seeding leads", error = ex.Message });
        }
    }

    private List<Lead> GenerateTestLeads(Guid organizationId, int count, List<Stage> stages, List<User> users)
    {
        var random = new Random();
        var leads = new List<Lead>();

        // Sample data for realistic leads
        var firstNames = new[] { "Jean", "Marie", "Pierre", "Sophie", "Paul", "Julie", "Marc", "Claire", "Thomas", "Nathalie", "David", "Isabelle", "Nicolas", "Céline", "Antoine", "Valérie", "Julien", "Sandrine", "Fabien", "Caroline" };
        var lastNames = new[] { "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel" };
        var companies = new[] { "TechCorp", "InnovateLab", "Digital Solutions", "Future Systems", "Smart Technologies", "NextGen Corp", "Alpha Industries", "Beta Solutions", "Gamma Tech", "Delta Enterprises", "Epsilon Group", "Zeta Systems", "Theta Corp", "Lambda Labs", "Sigma Industries" };
        var jobTitles = new[] { "CEO", "CTO", "Directeur Marketing", "Responsable IT", "Chef de Projet", "Directeur Commercial", "Responsable Achats", "Directeur Général", "Responsable RH", "Directeur Financier" };
        var sources = new[] { "Site Web", "Réseaux Sociaux", "Recommandation", "Salon", "Email Marketing", "Téléphone", "LinkedIn", "Google Ads", "Partenaire", "Événement" };
        var statuses = new[] { "Open", "Won", "Lost" };

        for (int i = 0; i < count; i++)
        {
            var firstName = firstNames[random.Next(firstNames.Length)];
            var lastName = lastNames[random.Next(lastNames.Length)];
            var company = companies[random.Next(companies.Length)];
            var jobTitle = jobTitles[random.Next(jobTitles.Length)];
            var source = sources[random.Next(sources.Length)];
            var status = statuses[random.Next(statuses.Length)];
            var stage = stages[random.Next(stages.Count)];
            var assignedUser = users.Any() ? users[random.Next(users.Count)] : null;

            var lead = new Lead
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Title = $"{firstName} {lastName} - {company}",
                FirstName = firstName,
                LastName = lastName,
                Email = $"{firstName.ToLower()}.{lastName.ToLower()}@{company.ToLower().Replace(" ", "")}.com",
                PhoneNumber = $"+331{random.Next(10000000, 99999999)}",
                Company = company,
                JobTitle = jobTitle,
                EstimatedValue = random.Next(5000, 100000),
                Probability = random.Next(10, 95),
                ExpectedCloseDate = DateTime.UtcNow.AddDays(random.Next(30, 180)),
                Notes = GenerateRandomNotes(random),
                Source = source,
                Status = status,
                IsActive = true,
                LastContactedAt = DateTime.UtcNow.AddDays(-random.Next(0, 30)),
                StageId = stage.Id,
                AssignedUserId = assignedUser?.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 90)),
                UpdatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 7))
            };

            leads.Add(lead);
        }

        return leads;
    }

    private string GenerateRandomNotes(Random random)
    {
        var noteTemplates = new[]
        {
            "Lead très intéressé par notre solution. Rendez-vous prévu la semaine prochaine.",
            "Contact initial positif. Envoi de documentation technique demandé.",
            "Budget confirmé pour Q2. Décision attendue dans 2 semaines.",
            "Concurrent principal identifié. Proposition personnalisée en cours.",
            "Décideur final identifié. Processus d'achat complexe avec comité.",
            "Urgence côté client. Accélération du processus possible.",
            "Besoin technique spécifique. Démonstration personnalisée nécessaire.",
            "Prix sensible. Négociation en cours sur les conditions.",
            "Référence client disponible. Témoignage positif à organiser.",
            "Processus d'achat long. Suivi régulier nécessaire."
        };

        return noteTemplates[random.Next(noteTemplates.Length)];
    }
}
