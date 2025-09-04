namespace LeadTracker.Api.Services;

public interface ITenantContext
{
    Guid? OrganizationId { get; }
    string? OrganizationName { get; }
    Guid? UserId { get; }
    string? UserEmail { get; }
}

public class TenantContext : ITenantContext
{
    public Guid? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
}
