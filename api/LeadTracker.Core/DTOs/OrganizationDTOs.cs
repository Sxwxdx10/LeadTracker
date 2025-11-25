using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for organization response
/// </summary>
public class OrganizationResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Domain { get; set; } = string.Empty;
    public string? TimeZone { get; set; }
    public string? Currency { get; set; }
    public bool IsActive { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Contact information
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Website { get; set; }
    
    // Address
    public string? AddressStreet { get; set; }
    public string? AddressCity { get; set; }
    public string? AddressState { get; set; }
    public string? AddressPostalCode { get; set; }
    public string? AddressCountry { get; set; }
    
    // Branding
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
}

/// <summary>
/// DTO for updating organization
/// </summary>
public class UpdateOrganizationDto
{
    [MaxLength(200)]
    public string? Name { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(50)]
    public string? TimeZone { get; set; }
    
    [MaxLength(5)]
    public string? Currency { get; set; }
    
    [MaxLength(255)]
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    [MaxLength(20)]
    public string? ContactPhone { get; set; }
    
    [MaxLength(255)]
    public string? Website { get; set; }
    
    // Address
    [MaxLength(200)]
    public string? AddressStreet { get; set; }
    
    [MaxLength(100)]
    public string? AddressCity { get; set; }
    
    [MaxLength(50)]
    public string? AddressState { get; set; }
    
    [MaxLength(20)]
    public string? AddressPostalCode { get; set; }
    
    [MaxLength(100)]
    public string? AddressCountry { get; set; }
    
    // Branding
    [MaxLength(7)]
    public string? PrimaryColor { get; set; }
    
    [MaxLength(7)]
    public string? SecondaryColor { get; set; }
}

/// <summary>
/// DTO for logo upload response
/// </summary>
public class OrganizationLogoResponseDto
{
    public string LogoUrl { get; set; } = string.Empty;
}

