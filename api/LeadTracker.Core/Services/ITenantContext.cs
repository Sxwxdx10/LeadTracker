namespace LeadTracker.Core.Services;

public interface ITenantContext
{
    Guid? OrganizationId { get; }
    string? OrganizationName { get; }
    Guid? UserId { get; }
    string? UserEmail { get; }
}

