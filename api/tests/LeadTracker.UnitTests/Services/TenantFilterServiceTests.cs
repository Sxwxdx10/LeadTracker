using Microsoft.Extensions.Logging;
using Moq;
using LeadTracker.Core.Services;
using Xunit;

namespace LeadTracker.UnitTests.Services;

public class TenantFilterServiceTests
{
    private readonly Mock<ITenantContext> _mockTenantContext;
    private readonly Mock<ILogger<TenantFilterService>> _mockLogger;
    private readonly TenantFilterService _service;

    public TenantFilterServiceTests()
    {
        _mockTenantContext = new Mock<ITenantContext>();
        _mockLogger = new Mock<ILogger<TenantFilterService>>();
        _service = new TenantFilterService(_mockTenantContext.Object, _mockLogger.Object);
    }

    [Fact]
    public void GetCurrentOrganizationId_WhenTenantContextHasOrgId_ReturnsOrgId()
    {
        // Arrange
        var expectedOrgId = Guid.NewGuid();
        _mockTenantContext.Setup(x => x.OrganizationId).Returns(expectedOrgId);

        // Act
        var result = _service.GetCurrentOrganizationId();

        // Assert
        Assert.Equal(expectedOrgId, result);
    }

    [Fact]
    public void GetCurrentOrganizationId_WhenTenantContextHasNoOrgId_ReturnsNull()
    {
        // Arrange
        _mockTenantContext.Setup(x => x.OrganizationId).Returns((Guid?)null);

        // Act
        var result = _service.GetCurrentOrganizationId();

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void HasTenantContext_WhenOrgIdExists_ReturnsTrue()
    {
        // Arrange
        _mockTenantContext.Setup(x => x.OrganizationId).Returns(Guid.NewGuid());

        // Act
        var result = _service.HasTenantContext();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void HasTenantContext_WhenOrgIdIsNull_ReturnsFalse()
    {
        // Arrange
        _mockTenantContext.Setup(x => x.OrganizationId).Returns((Guid?)null);

        // Act
        var result = _service.HasTenantContext();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void GetCurrentOrganizationName_WhenOrgNameExists_ReturnsOrgName()
    {
        // Arrange
        var expectedOrgName = "Test Organization";
        _mockTenantContext.Setup(x => x.OrganizationName).Returns(expectedOrgName);

        // Act
        var result = _service.GetCurrentOrganizationName();

        // Assert
        Assert.Equal(expectedOrgName, result);
    }

    [Fact]
    public void GetCurrentOrganizationName_WhenOrgNameIsNull_ReturnsNull()
    {
        // Arrange
        _mockTenantContext.Setup(x => x.OrganizationName).Returns((string?)null);

        // Act
        var result = _service.GetCurrentOrganizationName();

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void Constructor_WithNullTenantContext_ThrowsArgumentNullException()
    {
        // Arrange & Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new TenantFilterService(null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_WithNullLogger_ThrowsArgumentNullException()
    {
        // Arrange & Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new TenantFilterService(_mockTenantContext.Object, null!));
    }
}
