using Microsoft.AspNetCore.SignalR;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;
using LeadTracker.Api.Hubs;
using Microsoft.Extensions.Logging;

namespace LeadTracker.Api.Services;

/// <summary>
/// Implementation of Kanban notification service
/// </summary>
public class KanbanNotificationService : IKanbanNotificationService
{
    private readonly IHubContext<KanbanHub, IKanbanClient> _hubContext;
    private readonly ILogger<KanbanNotificationService> _logger;

    public KanbanNotificationService(IHubContext<KanbanHub, IKanbanClient> hubContext, ILogger<KanbanNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyLeadMovedAsync(string tenantId, KanbanLeadDto lead)
    {
        _logger.LogInformation("Notifying LeadMoved for tenant {TenantId}, LeadId: {LeadId}", tenantId, lead.Id);
        await _hubContext.Clients.Group(tenantId).LeadMoved(lead);
    }

    public async Task NotifyLeadUpdatedAsync(string tenantId, KanbanLeadDto lead)
    {
        _logger.LogInformation("Notifying LeadUpdated for tenant {TenantId}, LeadId: {LeadId}", tenantId, lead.Id);
        await _hubContext.Clients.Group(tenantId).LeadUpdated(lead);
    }

    public async Task NotifyStageCreatedAsync(string tenantId, KanbanColumnDto stage)
    {
        _logger.LogInformation("Notifying StageCreated for tenant {TenantId}, StageId: {StageId}", tenantId, stage.Id);
        await _hubContext.Clients.Group(tenantId).StageCreated(stage);
    }

    public async Task NotifyStageUpdatedAsync(string tenantId, KanbanColumnDto stage)
    {
        _logger.LogInformation("Notifying StageUpdated for tenant {TenantId}, StageId: {StageId}", tenantId, stage.Id);
        await _hubContext.Clients.Group(tenantId).StageUpdated(stage);
    }

    public async Task NotifyStageDeletedAsync(string tenantId, Guid stageId)
    {
        _logger.LogInformation("Notifying StageDeleted for tenant {TenantId}, StageId: {StageId}", tenantId, stageId);
        await _hubContext.Clients.Group(tenantId).StageDeleted(stageId.ToString());
    }

    public async Task NotifyStagesReorderedAsync(string tenantId, List<KanbanColumnDto> stages)
    {
        _logger.LogInformation("Notifying StagesReordered for tenant {TenantId}", tenantId);
        await _hubContext.Clients.Group(tenantId).StagesReordered(stages);
    }

    public async Task NotifyMetricsUpdatedAsync(string tenantId, KanbanMetricsDto metrics)
    {
        _logger.LogInformation("Notifying MetricsUpdated for tenant {TenantId}", tenantId);
        await _hubContext.Clients.Group(tenantId).MetricsUpdated(metrics);
    }
}
