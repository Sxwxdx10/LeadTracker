using Xunit;

namespace LeadTracker.IntegrationTests.Common;

/// <summary>
/// Unified test collections for better organization and execution control
/// </summary>
public static class TestCollections
{
    /// <summary>
    /// Database-related tests (constraints, performance, etc.)
    /// These tests require database setup and should run in isolation
    /// </summary>
    public const string Database = "DatabaseTests";
    
    /// <summary>
    /// API-related tests (controllers, endpoints, etc.)
    /// These tests require the full application setup
    /// </summary>
    public const string Api = "ApiTests";
    
    /// <summary>
    /// Security-related tests (authentication, authorization, etc.)
    /// These tests require special security configurations
    /// </summary>
    public const string Security = "SecurityTests";
    
    /// <summary>
    /// Performance-related tests
    /// These tests may take longer and should be run separately
    /// </summary>
    public const string Performance = "PerformanceTests";
}

