# Script PowerShell pour tester le système de seeding
# Usage: .\test-seeding.ps1 -BaseUrl "http://localhost:8080" -Token "your-jwt-token" -OrgId "your-org-id"

param(
    [string]$BaseUrl = "http://localhost:8080",
    [Parameter(Mandatory=$true)]
    [string]$Token,
    [Parameter(Mandatory=$true)]
    [string]$OrgId
)

Write-Host "🧪 Test du système de seeding LeadTracker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Organization ID: $OrgId" -ForegroundColor Yellow
Write-Host ""

# Headers pour les requêtes
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $Token"
    "X-Org-Id" = $OrgId
}

Write-Host "1️⃣ Test de seeding des stages..." -ForegroundColor Green
Write-Host "--------------------------------" -ForegroundColor Green

try {
    $stagesResponse = Invoke-RestMethod -Uri "$BaseUrl/api/seed/stages" -Method POST -Headers $headers
    Write-Host "✅ Stages créés avec succès" -ForegroundColor Green
    $stagesResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur lors de la création des stages" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2️⃣ Test de seeding des utilisateurs..." -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Green

try {
    $usersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/seed/users" -Method POST -Headers $headers
    Write-Host "✅ Utilisateurs créés avec succès" -ForegroundColor Green
    $usersResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur lors de la création des utilisateurs" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3️⃣ Test de seeding des leads (20 leads)..." -ForegroundColor Green
Write-Host "------------------------------------------" -ForegroundColor Green

try {
    $leadsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/seed/leads?count=20" -Method POST -Headers $headers
    Write-Host "✅ Leads créés avec succès" -ForegroundColor Green
    $leadsResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur lors de la création des leads" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4️⃣ Test de seeding complet (5 leads)..." -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Green

try {
    $allResponse = Invoke-RestMethod -Uri "$BaseUrl/api/seed/all?leadCount=5" -Method POST -Headers $headers
    Write-Host "✅ Seeding complet réussi" -ForegroundColor Green
    $allResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur lors du seeding complet" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Tests terminés !" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
