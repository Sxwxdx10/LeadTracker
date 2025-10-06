using FluentValidation;
using LeadTracker.Core.Models;

namespace LeadTracker.Core.Validators;

/// <summary>
/// Validator for RegisterRequest
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name cannot exceed 100 characters")
            .Must(BeSafeFromXSS).WithMessage("First name contains potentially dangerous content");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name cannot exceed 100 characters")
            .Must(BeSafeFromXSS).WithMessage("Last name contains potentially dangerous content");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .Must(BeValidEmailFormat).WithMessage("Invalid email format")
            .MaximumLength(255).WithMessage("Email cannot exceed 255 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?])").WithMessage("Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Password confirmation is required")
            .Equal(x => x.Password).WithMessage("Password and confirmation password do not match");

        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("Organization name is required")
            .MaximumLength(200).WithMessage("Organization name cannot exceed 200 characters")
            .Must(BeSafeFromXSS).WithMessage("Organization name contains potentially dangerous content");

        RuleFor(x => x.OrganizationDescription)
            .MaximumLength(500).WithMessage("Organization description cannot exceed 500 characters")
            .Must(BeSafeFromXSS).WithMessage("Organization description contains potentially dangerous content")
            .When(x => !string.IsNullOrEmpty(x.OrganizationDescription));

        RuleFor(x => x.OrganizationDomain)
            .MaximumLength(100).WithMessage("Organization domain cannot exceed 100 characters")
            .Matches(@"^[a-z0-9]([a-z0-9-]*[a-z0-9])?$").WithMessage("Organization domain must start and end with alphanumeric characters and can only contain lowercase letters, numbers, and hyphens")
            .MinimumLength(3).WithMessage("Organization domain must be at least 3 characters long")
            .Must(BeValidDomain).WithMessage("Organization domain is not valid")
            .When(x => !string.IsNullOrEmpty(x.OrganizationDomain));
    }

    /// <summary>
    /// Validates that the email format is valid according to RFC standards
    /// </summary>
    private static bool BeValidEmailFormat(string? input)
    {
        if (string.IsNullOrEmpty(input))
            return false;

        // Check for consecutive dots in the local part (before @)
        var atIndex = input.IndexOf('@');
        if (atIndex > 0)
        {
            var localPart = input.Substring(0, atIndex);
            if (localPart.Contains(".."))
                return false;
        }

        // Check for consecutive dots in the domain part (after @)
        if (atIndex >= 0 && atIndex < input.Length - 1)
        {
            var domainPart = input.Substring(atIndex + 1);
            if (domainPart.Contains(".."))
                return false;
        }

        return true;
    }

    /// <summary>
    /// Validates that the input is safe from XSS attacks
    /// </summary>
    private static bool BeSafeFromXSS(string? input)
    {
        if (string.IsNullOrEmpty(input))
            return true;

        // Check for critical XSS patterns only - more permissive for legitimate text
        var dangerousPatterns = new[]
        {
            "<script", "</script>", "javascript:", "vbscript:", "data:text/html",
            "onload=", "onerror=", "onclick=", "onmouseover=", "onfocus=",
            "eval(", "expression(", "alert(", "confirm(", "prompt(",
            "document.cookie", "document.write", "innerHTML", "outerHTML"
        };

        var lowerInput = input.ToLowerInvariant();
        return !dangerousPatterns.Any(pattern => lowerInput.Contains(pattern.ToLowerInvariant()));
    }

    /// <summary>
    /// Validates that the domain is valid and not reserved
    /// </summary>
    private static bool BeValidDomain(string? input)
    {
        if (string.IsNullOrEmpty(input))
            return false;

        // Check for critical reserved domains only
        var reservedDomains = new[]
        {
            "www", "api", "admin", "app", "mail", "ftp",
            "localhost", "local", "internal", "secure", "ssl", "tls",
            "cdn", "static", "assets"
        };

        var lowerInput = input.ToLowerInvariant();
        
        // Check if it's a reserved domain
        if (reservedDomains.Contains(lowerInput))
            return false;

        // Check for invalid patterns
        if (lowerInput.StartsWith("-") || lowerInput.EndsWith("-"))
            return false;

        if (lowerInput.Contains("--"))
            return false;

        // Check for minimum length (already handled by regex, but double-check)
        if (lowerInput.Length < 3)
            return false;

        return true;
    }
}

/// <summary>
/// Validator for LoginRequest
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");

        RuleFor(x => x.OrganizationDomain)
            .NotEmpty().WithMessage("Organization domain is required")
            .MaximumLength(100).WithMessage("Organization domain cannot exceed 100 characters");
    }
}

/// <summary>
/// Validator for ResetPasswordRequest
/// </summary>
public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.OrganizationDomain)
            .NotEmpty().WithMessage("Organization domain is required")
            .MaximumLength(100).WithMessage("Organization domain cannot exceed 100 characters");
    }
}

/// <summary>
/// Validator for ConfirmResetPasswordRequest
/// </summary>
public class ConfirmResetPasswordRequestValidator : AbstractValidator<ConfirmResetPasswordRequest>
{
    public ConfirmResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Reset token is required");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)").WithMessage("Password must contain at least one lowercase letter, one uppercase letter, and one digit");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Password confirmation is required")
            .Equal(x => x.NewPassword).WithMessage("Password and confirmation password do not match");
    }
}

/// <summary>
/// Validator for RefreshTokenRequest
/// </summary>
public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}
