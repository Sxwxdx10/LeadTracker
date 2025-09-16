#!/bin/bash

echo "🔧 Testing Lead Tracker Infrastructure Fixes"
echo "=============================================="

# Change to the API directory
cd "$(dirname "$0")"

echo ""
echo "1. 🐳 Testing Docker Compose Setup..."
echo "------------------------------------"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker Compose found"

# Start Docker Compose for testing
echo "Starting PostgreSQL test container..."
docker-compose -f docker-compose.test.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Test connection
if docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U test -d leadtracker_test; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL connection failed"
    docker-compose -f docker-compose.test.yml logs postgres-test
    docker-compose -f docker-compose.test.yml down
    exit 1
fi

echo ""
echo "2. 🧪 Running Basic Integration Tests..."
echo "--------------------------------------"

# Run a subset of tests to verify infrastructure
echo "Running PostgreSQL container tests..."
dotnet test tests/LeadTracker.IntegrationTests/Infrastructure/PostgreSqlIntegrityConstraintTests.cs --logger "console;verbosity=normal" --no-build

echo ""
echo "Running Docker Compose tests..."
dotnet test tests/LeadTracker.IntegrationTests/Infrastructure/DockerComposeIntegrityConstraintTests.cs --logger "console;verbosity=normal" --no-build

echo ""
echo "3. 🧹 Cleanup..."
echo "---------------"

# Stop Docker Compose
docker-compose -f docker-compose.test.yml down

echo "✅ Infrastructure test completed!"
echo ""
echo "Next steps:"
echo "- Run full test suite: dotnet test"
echo "- Check test results in test_results.txt"
echo "- Fix any remaining test failures"
