using Microsoft.AspNetCore.SignalR;
using LeadTracker.Core.DTOs;

namespace LeadTracker.Api.Hubs;

public interface IKanbanClient
{
    Task LeadMoved(KanbanLeadDto lead);
    Task LeadUpdated(KanbanLeadDto lead);
    Task StageCreated(KanbanColumnDto stage);
    Task StageUpdated(KanbanColumnDto stage);
    Task StageDeleted(string stageId);
    Task StagesReordered(List<KanbanColumnDto> stages);
    Task MetricsUpdated(KanbanMetricsDto metrics);
}

public class KanbanHub : Hub<IKanbanClient>
{
    private readonly ILogger<KanbanHub> _logger;

    public KanbanHub(ILogger<KanbanHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinKanbanRoom(string tenantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, tenantId);
        _logger.LogInformation("User {UserId} joined Kanban room {TenantId}", Context.User?.Identity?.Name, tenantId);
    }

    public async Task LeaveKanbanRoom(string tenantId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, tenantId);
        _logger.LogInformation("User {UserId} left Kanban room {TenantId}", Context.User?.Identity?.Name, tenantId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("User {UserId} connected to Kanban hub", Context.User?.Identity?.Name);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("User {UserId} disconnected from Kanban hub", Context.User?.Identity?.Name);
        await base.OnDisconnectedAsync(exception);
    }
}
