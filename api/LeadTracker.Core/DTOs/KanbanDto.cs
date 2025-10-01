using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

public class KanbanLeadDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? Company { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public decimal? EstimatedValue { get; set; }
    public int Probability { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public DateTime? LastContactedAt { get; set; }
    public string Status { get; set; } = "Open";
    public string StageId { get; set; } = string.Empty;
    public string? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime StageEnteredAt { get; set; }
    public bool IsOverdue { get; set; }
}

public class KanbanColumnDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public bool IsActive { get; set; }
    public bool IsWonStage { get; set; }
    public bool IsLostStage { get; set; }
    public int LeadCount { get; set; }
    public decimal TotalValue { get; set; }
    public decimal PotentialValue { get; set; }
    public double AverageTimeInStageDays { get; set; }
}

public class KanbanBoardDto
{
    public List<KanbanColumnDto> Columns { get; set; } = new List<KanbanColumnDto>();
    public List<KanbanLeadDto> Leads { get; set; } = new List<KanbanLeadDto>();
    public KanbanMetricsDto Metrics { get; set; } = new KanbanMetricsDto();
}

public class KanbanMetricsDto
{
    public int TotalLeads { get; set; }
    public int OpenLeads { get; set; }
    public int QualifiedLeads { get; set; }
    public int WonLeads { get; set; }
    public int LostLeads { get; set; }
    public decimal TotalValue { get; set; }
    public decimal WonValue { get; set; }
    public decimal PotentialValue { get; set; }
    public double OverallConversionRate { get; set; }
    public double AverageDealSize { get; set; }
}

public class MoveLeadRequest
{
    public string LeadId { get; set; } = string.Empty;
    public string FromStageId { get; set; } = string.Empty;
    public string ToStageId { get; set; } = string.Empty;
}

public class UpdateKanbanLeadRequest
{
    public string LeadId { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Company { get; set; }
    public string? JobTitle { get; set; }
    public decimal? EstimatedValue { get; set; }
    public int? Probability { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public string? Source { get; set; }
    public string? Status { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? LastContactedAt { get; set; }
    public string? StageId { get; set; }
    public Guid? AssignedUserId { get; set; }
}

public class CreateStageRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public bool IsWonStage { get; set; } = false;
    public bool IsLostStage { get; set; } = false;
}

public class UpdateStageRequest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public bool IsActive { get; set; }
    public bool IsWonStage { get; set; }
    public bool IsLostStage { get; set; }
}

public class ReorderStagesRequest
{
    public List<string> StageIds { get; set; } = new List<string>();
}