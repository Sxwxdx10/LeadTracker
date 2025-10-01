using Microsoft.AspNetCore.Mvc;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Api.Filters;

namespace LeadTracker.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[ServiceFilter(typeof(FluentValidationFilter))]
public class KanbanController : ControllerBase
{
    private readonly IKanbanService _kanbanService;

    public KanbanController(IKanbanService kanbanService)
    {
        _kanbanService = kanbanService;
    }

    [HttpGet("board")]
    [ProducesResponseType(typeof(KanbanBoardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetKanbanBoard()
    {
        var board = await _kanbanService.GetKanbanBoardAsync();
        return Ok(board);
    }

    [HttpPost("leads/move")]
    [ProducesResponseType(typeof(KanbanLeadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MoveLead([FromBody] MoveLeadRequest request)
    {
        var updatedLead = await _kanbanService.MoveLeadAsync(request);
        return Ok(updatedLead);
    }

    // TODO: Implement lead update endpoint
    // [HttpPut("leads/{leadId}")]
    // [ProducesResponseType(typeof(KanbanLeadDto), StatusCodes.Status200OK)]
    // [ProducesResponseType(StatusCodes.Status404NotFound)]
    // public async Task<IActionResult> UpdateLead(string leadId, [FromBody] UpdateKanbanLeadRequest request)
    // {
    //     request.LeadId = leadId;
    //     var updatedLead = await _kanbanService.UpdateLeadAsync(request);
    //     return Ok(updatedLead);
    // }

    [HttpGet("stages")]
    [ProducesResponseType(typeof(List<KanbanColumnDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStages()
    {
        var stages = await _kanbanService.GetStagesAsync();
        return Ok(stages);
    }

    [HttpPost("stages")]
    [ProducesResponseType(typeof(KanbanColumnDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateStage([FromBody] CreateStageRequest request)
    {
        var stage = await _kanbanService.CreateStageAsync(request);
        return CreatedAtAction(nameof(GetStages), new { id = stage.Id }, stage);
    }

    [HttpPut("stages/{stageId}")]
    [ProducesResponseType(typeof(KanbanColumnDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStage(string stageId, [FromBody] UpdateStageRequest request)
    {
        request.Id = stageId;
        var updatedStage = await _kanbanService.UpdateStageAsync(request);
        return Ok(updatedStage);
    }

    [HttpDelete("stages/{stageId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStage(string stageId)
    {
        await _kanbanService.DeleteStageAsync(stageId);
        return NoContent();
    }

    [HttpPost("stages/reorder")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ReorderStages([FromBody] ReorderStagesRequest request)
    {
        await _kanbanService.ReorderStagesAsync(request);
        return NoContent();
    }

    [HttpGet("metrics")]
    [ProducesResponseType(typeof(KanbanMetricsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMetrics()
    {
        var metrics = await _kanbanService.GetMetricsAsync();
        return Ok(metrics);
    }
}
