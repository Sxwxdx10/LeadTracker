using LeadTracker.Core.DTOs;

namespace LeadTracker.Core.Services;

public interface IKanbanNotificationService
{
    Task NotifyLeadMovedAsync(string tenantId, KanbanLeadDto lead);
    Task NotifyLeadUpdatedAsync(string tenantId, KanbanLeadDto lead);
    Task NotifyStageCreatedAsync(string tenantId, KanbanColumnDto stage);
    Task NotifyStageUpdatedAsync(string tenantId, KanbanColumnDto stage);
    Task NotifyStageDeletedAsync(string tenantId, Guid stageId);
    Task NotifyStagesReorderedAsync(string tenantId, List<KanbanColumnDto> stages);
    Task NotifyMetricsUpdatedAsync(string tenantId, KanbanMetricsDto metrics);
}