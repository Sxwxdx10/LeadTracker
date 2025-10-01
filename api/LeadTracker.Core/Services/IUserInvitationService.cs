using LeadTracker.Core.DTOs;
using LeadTracker.Core.Entities;

namespace LeadTracker.Core.Services;

/// <summary>
/// Service for managing user invitations
/// </summary>
public interface IUserInvitationService
{
    /// <summary>
    /// Create a new user invitation
    /// </summary>
    /// <param name="request">Invitation request</param>
    /// <param name="invitedByUserId">ID of the user creating the invitation</param>
    /// <param name="organizationId">Organization ID</param>
    /// <returns>Invitation response</returns>
    Task<InviteUserResponse> CreateInvitationAsync(InviteUserRequest request, Guid invitedByUserId, Guid organizationId);

    /// <summary>
    /// Validate an invitation token
    /// </summary>
    /// <param name="token">Invitation token</param>
    /// <returns>User invitation if valid, null if invalid or expired</returns>
    Task<UserInvitation?> ValidateInvitationTokenAsync(string token);

    /// <summary>
    /// Accept an invitation and create user account
    /// </summary>
    /// <param name="request">Accept invitation request</param>
    /// <returns>True if successful</returns>
    Task<bool> AcceptInvitationAsync(AcceptInvitationRequest request);

    /// <summary>
    /// Get pending invitations for an organization
    /// </summary>
    /// <param name="organizationId">Organization ID</param>
    /// <returns>List of pending invitations</returns>
    Task<List<UserInvitation>> GetPendingInvitationsAsync(Guid organizationId);

    /// <summary>
    /// Cancel an invitation
    /// </summary>
    /// <param name="invitationId">Invitation ID</param>
    /// <param name="cancelledByUserId">ID of the user cancelling the invitation</param>
    /// <returns>True if successful</returns>
    Task<bool> CancelInvitationAsync(Guid invitationId, Guid cancelledByUserId);

    /// <summary>
    /// Resend an invitation email
    /// </summary>
    /// <param name="invitationId">Invitation ID</param>
    /// <param name="resendByUserId">ID of the user resending the invitation</param>
    /// <returns>True if successful</returns>
    Task<bool> ResendInvitationAsync(Guid invitationId, Guid resendByUserId);
}
