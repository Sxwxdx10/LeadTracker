namespace LeadTracker.Core.Services;

public class TenantContext : ITenantContext
{
    public Guid? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
}
