using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service interface for Kanban board operations
/// </summary>
public interface IKanbanService
{
    /// <summary>
    /// Get complete Kanban board for current tenant
    /// </summary>
    Task<KanbanBoardDto> GetKanbanBoardAsync();

    /// <summary>
    /// Move lead between stages
    /// </summary>
    Task<KanbanLeadDto> MoveLeadAsync(MoveLeadRequest request);

    /// <summary>
    /// Get stages for current tenant
    /// </summary>
    Task<List<KanbanColumnDto>> GetStagesAsync();

    /// <summary>
    /// Create new custom stage
    /// </summary>
    Task<KanbanColumnDto> CreateStageAsync(CreateStageRequest request);

    /// <summary>
    /// Update existing stage
    /// </summary>
    Task<KanbanColumnDto> UpdateStageAsync(UpdateStageRequest request);

    /// <summary>
    /// Delete stage (only if no leads assigned)
    /// </summary>
    Task DeleteStageAsync(string stageId);

    /// <summary>
    /// Get Kanban metrics for current tenant
    /// </summary>
    Task<KanbanMetricsDto> GetMetricsAsync();

    /// <summary>
    /// Reorder stages
    /// </summary>
    Task ReorderStagesAsync(ReorderStagesRequest request);
}