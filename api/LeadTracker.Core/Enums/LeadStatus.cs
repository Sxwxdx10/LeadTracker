namespace LeadTracker.Core.Enums;

/// <summary>
/// Lead status enumeration
/// </summary>
public enum LeadStatus
{
    Open = 1,
    Qualified = 2,
    Won = 3,
    Lost = 4,
    Cancelled = 5
}

/// <summary>
/// Lead source enumeration
/// </summary>
public enum LeadSource
{
    Website = 1,
    Referral = 2,
    ColdCall = 3,
    Email = 4,
    SocialMedia = 5,
    Advertisement = 6,
    Event = 7,
    Partner = 8,
    Other = 9
}

/// <summary>
/// Task type enumeration
/// </summary>
public enum TaskType
{
    Call = 1,
    Email = 2,
    Meeting = 3,
    FollowUp = 4,
    Demo = 5,
    Proposal = 6,
    Contract = 7,
    Other = 8
}

/// <summary>
/// Task status enumeration
/// </summary>
public enum TaskStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4
}

/// <summary>
/// Task priority enumeration
/// </summary>
public enum TaskPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4
}
