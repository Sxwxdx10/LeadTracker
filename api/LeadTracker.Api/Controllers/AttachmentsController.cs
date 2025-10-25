using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LeadTracker.Core.DTOs;
using LeadTracker.Core.Services;

namespace LeadTracker.Api.Controllers;

/// <summary>
/// Controller for managing attachments
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly IAttachmentService _attachmentService;
    private readonly ILogger<AttachmentsController> _logger;

    public AttachmentsController(IAttachmentService attachmentService, ILogger<AttachmentsController> logger)
    {
        _attachmentService = attachmentService;
        _logger = logger;
    }

    /// <summary>
    /// Get attachments with pagination and filtering
    /// </summary>
    /// <param name="query">Query parameters for filtering and pagination</param>
    /// <returns>Paginated list of attachments</returns>
    [HttpGet]
    [ProducesResponseType(typeof(AttachmentListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttachments([FromQuery] AttachmentQueryDto query)
    {
        try
        {
            // Validate pagination parameters
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1 || query.PageSize > 1000) query.PageSize = 10;

            var result = await _attachmentService.GetAttachmentsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving attachments");
            return StatusCode(500, new { message = "An error occurred while retrieving attachments" });
        }
    }

    /// <summary>
    /// Get a specific attachment by ID
    /// </summary>
    /// <param name="id">Attachment ID</param>
    /// <returns>Attachment details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AttachmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttachment(Guid id)
    {
        try
        {
            var attachment = await _attachmentService.GetAttachmentByIdAsync(id);
            if (attachment == null)
            {
                return NotFound();
            }

            return Ok(attachment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving attachment {AttachmentId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the attachment" });
        }
    }

    /// <summary>
    /// Upload a new attachment
    /// </summary>
    /// <param name="file">File to upload</param>
    /// <param name="description">Optional description</param>
    /// <param name="leadId">Optional lead ID</param>
    /// <param name="taskId">Optional task ID</param>
    /// <param name="activityId">Optional activity ID</param>
    /// <param name="commentId">Optional comment ID</param>
    /// <returns>Created attachment</returns>
    [HttpPost]
    [ProducesResponseType(typeof(AttachmentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadAttachment(
        [FromForm] IFormFile file,
        [FromForm] string? description = null,
        [FromForm] Guid? leadId = null,
        [FromForm] Guid? taskId = null,
        [FromForm] Guid? activityId = null,
        [FromForm] Guid? commentId = null)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "File is required" });
            }

            var createDto = new CreateAttachmentDto
            {
                Description = description,
                LeadId = leadId,
                TaskId = taskId,
                ActivityId = activityId,
                CommentId = commentId
            };

            // Convert IFormFile to FileUploadDto
            var fileUploadDto = new LeadTracker.Core.Services.FileUploadDto
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                Length = file.Length,
                Stream = file.OpenReadStream()
            };

            var attachment = await _attachmentService.UploadAttachmentAsync(fileUploadDto, createDto);
            return CreatedAtAction(nameof(GetAttachment), new { id = attachment.Id }, attachment);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid file upload request");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading attachment");
            return StatusCode(500, new { message = "An error occurred while uploading the attachment" });
        }
    }

    /// <summary>
    /// Update attachment metadata
    /// </summary>
    /// <param name="id">Attachment ID</param>
    /// <param name="updateDto">Attachment update data</param>
    /// <returns>Updated attachment</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AttachmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateAttachment(Guid id, [FromBody] UpdateAttachmentDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var attachment = await _attachmentService.UpdateAttachmentAsync(id, updateDto);
            if (attachment == null)
            {
                return NotFound();
            }

            return Ok(attachment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating attachment {AttachmentId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the attachment" });
        }
    }

    /// <summary>
    /// Delete an attachment
    /// </summary>
    /// <param name="id">Attachment ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteAttachment(Guid id)
    {
        try
        {
            var deleted = await _attachmentService.DeleteAttachmentAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting attachment {AttachmentId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the attachment" });
        }
    }

    /// <summary>
    /// Download an attachment file
    /// </summary>
    /// <param name="id">Attachment ID</param>
    /// <returns>File stream</returns>
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DownloadAttachment(Guid id)
    {
        try
        {
            var result = await _attachmentService.GetAttachmentFileAsync(id);
            if (result == null)
            {
                return NotFound();
            }

            return File(result.Value.stream, result.Value.contentType, result.Value.fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading attachment {AttachmentId}", id);
            return StatusCode(500, new { message = "An error occurred while downloading the attachment" });
        }
    }

    /// <summary>
    /// Get attachments for a specific lead
    /// </summary>
    /// <param name="leadId">Lead ID</param>
    /// <returns>List of attachments</returns>
    [HttpGet("lead/{leadId}")]
    [ProducesResponseType(typeof(List<AttachmentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttachmentsByLead(Guid leadId)
    {
        try
        {
            var attachments = await _attachmentService.GetAttachmentsByLeadIdAsync(leadId);
            return Ok(attachments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving attachments for lead {LeadId}", leadId);
            return StatusCode(500, new { message = "An error occurred while retrieving attachments" });
        }
    }

    /// <summary>
    /// Get attachments for a specific task
    /// </summary>
    /// <param name="taskId">Task ID</param>
    /// <returns>List of attachments</returns>
    [HttpGet("task/{taskId}")]
    [ProducesResponseType(typeof(List<AttachmentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttachmentsByTask(Guid taskId)
    {
        try
        {
            var attachments = await _attachmentService.GetAttachmentsByTaskIdAsync(taskId);
            return Ok(attachments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving attachments for task {TaskId}", taskId);
            return StatusCode(500, new { message = "An error occurred while retrieving attachments" });
        }
    }

    /// <summary>
    /// Get attachments for a specific activity
    /// </summary>
    /// <param name="activityId">Activity ID</param>
    /// <returns>List of attachments</returns>
    [HttpGet("activity/{activityId}")]
    [ProducesResponseType(typeof(List<AttachmentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttachmentsByActivity(Guid activityId)
    {
        try
        {
            var attachments = await _attachmentService.GetAttachmentsByActivityIdAsync(activityId);
            return Ok(attachments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving attachments for activity {ActivityId}", activityId);
            return StatusCode(500, new { message = "An error occurred while retrieving attachments" });
        }
    }

    /// <summary>
    /// Get attachments for a specific comment
    /// </summary>
    /// <param name="commentId">Comment ID</param>
    /// <returns>List of attachments</returns>
    [HttpGet("comment/{commentId}")]
    [ProducesResponseType(typeof(List<AttachmentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttachmentsByComment(Guid commentId)
    {
        try
        {
            var attachments = await _attachmentService.GetAttachmentsByCommentIdAsync(commentId);
            return Ok(attachments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving attachments for comment {CommentId}", commentId);
            return StatusCode(500, new { message = "An error occurred while retrieving attachments" });
        }
    }
}

