namespace LeadTracker.Api.Services;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserEmail { get; }
    bool IsAuthenticated { get; }
}

public class CurrentUserService : ICurrentUserService
{
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public bool IsAuthenticated => UserId.HasValue;
}
