using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Implementation of Kanban service for lead management
/// </summary>
public class KanbanService : IKanbanService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IKanbanNotificationService _notificationService;
    private readonly ILogger<KanbanService> _logger;

    public KanbanService(
        LeadTrackerDbContext context,
        ITenantContext tenantContext,
        IKanbanNotificationService notificationService,
        ILogger<KanbanService> logger)
    {
        _context = context;
        _tenantContext = tenantContext;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<KanbanBoardDto> GetKanbanBoardAsync()
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var stages = await GetStagesAsync();
        var leads = await GetLeadsForBoardAsync();
        var metrics = await GetMetricsAsync();

        return new KanbanBoardDto
        {
            Columns = stages,
            Leads = leads,
            Metrics = metrics
        };
    }

    public async Task<List<KanbanColumnDto>> GetStagesAsync()
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var stages = await _context.Stages
            .Where(s => s.OrganizationId == organizationId.Value && s.IsActive)
            .OrderBy(s => s.Order)
            .ToListAsync();

        var stageDtos = new List<KanbanColumnDto>();

        foreach (var stage in stages)
        {
            var leadCount = await _context.Leads
                .CountAsync(l => l.OrganizationId == organizationId.Value && l.StageId == stage.Id && l.IsActive);

            var totalValue = await _context.Leads
                .Where(l => l.OrganizationId == organizationId.Value && l.StageId == stage.Id && l.IsActive)
                .SumAsync(l => l.EstimatedValue ?? 0);

            var potentialValue = await _context.Leads
                .Where(l => l.OrganizationId == organizationId.Value && l.StageId == stage.Id && l.IsActive)
                .SumAsync(l => (l.EstimatedValue ?? 0) * (l.Probability / 100.0m));

            stageDtos.Add(new KanbanColumnDto
            {
                Id = stage.Id.ToString(),
                Name = stage.Name,
                Color = stage.Color ?? "#3B82F6",
                Order = stage.Order,
                IsActive = stage.IsActive,
                IsWonStage = stage.IsWonStage,
                IsLostStage = stage.IsLostStage,
                LeadCount = leadCount,
                TotalValue = totalValue,
                PotentialValue = potentialValue,
                AverageTimeInStageDays = 0 // TODO: Calculate based on stage history
            });
        }

        return stageDtos;
    }

    public async Task<List<KanbanLeadDto>> GetLeadsForBoardAsync()
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var leads = await _context.Leads
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .Include(l => l.Tasks)
            .Where(l => l.OrganizationId == organizationId.Value && l.IsActive)
            .ToListAsync();

        var leadDtos = new List<KanbanLeadDto>();

        foreach (var lead in leads)
        {
            var taskCount = lead.Tasks?.Count ?? 0;
            var completedTaskCount = lead.Tasks?.Count(t => t.Status == "Completed") ?? 0;

            var isOverdue = lead.ExpectedCloseDate.HasValue && 
                           lead.ExpectedCloseDate.Value < DateTime.UtcNow && 
                           lead.Stage != null && !lead.Stage.IsWonStage && !lead.Stage.IsLostStage;

            leadDtos.Add(new KanbanLeadDto
            {
                Id = lead.Id.ToString(),
                Title = lead.Title ?? $"{lead.FirstName} {lead.LastName}".Trim(),
                Company = lead.Company,
                ContactName = $"{lead.FirstName} {lead.LastName}".Trim(),
                Email = lead.Email,
                PhoneNumber = lead.PhoneNumber,
                EstimatedValue = lead.EstimatedValue,
                Probability = lead.Probability,
                ExpectedCloseDate = lead.ExpectedCloseDate,
                LastContactedAt = lead.LastContactedAt,
                Status = lead.Status,
                StageId = lead.StageId.ToString(),
                AssignedUserId = lead.AssignedUserId?.ToString(),
                AssignedUserName = lead.AssignedUser?.FullName,
                TaskCount = taskCount,
                CompletedTaskCount = completedTaskCount,
                CreatedAt = lead.CreatedAt,
                StageEnteredAt = lead.CreatedAt, // TODO: Track actual stage entry time
                IsOverdue = isOverdue
            });
        }

        return leadDtos;
    }

    public async Task<KanbanLeadDto> MoveLeadAsync(MoveLeadRequest request)
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var leadId = Guid.Parse(request.LeadId);
        var toStageId = Guid.Parse(request.ToStageId);

        var lead = await _context.Leads
            .FirstOrDefaultAsync(l => l.Id == leadId && l.OrganizationId == organizationId.Value);

        if (lead == null)
        {
            throw new ArgumentException("Lead not found");
        }

        var stage = await _context.Stages
            .FirstOrDefaultAsync(s => s.Id == toStageId && s.OrganizationId == organizationId.Value);

        if (stage == null)
        {
            throw new ArgumentException("Stage not found");
        }

        // Update StageId
        lead.StageId = toStageId;
        
        // CRITICAL FIX: Automatically update Status based on stage type
        // This ensures consistency between StageId and Status
        if (stage.IsWonStage)
        {
            lead.Status = "Won";
        }
        else if (stage.IsLostStage)
        {
            lead.Status = "Lost";
        }
        else
        {
            // For normal stages (Nouveau, Qualifié, Proposition, Négociation)
            // Only set to Open if the lead is currently Won or Lost
            // This allows leads that are Open/Qualified to remain Open/Qualified
            if (lead.Status == "Won" || lead.Status == "Lost")
            {
                lead.Status = "Open";
            }
            // Otherwise, keep the current status (Open, Qualified, etc.)
        }
        
        lead.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Get updated lead with includes
        var updatedLead = await _context.Leads
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .Include(l => l.Tasks)
            .FirstAsync(l => l.Id == leadId);

        var leadDto = new KanbanLeadDto
        {
            Id = updatedLead.Id.ToString(),
            Title = updatedLead.Title ?? $"{updatedLead.FirstName} {updatedLead.LastName}".Trim(),
            Company = updatedLead.Company,
            ContactName = $"{updatedLead.FirstName} {updatedLead.LastName}".Trim(),
            Email = updatedLead.Email,
            PhoneNumber = updatedLead.PhoneNumber,
            EstimatedValue = updatedLead.EstimatedValue,
            Probability = updatedLead.Probability,
            ExpectedCloseDate = updatedLead.ExpectedCloseDate,
            LastContactedAt = updatedLead.LastContactedAt,
            Status = updatedLead.Status,
            StageId = updatedLead.StageId.ToString(),
            AssignedUserId = updatedLead.AssignedUserId?.ToString(),
            AssignedUserName = updatedLead.AssignedUser?.FullName,
            TaskCount = updatedLead.Tasks?.Count ?? 0,
            CompletedTaskCount = updatedLead.Tasks?.Count(t => t.Status == "Completed") ?? 0,
            CreatedAt = updatedLead.CreatedAt,
            StageEnteredAt = updatedLead.CreatedAt,
            IsOverdue = updatedLead.ExpectedCloseDate.HasValue && 
                       updatedLead.ExpectedCloseDate.Value < DateTime.UtcNow && 
                       !updatedLead.Stage.IsWonStage && !updatedLead.Stage.IsLostStage
        };

        // TODO: Notify via SignalR
        // await _notificationService.NotifyLeadMoved(organizationId.Value.ToString(), leadDto);

        return leadDto;
    }

    public async Task<KanbanColumnDto> CreateStageAsync(CreateStageRequest request)
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var maxOrder = await _context.Stages
            .Where(s => s.OrganizationId == organizationId.Value)
            .MaxAsync(s => (int?)s.Order) ?? 0;

        var stage = new Stage
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId.Value,
            Name = request.Name,
            Description = request.Description,
            Color = request.Color,
            Order = maxOrder + 1,
            IsActive = true,
            IsWonStage = request.IsWonStage,
            IsLostStage = request.IsLostStage,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Stages.Add(stage);
        await _context.SaveChangesAsync();

        var stageDto = new KanbanColumnDto
        {
            Id = stage.Id.ToString(),
            Name = stage.Name,
            Color = stage.Color ?? "#3B82F6",
            Order = stage.Order,
            IsActive = stage.IsActive,
            IsWonStage = stage.IsWonStage,
            IsLostStage = stage.IsLostStage,
            LeadCount = 0,
            TotalValue = 0,
            PotentialValue = 0,
            AverageTimeInStageDays = 0
        };

        // TODO: Notify via SignalR
        // await _notificationService.NotifyStageCreated(organizationId.Value.ToString(), stageDto);

        return stageDto;
    }

    public async Task<KanbanColumnDto> UpdateStageAsync(UpdateStageRequest request)
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var stageId = Guid.Parse(request.Id);

        var stage = await _context.Stages
            .FirstOrDefaultAsync(s => s.Id == stageId && s.OrganizationId == organizationId.Value);

        if (stage == null)
        {
            throw new ArgumentException("Stage not found");
        }

        // Update stage properties
        stage.Name = request.Name;
        stage.Description = request.Description;
        stage.Color = request.Color;
        stage.IsActive = request.IsActive;
        stage.IsWonStage = request.IsWonStage;
        stage.IsLostStage = request.IsLostStage;
        stage.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var stageDto = new KanbanColumnDto
        {
            Id = stage.Id.ToString(),
            Name = stage.Name,
            Color = stage.Color ?? "#3B82F6",
            Order = stage.Order,
            IsActive = stage.IsActive,
            IsWonStage = stage.IsWonStage,
            IsLostStage = stage.IsLostStage,
            LeadCount = 0, // TODO: Calculate actual values
            TotalValue = 0,
            PotentialValue = 0,
            AverageTimeInStageDays = 0
        };

        // TODO: Notify via SignalR
        // await _notificationService.NotifyStageUpdated(organizationId.Value.ToString(), stageDto);

        return stageDto;
    }

    public async System.Threading.Tasks.Task DeleteStageAsync(string stageId)
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var stageGuid = Guid.Parse(stageId);

        var stage = await _context.Stages
            .FirstOrDefaultAsync(s => s.Id == stageGuid && s.OrganizationId == organizationId.Value);

        if (stage == null)
        {
            throw new ArgumentException("Stage not found");
        }

        // Check if stage has leads
        var hasLeads = await _context.Leads
            .AnyAsync(l => l.StageId == stageGuid && l.OrganizationId == organizationId.Value);

        if (hasLeads)
        {
            throw new InvalidOperationException("Cannot delete stage with assigned leads");
        }

        _context.Stages.Remove(stage);
        await _context.SaveChangesAsync();

        // TODO: Notify via SignalR
        // await _notificationService.NotifyStageDeleted(organizationId.Value.ToString(), stageId);
    }

    public async System.Threading.Tasks.Task ReorderStagesAsync(ReorderStagesRequest request)
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var stageIds = request.StageIds.Select(Guid.Parse).ToList();

        var stages = await _context.Stages
            .Where(s => s.OrganizationId == organizationId.Value && stageIds.Contains(s.Id))
            .ToListAsync();

        for (int i = 0; i < stageIds.Count; i++)
        {
            var stage = stages.FirstOrDefault(s => s.Id == stageIds[i]);
            if (stage != null)
            {
                stage.Order = i + 1;
                stage.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        var reorderedStages = await GetStagesAsync();

        // TODO: Notify via SignalR
        // await _notificationService.NotifyStagesReordered(organizationId.Value.ToString(), reorderedStages);
    }

    public async Task<KanbanMetricsDto> GetMetricsAsync()
    {
        var organizationId = _tenantContext.OrganizationId;
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("No organization context available");
        }

        var leads = await _context.Leads
            .Where(l => l.OrganizationId == organizationId.Value && l.IsActive)
            .ToListAsync();

        var totalLeads = leads.Count;
        var openLeads = leads.Count(l => l.Status == "Open");
        var qualifiedLeads = leads.Count(l => l.Status == "Qualified");
        var wonLeads = leads.Count(l => l.Status == "Won");
        var lostLeads = leads.Count(l => l.Status == "Lost");

        var totalEstimatedValue = leads.Sum(l => l.EstimatedValue ?? 0);
        var totalPotentialValue = leads.Sum(l => (l.EstimatedValue ?? 0) * (l.Probability / 100.0m));

        var overallConversionRate = totalLeads > 0 ? (double)wonLeads / totalLeads * 100 : 0;

        return new KanbanMetricsDto
        {
            TotalLeads = totalLeads,
            OpenLeads = openLeads,
            QualifiedLeads = qualifiedLeads,
            WonLeads = wonLeads,
            LostLeads = lostLeads,
            TotalValue = totalEstimatedValue,
            WonValue = leads.Where(l => l.Status == "Won").Sum(l => l.EstimatedValue ?? 0),
            PotentialValue = totalPotentialValue,
            OverallConversionRate = overallConversionRate,
            AverageDealSize = totalLeads > 0 ? (double)(totalEstimatedValue / totalLeads) : 0
        };
    }
}