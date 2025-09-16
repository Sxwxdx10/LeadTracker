using Xunit;
using LeadTracker.IntegrationTests.Infrastructure;

namespace LeadTracker.IntegrationTests.Common;

/// <summary>
/// Unified collection for all database-related tests
/// This replaces multiple individual collections for better organization
/// </summary>
[CollectionDefinition(TestCollections.Database)]
public class DatabaseTestCollection : ICollectionFixture<IntegrityConstraintTestFixture>
{
    // This collection uses the IntegrityConstraintTestFixture which provides
    // PostgreSQL container setup and proper isolation for database tests
}

