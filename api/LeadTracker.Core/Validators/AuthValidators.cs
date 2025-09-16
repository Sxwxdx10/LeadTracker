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
            .NotEmpty().WithMessage("Organization domain is required")
            .MaximumLength(100).WithMessage("Organization domain cannot exceed 100 characters")
            .Matches(@"^[a-z0-9]([a-z0-9-]*[a-z0-9])?$").WithMessage("Organization domain must start and end with alphanumeric characters and can only contain lowercase letters, numbers, and hyphens")
            .MinimumLength(3).WithMessage("Organization domain must be at least 3 characters long")
            .Must(BeValidDomain).WithMessage("Organization domain is not valid");
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

        // Check for common XSS patterns
        var dangerousPatterns = new[]
        {
            "<script", "</script>", "javascript:", "onload=", "onerror=", "onclick=",
            "onmouseover=", "onfocus=", "onblur=", "onchange=", "onsubmit=",
            "onkeydown=", "onkeyup=", "onkeypress=", "onmousedown=", "onmouseup=",
            "onmouseout=", "onmouseover=", "onmousemove=", "onmouseleave=",
            "oncontextmenu=", "ondblclick=", "onresize=", "onscroll=", "onunload=",
            "onbeforeunload=", "onpagehide=", "onpageshow=", "onpopstate=",
            "onstorage=", "onhashchange=", "onmessage=", "ononline=", "onoffline=",
            "onbeforeprint=", "onafterprint=", "onabort=", "oncanplay=", "oncanplaythrough=",
            "ondurationchange=", "onemptied=", "onended=", "onerror=", "onloadeddata=",
            "onloadedmetadata=", "onloadstart=", "onpause=", "onplay=", "onplaying=",
            "onprogress=", "onratechange=", "onseeked=", "onseeking=", "onstalled=",
            "onsuspend=", "ontimeupdate=", "onvolumechange=", "onwaiting=",
            "data:text/html", "vbscript:", "livescript:", "mocha:", "charset=",
            "&#x", "&#X", "&#60", "&#62", "&#34", "&#39", "&#x3C", "&#x3E",
            "&#x22", "&#x27", "&#x2F", "&#x2F", "&#x2F", "&#x2F", "&#x2F",
            "expression(", "url(", "import(", "eval(", "setTimeout(", "setInterval(",
            "Function(", "constructor(", "prototype.", "__proto__", "constructor",
            "alert(", "confirm(", "prompt(", "document.", "window.", "location.",
            "history.", "navigator.", "screen.", "localStorage.", "sessionStorage.",
            "cookie", "document.cookie", "document.write", "document.writeln",
            "innerHTML", "outerHTML", "insertAdjacentHTML", "insertAdjacentText",
            "createElement", "createTextNode", "appendChild", "insertBefore",
            "removeChild", "replaceChild", "cloneNode", "importNode", "adoptNode",
            "getElementById", "getElementsByTagName", "getElementsByClassName",
            "querySelector", "querySelectorAll", "getAttribute", "setAttribute",
            "removeAttribute", "hasAttribute", "getAttributeNode", "setAttributeNode",
            "removeAttributeNode", "hasAttributeNode", "getNamedItem", "setNamedItem",
            "removeNamedItem", "item", "length", "name", "value", "type", "id",
            "className", "classList", "style", "title", "lang", "dir", "tabIndex",
            "accessKey", "draggable", "hidden", "spellcheck", "translate", "contentEditable",
            "isContentEditable", "contextMenu", "dropzone", "hidden", "spellcheck",
            "translate", "contentEditable", "isContentEditable", "contextMenu", "dropzone"
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

        // Check for reserved domains and invalid patterns
        var reservedDomains = new[]
        {
            "www", "api", "admin", "app", "mail", "ftp", "blog", "shop", "store",
            "support", "help", "docs", "test", "dev", "staging", "prod", "production",
            "localhost", "local", "internal", "private", "secure", "ssl", "tls",
            "cdn", "static", "assets", "images", "img", "css", "js", "jsx", "ts",
            "tsx", "php", "asp", "jsp", "cgi", "bin", "lib", "src", "dist", "build",
            "public", "private", "tmp", "temp", "cache", "logs", "backup", "archive",
            "old", "new", "beta", "alpha", "rc", "release", "v1", "v2", "v3",
            "version", "latest", "stable", "unstable", "experimental", "demo",
            "example", "sample", "template", "default", "custom", "user", "users",
            "account", "accounts", "profile", "profiles", "settings", "config",
            "configuration", "setup", "install", "uninstall", "update", "upgrade",
            "downgrade", "rollback", "restore", "backup", "export", "import",
            "sync", "synchronize", "refresh", "reload", "restart", "stop", "start",
            "pause", "resume", "cancel", "abort", "retry", "skip", "next", "previous",
            "first", "last", "begin", "end", "start", "finish", "complete", "done",
            "success", "error", "warning", "info", "debug", "trace", "log", "logs",
            "status", "health", "ping", "pong", "echo", "test", "check", "validate",
            "verify", "confirm", "approve", "reject", "accept", "decline", "deny",
            "allow", "block", "ban", "unban", "enable", "disable", "activate",
            "deactivate", "suspend", "unsuspend", "lock", "unlock", "freeze", "unfreeze",
            "archive", "unarchive", "delete", "remove", "add", "create", "new",
            "edit", "update", "modify", "change", "replace", "swap", "move", "copy",
            "duplicate", "clone", "fork", "merge", "split", "join", "combine",
            "separate", "divide", "multiply", "subtract", "add", "calculate", "compute",
            "process", "execute", "run", "launch", "start", "stop", "pause", "resume",
            "cancel", "abort", "retry", "skip", "next", "previous", "first", "last",
            "begin", "end", "start", "finish", "complete", "done", "success", "error",
            "warning", "info", "debug", "trace", "log", "logs", "status", "health",
            "ping", "pong", "echo", "test", "check", "validate", "verify", "confirm",
            "approve", "reject", "accept", "decline", "deny", "allow", "block", "ban",
            "unban", "enable", "disable", "activate", "deactivate", "suspend", "unsuspend",
            "lock", "unlock", "freeze", "unfreeze", "archive", "unarchive", "delete",
            "remove", "add", "create", "new", "edit", "update", "modify", "change",
            "replace", "swap", "move", "copy", "duplicate", "clone", "fork", "merge",
            "split", "join", "combine", "separate", "divide", "multiply", "subtract",
            "add", "calculate", "compute", "process", "execute", "run", "launch"
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
