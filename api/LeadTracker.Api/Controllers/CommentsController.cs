using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing comments
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(ICommentService commentService, ILogger<CommentsController> logger)
    {
        _commentService = commentService;
        _logger = logger;
    }

    /// <summary>
    /// Get comments with pagination and filtering
    /// </summary>
    /// <param name="query">Query parameters for filtering and pagination</param>
    /// <returns>Paginated list of comments</returns>
    [HttpGet]
    [ProducesResponseType(typeof(CommentListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetComments([FromQuery] CommentQueryDto query)
    {
        try
        {
            // Validate pagination parameters
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1 || query.PageSize > 1000) query.PageSize = 10;

            var result = await _commentService.GetCommentsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comments");
            return StatusCode(500, new { message = "An error occurred while retrieving comments" });
        }
    }

    /// <summary>
    /// Get a specific comment by ID
    /// </summary>
    /// <param name="id">Comment ID</param>
    /// <returns>Comment details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetComment(Guid id)
    {
        try
        {
            var comment = await _commentService.GetCommentByIdAsync(id);
            if (comment == null)
            {
                return NotFound();
            }

            return Ok(comment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comment {CommentId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the comment" });
        }
    }

    /// <summary>
    /// Create a new comment
    /// </summary>
    /// <param name="createDto">Comment creation data</param>
    /// <returns>Created comment</returns>
    [HttpPost]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var comment = await _commentService.CreateCommentAsync(createDto);
            return CreatedAtAction(nameof(GetComment), new { id = comment.Id }, comment);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Invalid operation during comment creation");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment");
            return StatusCode(500, new { message = "An error occurred while creating the comment" });
        }
    }

    /// <summary>
    /// Update an existing comment
    /// </summary>
    /// <param name="id">Comment ID</param>
    /// <param name="updateDto">Comment update data</param>
    /// <returns>Updated comment</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateComment(Guid id, [FromBody] UpdateCommentDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var comment = await _commentService.UpdateCommentAsync(id, updateDto);
            if (comment == null)
            {
                return NotFound();
            }

            return Ok(comment);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized attempt to update comment {CommentId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating comment {CommentId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the comment" });
        }
    }

    /// <summary>
    /// Delete a comment
    /// </summary>
    /// <param name="id">Comment ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        try
        {
            var deleted = await _commentService.DeleteCommentAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized attempt to delete comment {CommentId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {CommentId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the comment" });
        }
    }

    /// <summary>
    /// Get comments for a specific lead
    /// </summary>
    /// <param name="leadId">Lead ID</param>
    /// <returns>List of comments</returns>
    [HttpGet("lead/{leadId}")]
    [ProducesResponseType(typeof(List<CommentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCommentsByLead(Guid leadId)
    {
        try
        {
            var comments = await _commentService.GetCommentsByLeadIdAsync(leadId);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comments for lead {LeadId}", leadId);
            return StatusCode(500, new { message = "An error occurred while retrieving comments" });
        }
    }

    /// <summary>
    /// Get comments for a specific task
    /// </summary>
    /// <param name="taskId">Task ID</param>
    /// <returns>List of comments</returns>
    [HttpGet("task/{taskId}")]
    [ProducesResponseType(typeof(List<CommentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCommentsByTask(Guid taskId)
    {
        try
        {
            var comments = await _commentService.GetCommentsByTaskIdAsync(taskId);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comments for task {TaskId}", taskId);
            return StatusCode(500, new { message = "An error occurred while retrieving comments" });
        }
    }

    /// <summary>
    /// Get comments for a specific activity
    /// </summary>
    /// <param name="activityId">Activity ID</param>
    /// <returns>List of comments</returns>
    [HttpGet("activity/{activityId}")]
    [ProducesResponseType(typeof(List<CommentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCommentsByActivity(Guid activityId)
    {
        try
        {
            var comments = await _commentService.GetCommentsByActivityIdAsync(activityId);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comments for activity {ActivityId}", activityId);
            return StatusCode(500, new { message = "An error occurred while retrieving comments" });
        }
    }
}

