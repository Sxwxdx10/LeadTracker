#!/bin/bash

# Script to test the fixes applied to the Lead Tracker API
# This script runs specific test categories to verify our fixes

echo "🔧 Testing Lead Tracker API Fixes"
echo "=================================="

# Set environment variables
export ASPNETCORE_ENVIRONMENT=Testing
export DOTNET_ENVIRONMENT=Testing
export TESTING_MODE=true

# Change to API directory
cd /Users/franckmb/Documents/LeadTracker/api

echo ""
echo "1. 🧪 Running Unit Tests (should fix logger frozen errors)"
echo "--------------------------------------------------------"
dotnet test tests/LeadTracker.UnitTests/ --logger "console;verbosity=normal" --filter "Category!=Performance" | head -50

echo ""
echo "2. 🔐 Running Security Tests (should fix XSS validation)"
echo "--------------------------------------------------------"
dotnet test tests/LeadTracker.IntegrationTests/ --logger "console;verbosity=normal" --filter "AuthSecurityIntegrationTests" | head -30

echo ""
echo "3. 🏗️ Running PostgreSQL Integration Tests (should fix container errors)"
echo "----------------------------------------------------------------------"
dotnet test tests/LeadTracker.IntegrationTests/ --logger "console;verbosity=normal" --filter "PostgreSqlIntegrityConstraintTests" | head -30

echo ""
echo "4. 📊 Running Performance Tests (should fix FK constraint violations)"
echo "--------------------------------------------------------------------"
dotnet test tests/LeadTracker.IntegrationTests/ --logger "console;verbosity=normal" --filter "PostgreSqlPerformanceTests" | head -30

echo ""
echo "5. 🎯 Running Multi-tenant Tests (should still work)"
echo "---------------------------------------------------"
dotnet test tests/LeadTracker.IntegrationTests/ --logger "console;verbosity=normal" --filter "WorkingTenantIsolationTests" | head -20

echo ""
echo "✅ Test fixes verification completed!"
echo "Check the output above for any remaining errors."
