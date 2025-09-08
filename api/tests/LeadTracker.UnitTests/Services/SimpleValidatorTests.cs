using FluentValidation.TestHelper;
using LeadTracker.Core.Models;
using LeadTracker.Core.Validators;
using Xunit;

namespace LeadTracker.UnitTests.Services;

/// <summary>
/// Simple validator tests
/// </summary>
public class SimpleValidatorTests
{
    private readonly RegisterRequestValidator _registerValidator;
    private readonly LoginRequestValidator _loginValidator;
    private readonly RefreshTokenRequestValidator _refreshTokenValidator;

    public SimpleValidatorTests()
    {
        _registerValidator = new RegisterRequestValidator();
        _loginValidator = new LoginRequestValidator();
        _refreshTokenValidator = new RefreshTokenRequestValidator();
    }

    #region RegisterRequestValidator Tests

    [Fact]
    public void RegisterRequest_WithValidData_ShouldNotHaveValidationError()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            OrganizationName = "Test Corp",
            OrganizationDescription = "Test organization",
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void RegisterRequest_WithInvalidFirstName_ShouldHaveValidationError(string firstName)
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = firstName,
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            OrganizationName = "Test Corp",
            OrganizationDescription = "Test organization",
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("invalid-email")]
    [InlineData("@example.com")]
    [InlineData("john@")]
    [InlineData(null)]
    public void RegisterRequest_WithInvalidEmail_ShouldHaveValidationError(string email)
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = email,
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            OrganizationName = "Test Corp",
            OrganizationDescription = "Test organization",
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("123")]
    [InlineData("password")]
    [InlineData("PASSWORD123!")]
    [InlineData("Password")]
    [InlineData(null)]
    public void RegisterRequest_WithInvalidPassword_ShouldHaveValidationError(string password)
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = password,
            ConfirmPassword = password,
            OrganizationName = "Test Corp",
            OrganizationDescription = "Test organization",
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void RegisterRequest_WithMismatchedPasswords_ShouldHaveValidationError()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Password = "Password123!",
            ConfirmPassword = "DifferentPassword123!",
            OrganizationName = "Test Corp",
            OrganizationDescription = "Test organization",
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword);
    }

    #endregion

    #region LoginRequestValidator Tests

    [Fact]
    public void LoginRequest_WithValidData_ShouldNotHaveValidationError()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = "Password123!",
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _loginValidator.TestValidate(request);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("invalid-email")]
    [InlineData(null)]
    public void LoginRequest_WithInvalidEmail_ShouldHaveValidationError(string email)
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = email,
            Password = "Password123!",
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _loginValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void LoginRequest_WithInvalidPassword_ShouldHaveValidationError(string password)
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "john.doe@example.com",
            Password = password,
            OrganizationDomain = "test-corp"
        };

        // Act
        var result = _loginValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    #endregion

    #region RefreshTokenRequestValidator Tests

    [Fact]
    public void RefreshTokenRequest_WithValidToken_ShouldNotHaveValidationError()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            RefreshToken = "valid-refresh-token"
        };

        // Act
        var result = _refreshTokenValidator.TestValidate(request);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void RefreshTokenRequest_WithInvalidToken_ShouldHaveValidationError(string refreshToken)
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            RefreshToken = refreshToken
        };

        // Act
        var result = _refreshTokenValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.RefreshToken);
    }

    #endregion
}
