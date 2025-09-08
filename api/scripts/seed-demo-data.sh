#!/bin/bash

# Bash script to seed demo data
# Usage: ./seed-demo-data.sh

echo "🌱 Lead Tracker - Demo Data Seeding Script"
echo "============================================="

# Check if we're in the correct directory
if [ ! -f "LeadTracker.Api.csproj" ]; then
    echo "❌ Error: Please run this script from the api directory"
    exit 1
fi

echo "📋 This script will seed the database with:"
echo "   • 50 realistic leads with varied data"
echo "   • 7 pipeline stages (Initial Contact to Closed Won/Lost)"
echo "   • 1-3 tasks per lead with different types and priorities"
echo "   • 3 sales team members for lead assignment"
echo "   • Realistic probability and estimated values"
echo "   • Varied sources and industries"
echo ""

# Ask for confirmation
read -p "Do you want to proceed? (y/N): " confirmation
if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting demo data seeding..."

# Build the project first
echo "🔨 Building project..."
dotnet build --configuration Release --verbosity quiet

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before seeding."
    exit 1
fi

# Run the seeding via API endpoint
echo "🌱 Seeding demo data..."

# Start the API in background
dotnet run --project LeadTracker.Api &
API_PID=$!

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 10

# Get auth token (you might need to adjust this based on your auth setup)
echo "🔐 Getting authentication token..."

# For now, we'll use a simple approach - you might need to adjust this
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"john.doe@demo-corp.com","password":"Demo123!"}' 2>/dev/null)

if [ $? -eq 0 ] && echo "$AUTH_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Authentication successful"
    
    # Call the seed endpoint
    echo "🌱 Calling seed endpoint..."
    SEED_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/seed/demo-data" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$SEED_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Demo data seeded successfully!"
        echo "📊 Seeded data:"
        echo "$SEED_RESPONSE" | grep -o '"leads":[0-9]*' | sed 's/"leads":/   • Leads: /'
        echo "$SEED_RESPONSE" | grep -o '"stages":[0-9]*' | sed 's/"stages":/   • Stages: /'
        echo "$SEED_RESPONSE" | grep -o '"tasks":"[^"]*"' | sed 's/"tasks":"/   • Tasks: /' | sed 's/"$//'
        echo "$SEED_RESPONSE" | grep -o '"users":[0-9]*' | sed 's/"users":/   • Users: /'
        echo "$SEED_RESPONSE" | grep -o '"organizations":[0-9]*' | sed 's/"organizations":/   • Organizations: /'
    else
        echo "❌ Seeding failed: $SEED_RESPONSE"
    fi
else
    echo "❌ Authentication failed. Please check your credentials."
fi

# Stop the API process
kill $API_PID 2>/dev/null

echo ""
echo "🎉 Demo data seeding completed!"
echo "You can now start the API and view the seeded data."
