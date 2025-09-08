# PowerShell script to seed demo data
# Usage: .\seed-demo-data.ps1

Write-Host "🌱 Lead Tracker - Demo Data Seeding Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "LeadTracker.Api.csproj")) {
    Write-Host "❌ Error: Please run this script from the api directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 This script will seed the database with:" -ForegroundColor Yellow
Write-Host "   • 50 realistic leads with varied data" -ForegroundColor White
Write-Host "   • 7 pipeline stages (Initial Contact to Closed Won/Lost)" -ForegroundColor White
Write-Host "   • 1-3 tasks per lead with different types and priorities" -ForegroundColor White
Write-Host "   • 3 sales team members for lead assignment" -ForegroundColor White
Write-Host "   • Realistic probability and estimated values" -ForegroundColor White
Write-Host "   • Varied sources and industries" -ForegroundColor White
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to proceed? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting demo data seeding..." -ForegroundColor Green

try {
    # Build the project first
    Write-Host "🔨 Building project..." -ForegroundColor Yellow
    dotnet build --configuration Release --verbosity quiet
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed. Please fix build errors before seeding." -ForegroundColor Red
        exit 1
    }
    
    # Run the seeding via API endpoint
    Write-Host "🌱 Seeding demo data..." -ForegroundColor Yellow
    
    # Start the API in background
    $apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --project LeadTracker.Api" -PassThru -WindowStyle Hidden
    
    # Wait for API to start
    Write-Host "⏳ Waiting for API to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Get auth token (you might need to adjust this based on your auth setup)
    Write-Host "🔐 Getting authentication token..." -ForegroundColor Yellow
    
    # For now, we'll use a simple approach - you might need to adjust this
    $authResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"john.doe@demo-corp.com","password":"Demo123!"}' -ErrorAction SilentlyContinue
    
    if ($authResponse -and $authResponse.token) {
        $token = $authResponse.token
        Write-Host "✅ Authentication successful" -ForegroundColor Green
        
        # Call the seed endpoint
        Write-Host "🌱 Calling seed endpoint..." -ForegroundColor Yellow
        $seedResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/seed/demo-data" -Method POST -Headers @{"Authorization" = "Bearer $token"} -ContentType "application/json"
        
        if ($seedResponse.success) {
            Write-Host "✅ Demo data seeded successfully!" -ForegroundColor Green
            Write-Host "📊 Seeded data:" -ForegroundColor Yellow
            Write-Host "   • Leads: $($seedResponse.data.leads)" -ForegroundColor White
            Write-Host "   • Stages: $($seedResponse.data.stages)" -ForegroundColor White
            Write-Host "   • Tasks: $($seedResponse.data.tasks)" -ForegroundColor White
            Write-Host "   • Users: $($seedResponse.data.users)" -ForegroundColor White
            Write-Host "   • Organizations: $($seedResponse.data.organizations)" -ForegroundColor White
        } else {
            Write-Host "❌ Seeding failed: $($seedResponse.message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Authentication failed. Please check your credentials." -ForegroundColor Red
    }
    
    # Stop the API process
    Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ An error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Demo data seeding completed!" -ForegroundColor Green
Write-Host "You can now start the API and view the seeded data." -ForegroundColor White
