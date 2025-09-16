using Microsoft.Extensions.Logging;
using Moq;

namespace LeadTracker.UnitTests.Common;

/// <summary>
/// Base class for all unit tests
/// Provides common utilities and mocks
/// </summary>
public abstract class UnitTestBase
{
    /// <summary>
    /// Create a mock logger for testing
    /// </summary>
    protected Mock<ILogger<T>> CreateMockLogger<T>()
    {
        return new Mock<ILogger<T>>();
    }

    /// <summary>
    /// Create a mock logger factory
    /// </summary>
    protected Mock<ILoggerFactory> CreateMockLoggerFactory()
    {
        var mockLoggerFactory = new Mock<ILoggerFactory>();
        var mockLogger = new Mock<ILogger>();
        
        mockLoggerFactory.Setup(x => x.CreateLogger(It.IsAny<string>()))
                        .Returns(mockLogger.Object);
        
        return mockLoggerFactory;
    }

    /// <summary>
    /// Verify that a logger was called with specific parameters
    /// </summary>
    protected void VerifyLogCall<T>(Mock<ILogger<T>> mockLogger, LogLevel level, string message)
    {
        mockLogger.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(message)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}

