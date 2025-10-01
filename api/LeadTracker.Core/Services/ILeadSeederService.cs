using LeadTracker.Core.Entities;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service for seeding test data for leads
/// </summary>
public interface ILeadSeederService
{
    /// <summary>
    /// Seeds test leads for the specified organization
    /// </summary>
    /// <param name="organizationId">The organization ID to seed leads for</param>
    /// <param name="count">Number of leads to create (default: 20)</param>
    /// <returns>Number of leads created</returns>
    Task<int> SeedTestLeadsAsync(Guid organizationId, int count = 20);
    
    /// <summary>
    /// Seeds default stages for the specified organization
    /// </summary>
    /// <param name="organizationId">The organization ID to seed stages for</param>
    /// <returns>Number of stages created</returns>
    Task<int> SeedDefaultStagesAsync(Guid organizationId);
    
    /// <summary>
    /// Seeds test users for the specified organization
    /// </summary>
    /// <param name="organizationId">The organization ID to seed users for</param>
    /// <returns>Number of users created</returns>
    Task<int> SeedTestUsersAsync(Guid organizationId);
}
