using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service implementation for organization management
/// </summary>
public class OrganizationService : IOrganizationService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<OrganizationService> _logger;
    private readonly string _uploadsBasePath;

    public OrganizationService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        ILogger<OrganizationService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _logger = logger;
        
        // Use relative path from application root or current directory
        _uploadsBasePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
    }

    public async Task<OrganizationResponseDto> GetCurrentOrganizationAsync()
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        var organization = await _context.GetOrganizationForCurrentTenant()
            .FirstOrDefaultAsync();

        if (organization == null)
        {
            throw new InvalidOperationException("Organization not found");
        }

        return MapToResponseDto(organization);
    }

    public async Task<OrganizationResponseDto> UpdateOrganizationAsync(UpdateOrganizationDto updateDto)
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        var organization = await _context.GetOrganizationForCurrentTenant()
            .FirstOrDefaultAsync();

        if (organization == null)
        {
            throw new InvalidOperationException("Organization not found");
        }

        // Update properties if provided
        if (!string.IsNullOrWhiteSpace(updateDto.Name))
            organization.Name = updateDto.Name;

        if (updateDto.Description != null)
            organization.Description = updateDto.Description;

        if (!string.IsNullOrWhiteSpace(updateDto.TimeZone))
            organization.TimeZone = updateDto.TimeZone;

        if (!string.IsNullOrWhiteSpace(updateDto.Currency))
            organization.Currency = updateDto.Currency;

        // Contact information
        if (updateDto.ContactEmail != null)
            organization.ContactEmail = updateDto.ContactEmail;

        if (updateDto.ContactPhone != null)
            organization.ContactPhone = updateDto.ContactPhone;

        if (updateDto.Website != null)
            organization.Website = updateDto.Website;

        // Address
        if (updateDto.AddressStreet != null)
            organization.AddressStreet = updateDto.AddressStreet;

        if (updateDto.AddressCity != null)
            organization.AddressCity = updateDto.AddressCity;

        if (updateDto.AddressState != null)
            organization.AddressState = updateDto.AddressState;

        if (updateDto.AddressPostalCode != null)
            organization.AddressPostalCode = updateDto.AddressPostalCode;

        if (updateDto.AddressCountry != null)
            organization.AddressCountry = updateDto.AddressCountry;

        // Branding
        if (updateDto.PrimaryColor != null)
            organization.PrimaryColor = updateDto.PrimaryColor;

        if (updateDto.SecondaryColor != null)
            organization.SecondaryColor = updateDto.SecondaryColor;

        organization.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Reload to get updated entity
        var updatedOrganization = await _context.GetOrganizationForCurrentTenant()
            .FirstAsync(o => o.Id == organization.Id);

        return MapToResponseDto(updatedOrganization);
    }

    public async Task<OrganizationLogoResponseDto> UploadLogoAsync(Stream logoStream, string fileName, string contentType)
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new InvalidOperationException("Organization context is not available");
        }

        // Validate file
        if (logoStream == null || logoStream.Length == 0)
        {
            throw new ArgumentException("No file provided");
        }

        var allowedExtensions = new[] { ".png", ".jpg", ".jpeg" };
        var allowedContentTypes = new[] { "image/png", "image/jpeg", "image/jpg" };
        
        var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            throw new ArgumentException("Only PNG and JPG files are allowed");
        }

        if (!string.IsNullOrEmpty(contentType) && !allowedContentTypes.Contains(contentType.ToLowerInvariant()))
        {
            throw new ArgumentException("Invalid file type");
        }

        var organization = await _context.GetOrganizationForCurrentTenant()
            .FirstOrDefaultAsync();

        if (organization == null)
        {
            throw new InvalidOperationException("Organization not found");
        }

        // Create uploads directory structure
        var uploadsDir = Path.Combine(_uploadsBasePath, "organizations", organizationId.Value.ToString());
        Directory.CreateDirectory(uploadsDir);

        // Delete old logo if exists
        if (!string.IsNullOrEmpty(organization.LogoPath))
        {
            var oldLogoPath = Path.Combine(_uploadsBasePath, organization.LogoPath.TrimStart('/').TrimStart('\\'));
            if (File.Exists(oldLogoPath))
            {
                try
                {
                    File.Delete(oldLogoPath);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not delete old logo file: {Path}", oldLogoPath);
                }
            }
        }

        // Generate unique filename
        var logoFileName = $"logo{fileExtension}";
        var filePath = Path.Combine(uploadsDir, logoFileName);
        var relativePath = $"/uploads/organizations/{organizationId.Value}/{logoFileName}";

        // Save file
        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await logoStream.CopyToAsync(fileStream);
            logoStream.Position = 0; // Reset stream position
        }

        // Update organization
        organization.LogoPath = relativePath;
        organization.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new OrganizationLogoResponseDto
        {
            LogoUrl = relativePath
        };
    }

    private OrganizationResponseDto MapToResponseDto(Organization organization)
    {
        return new OrganizationResponseDto
        {
            Id = organization.Id,
            Name = organization.Name,
            Description = organization.Description,
            Domain = organization.Domain,
            TimeZone = organization.TimeZone,
            Currency = organization.Currency,
            IsActive = organization.IsActive,
            SubscriptionExpiresAt = organization.SubscriptionExpiresAt,
            CreatedAt = organization.CreatedAt,
            UpdatedAt = organization.UpdatedAt,
            ContactEmail = organization.ContactEmail,
            ContactPhone = organization.ContactPhone,
            Website = organization.Website,
            AddressStreet = organization.AddressStreet,
            AddressCity = organization.AddressCity,
            AddressState = organization.AddressState,
            AddressPostalCode = organization.AddressPostalCode,
            AddressCountry = organization.AddressCountry,
            LogoUrl = organization.LogoPath,
            PrimaryColor = organization.PrimaryColor,
            SecondaryColor = organization.SecondaryColor
        };
    }
}

