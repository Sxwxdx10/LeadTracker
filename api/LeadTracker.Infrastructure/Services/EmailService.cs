using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using LeadTracker.Core.Services;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Email service implementation using MailKit
/// </summary>
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _smtpUser;
    private readonly string _smtpPassword;
    private readonly string _fromAddress;
    private readonly string _fromName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        _smtpHost = _configuration["Email:SmtpHost"] ?? "localhost";
        _smtpPort = _configuration.GetValue<int>("Email:SmtpPort", 1025);
        _smtpUser = _configuration["Email:SmtpUser"] ?? string.Empty;
        _smtpPassword = _configuration["Email:SmtpPassword"] ?? string.Empty;
        _fromAddress = _configuration["Email:FromAddress"] ?? "noreply@leadtracker.local";
        _fromName = _configuration["Email:FromName"] ?? "Lead Tracker";
    }

    public async Task<bool> SendUserInvitationAsync(UserInvitationEmail invitation)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromAddress));
            message.To.Add(new MailboxAddress(invitation.ToName, invitation.ToEmail));
            message.Subject = $"Invitation to join {invitation.OrganizationName} on Lead Tracker";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.HtmlBody = GenerateInvitationEmailHtml(invitation);
            bodyBuilder.TextBody = GenerateInvitationEmailText(invitation);
            
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpHost, _smtpPort, SecureSocketOptions.None);
            
            if (!string.IsNullOrEmpty(_smtpUser))
            {
                await client.AuthenticateAsync(_smtpUser, _smtpPassword);
            }
            
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("User invitation email sent successfully to {Email}", invitation.ToEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send user invitation email to {Email}", invitation.ToEmail);
            return false;
        }
    }

    public async Task<bool> SendPasswordResetEmailAsync(PasswordResetEmail resetRequest)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromAddress));
            message.To.Add(new MailboxAddress(resetRequest.ToName, resetRequest.ToEmail));
            message.Subject = "Reset your Lead Tracker password";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.HtmlBody = GeneratePasswordResetEmailHtml(resetRequest);
            bodyBuilder.TextBody = GeneratePasswordResetEmailText(resetRequest);
            
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpHost, _smtpPort, SecureSocketOptions.None);
            
            if (!string.IsNullOrEmpty(_smtpUser))
            {
                await client.AuthenticateAsync(_smtpUser, _smtpPassword);
            }
            
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Password reset email sent successfully to {Email}", resetRequest.ToEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", resetRequest.ToEmail);
            return false;
        }
    }

    public async Task<bool> SendEmailVerificationAsync(EmailVerificationEmail verification)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromAddress));
            message.To.Add(new MailboxAddress(verification.ToName, verification.ToEmail));
            message.Subject = "Verify your Lead Tracker email address";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.HtmlBody = GenerateEmailVerificationHtml(verification);
            bodyBuilder.TextBody = GenerateEmailVerificationText(verification);
            
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpHost, _smtpPort, SecureSocketOptions.None);
            
            if (!string.IsNullOrEmpty(_smtpUser))
            {
                await client.AuthenticateAsync(_smtpUser, _smtpPassword);
            }
            
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email verification sent successfully to {Email}", verification.ToEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email verification to {Email}", verification.ToEmail);
            return false;
        }
    }

    private string GenerateInvitationEmailHtml(UserInvitationEmail invitation)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Invitation to join {invitation.OrganizationName}</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>You're invited to join {invitation.OrganizationName}</h1>
        </div>
        <div class='content'>
            <p>Hello {invitation.ToName},</p>
            <p>{invitation.InviterName} has invited you to join <strong>{invitation.OrganizationName}</strong> on Lead Tracker as a <strong>{invitation.Role}</strong>.</p>
            <p>Lead Tracker is a powerful CRM tool that will help you manage your leads and grow your business.</p>
            <p>Click the button below to accept your invitation and get started:</p>
            <p style='text-align: center;'>
                <a href='{invitation.InvitationUrl}' class='button'>Accept Invitation</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style='word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px;'>{invitation.InvitationUrl}</p>
            <p>This invitation will expire in 7 days.</p>
        </div>
        <div class='footer'>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>© 2024 Lead Tracker. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateInvitationEmailText(UserInvitationEmail invitation)
    {
        return $@"
You're invited to join {invitation.OrganizationName}

Hello {invitation.ToName},

{invitation.InviterName} has invited you to join {invitation.OrganizationName} on Lead Tracker as a {invitation.Role}.

Lead Tracker is a powerful CRM tool that will help you manage your leads and grow your business.

To accept your invitation, click this link:
{invitation.InvitationUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© 2024 Lead Tracker. All rights reserved.";
    }

    private string GeneratePasswordResetEmailHtml(PasswordResetEmail resetRequest)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Reset your password</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Reset your password</h1>
        </div>
        <div class='content'>
            <p>Hello {resetRequest.ToName},</p>
            <p>We received a request to reset your password for your Lead Tracker account.</p>
            <p>Click the button below to reset your password:</p>
            <p style='text-align: center;'>
                <a href='{resetRequest.ResetUrl}' class='button'>Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style='word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px;'>{resetRequest.ResetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class='footer'>
            <p>© 2024 Lead Tracker. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GeneratePasswordResetEmailText(PasswordResetEmail resetRequest)
    {
        return $@"
Reset your password

Hello {resetRequest.ToName},

We received a request to reset your password for your Lead Tracker account.

To reset your password, click this link:
{resetRequest.ResetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

© 2024 Lead Tracker. All rights reserved.";
    }

    private string GenerateEmailVerificationHtml(EmailVerificationEmail verification)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Verify your email address</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Verify your email address</h1>
        </div>
        <div class='content'>
            <p>Hello {verification.ToName},</p>
            <p>Welcome to Lead Tracker! Please verify your email address to complete your account setup.</p>
            <p>Click the button below to verify your email:</p>
            <p style='text-align: center;'>
                <a href='{verification.VerificationUrl}' class='button'>Verify Email</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style='word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px;'>{verification.VerificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
        </div>
        <div class='footer'>
            <p>© 2024 Lead Tracker. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateEmailVerificationText(EmailVerificationEmail verification)
    {
        return $@"
Verify your email address

Hello {verification.ToName},

Welcome to Lead Tracker! Please verify your email address to complete your account setup.

To verify your email, click this link:
{verification.VerificationUrl}

This verification link will expire in 24 hours.

© 2024 Lead Tracker. All rights reserved.";
    }
}
