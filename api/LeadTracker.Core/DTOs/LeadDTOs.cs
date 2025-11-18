using System.ComponentModel.DataAnnotations;

namespace LeadTracker.Core.DTOs;

/// <summary>
/// DTO for creating a new lead
/// </summary>
public class CreateLeadDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? FirstName { get; set; }
    
    [MaxLength(100)]
    public string? LastName { get; set; }
    
    [MaxLength(255)]
    [EmailAddress]
    public string? Email { get; set; }
    
    [MaxLength(20)]
    [RegularExpression(@"^\+?1\d{10}$", ErrorMessage = "Phone number must be in Canadian format (+19999999999)")]
    public string? PhoneNumber { get; set; }
    
    [MaxLength(255)]
    [Url]
    public string? Website { get; set; }
    
    [MaxLength(200)]
    public string? Company { get; set; }
    
    [MaxLength(100)]
    public string? JobTitle { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Estimated value must be positive")]
    public decimal? EstimatedValue { get; set; }
    
    [Range(0, 100, ErrorMessage = "Probability must be between 0 and 100")]
    public int Probability { get; set; } = 50;
    
    public DateTime? ExpectedCloseDate { get; set; }
    
    [MaxLength(2000)]
    public string? Notes { get; set; }
    
    [MaxLength(50)]
    public string? Source { get; set; }
    
    [Required]
    public Guid StageId { get; set; }
    
    public Guid? AssignedUserId { get; set; }
}

/// <summary>
/// DTO for updating an existing lead
/// </summary>
public class UpdateLeadDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? FirstName { get; set; }
    
    [MaxLength(100)]
    public string? LastName { get; set; }
    
    [MaxLength(255)]
    [EmailAddress]
    public string? Email { get; set; }
    
    [MaxLength(20)]
    [RegularExpression(@"^\+?1\d{10}$", ErrorMessage = "Phone number must be in Canadian format (+19999999999)")]
    public string? PhoneNumber { get; set; }
    
    [MaxLength(255)]
    [Url]
    public string? Website { get; set; }
    
    [MaxLength(200)]
    public string? Company { get; set; }
    
    [MaxLength(100)]
    public string? JobTitle { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Estimated value must be positive")]
    public decimal? EstimatedValue { get; set; }
    
    [Range(0, 100, ErrorMessage = "Probability must be between 0 and 100")]
    public int Probability { get; set; } = 50;
    
    public DateTime? ExpectedCloseDate { get; set; }
    
    [MaxLength(2000)]
    public string? Notes { get; set; }
    
    [MaxLength(50)]
    public string? Source { get; set; }
    
    [MaxLength(20)]
    public string Status { get; set; } = "Open";
    
    public DateTime? LastContactedAt { get; set; }
    
    [Required]
    public Guid StageId { get; set; }
    
    public Guid? AssignedUserId { get; set; }
}

/// <summary>
/// DTO for lead response with related data
/// </summary>
public class LeadResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? Company { get; set; }
    public string? JobTitle { get; set; }
    public decimal? EstimatedValue { get; set; }
    public int Probability { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? LastContactedAt { get; set; }
    public Guid StageId { get; set; }
    public Guid? AssignedUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Related data
    public string? StageName { get; set; }
    public string? AssignedUserName { get; set; }
    public string FullName { get; set; } = string.Empty;
    public bool IsQualified { get; set; }
}

/// <summary>
/// DTO for lead list response with pagination
/// </summary>
public class LeadListResponseDto
{
    public List<LeadResponseDto> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}

/// <summary>
/// DTO for search suggestions
/// </summary>
public class SearchSuggestionDto
{
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "name", "email", "company", "notes"
    public int Count { get; set; }
}

/// <summary>
/// DTO for lead query parameters
/// </summary>
public class LeadQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Guid? StageId { get; set; }
    public Guid? AssignedUserId { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortDirection { get; set; } = "desc";
    public string? Status { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
}

/// <summary>
/// DTO for user registration request
/// </summary>
public class RegisterRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? FirstName { get; set; }
    
    [MaxLength(100)]
    public string? LastName { get; set; }
    
    [MaxLength(200)]
    public string? OrganizationName { get; set; }
}

/// <summary>
/// DTO for user login request
/// </summary>
public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO for authentication response
/// </summary>
public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Message { get; set; }
}
