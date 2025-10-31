using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service interface for organization management
/// </summary>
public interface IOrganizationService
{
    /// <summary>
    /// Get the current organization from tenant context
    /// </summary>
    Task<OrganizationResponseDto> GetCurrentOrganizationAsync();
    
    /// <summary>
    /// Update organization information
    /// </summary>
    Task<OrganizationResponseDto> UpdateOrganizationAsync(UpdateOrganizationDto updateDto);
    
    /// <summary>
    /// Upload and save organization logo
    /// </summary>
    Task<OrganizationLogoResponseDto> UploadLogoAsync(Stream logoStream, string fileName, string contentType);
}

