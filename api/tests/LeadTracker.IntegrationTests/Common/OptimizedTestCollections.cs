using Xunit;
using LeadTracker.IntegrationTests.Infrastructure;

namespace LeadTracker.IntegrationTests.Common;

/// <summary>
/// Optimized test collections for better performance and organization
/// Replaces multiple individual collections with unified, efficient ones
/// </summary>
public static class OptimizedTestCollections
{
    /// <summary>
    /// Database tests collection - optimized for database operations
    /// Uses shared PostgreSQL container for better performance
    /// </summary>
    public const string Database = "DatabaseTests";
    
    /// <summary>
    /// API tests collection - optimized for HTTP operations
    /// Uses in-memory database for faster execution
    /// </summary>
    public const string Api = "ApiTests";
    
    /// <summary>
    /// Security tests collection - optimized for security testing
    /// Uses isolated containers for security validation
    /// </summary>
    public const string Security = "SecurityTests";
    
    /// <summary>
    /// Performance tests collection - optimized for performance testing
    /// Uses dedicated performance-optimized containers
    /// </summary>
    public const string Performance = "PerformanceTests";
}

/// <summary>
/// Optimized database test collection
/// Provides shared PostgreSQL container for all database tests
/// </summary>
[CollectionDefinition(OptimizedTestCollections.Database)]
public class OptimizedDatabaseTestCollection : ICollectionFixture<OptimizedDatabaseTestFixture>
{
    // This collection uses the optimized database fixture
    // which provides better performance and resource management
}

/// <summary>
/// Optimized API test collection
/// Provides in-memory database for faster API testing
/// </summary>
[CollectionDefinition(OptimizedTestCollections.Api)]
public class OptimizedApiTestCollection : ICollectionFixture<OptimizedApiTestFixture>
{
    // This collection uses the optimized API fixture
    // which provides faster execution for API tests
}

/// <summary>
/// Optimized security test collection
/// Provides isolated containers for security testing
/// </summary>
[CollectionDefinition(OptimizedTestCollections.Security)]
public class OptimizedSecurityTestCollection : ICollectionFixture<OptimizedSecurityTestFixture>
{
    // This collection uses the optimized security fixture
    // which provides isolated environments for security tests
}

/// <summary>
/// Optimized performance test collection
/// Provides performance-optimized containers
/// </summary>
[CollectionDefinition(OptimizedTestCollections.Performance)]
public class OptimizedPerformanceTestCollection : ICollectionFixture<OptimizedPerformanceTestFixture>
{
    // This collection uses the optimized performance fixture
    // which provides dedicated performance testing environment
}
