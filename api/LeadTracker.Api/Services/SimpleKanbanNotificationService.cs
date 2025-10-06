using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;
using Microsoft.Extensions.Logging;

namespace LeadTracker.Api.Services;

/// <summary>
/// Simple implementation of Kanban notification service without SignalR
/// </summary>
public class SimpleKanbanNotificationService : IKanbanNotificationService
{
    private readonly ILogger<SimpleKanbanNotificationService> _logger;

    public SimpleKanbanNotificationService(ILogger<SimpleKanbanNotificationService> logger)
    {
        _logger = logger;
    }

    public async Task NotifyLeadMovedAsync(string tenantId, KanbanLeadDto lead)
    {
        _logger.LogInformation("Notifying LeadMoved for tenant {TenantId}, LeadId: {LeadId}", tenantId, lead.Id);
        await Task.CompletedTask; // No-op for now
    }

    public async Task NotifyLeadUpdatedAsync(string tenantId, KanbanLeadDto lead)
    {
        _logger.LogInformation("Notifying LeadUpdated for tenant {TenantId}, LeadId: {LeadId}", tenantId, lead.Id);
        await Task.CompletedTask; // No-op for now
    }

    public async Task NotifyStageCreatedAsync(string tenantId, KanbanColumnDto stage)
    {
        _logger.LogInformation("Notifying StageCreated for tenant {TenantId}, StageId: {StageId}", tenantId, stage.Id);
        await Task.CompletedTask; // No-op for now
    }

    public async Task NotifyStageUpdatedAsync(string tenantId, KanbanColumnDto stage)
    {
        _logger.LogInformation("Notifying StageUpdated for tenant {TenantId}, StageId: {StageId}", tenantId, stage.Id);
        await Task.CompletedTask; // No-op for now
    }

    public async Task NotifyStageDeletedAsync(string tenantId, Guid stageId)
    {
        _logger.LogInformation("Notifying StageDeleted for tenant {TenantId}, StageId: {StageId}", tenantId, stageId);
        await Task.CompletedTask; // No-op for now
    }

    public async Task NotifyStagesReorderedAsync(string tenantId, List<KanbanColumnDto> stages)
    {
        _logger.LogInformation("Notifying StagesReordered for tenant {TenantId}", tenantId);
        await Task.CompletedTask; // No-op for now
    }

    public async Task NotifyMetricsUpdatedAsync(string tenantId, KanbanMetricsDto metrics)
    {
        _logger.LogInformation("Notifying MetricsUpdated for tenant {TenantId}", tenantId);
        await Task.CompletedTask; // No-op for now
    }
}
