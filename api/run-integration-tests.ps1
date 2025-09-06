# Script PowerShell pour exécuter les tests d'intégration avec Docker Compose
# Usage: .\run-integration-tests.ps1

param(
    [switch]$SkipCleanup
)

# Fonction pour afficher les logs colorés
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Info "🚀 Démarrage des tests d'intégration avec Docker Compose..."

# Vérifier si Docker est en cours d'exécution
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker n'est pas en cours d'exécution"
    }
} catch {
    Write-Error "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
}

# Vérifier si Docker Compose est disponible
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Error "Docker Compose n'est pas installé."
    exit 1
}

Write-Info "Arrêt des conteneurs existants (si nécessaire)..."
docker-compose -f docker-compose.test.yml down -v

Write-Info "Démarrage des services de test..."
docker-compose -f docker-compose.test.yml up -d

Write-Info "Attente que PostgreSQL soit prêt..."
Start-Sleep -Seconds 10

# Vérifier que PostgreSQL est prêt
Write-Info "Vérification de la connexion PostgreSQL..."
$maxAttempts = 30
$attempt = 1

while ($attempt -le $maxAttempts) {
    try {
        docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U test -d leadtracker_test | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PostgreSQL est prêt !"
            break
        }
    } catch {
        # Continue to next attempt
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Error "PostgreSQL n'est pas prêt après $maxAttempts tentatives."
        docker-compose -f docker-compose.test.yml logs postgres-test
        exit 1
    }
    
    Write-Info "Tentative $attempt/$maxAttempts - Attente de PostgreSQL..."
    Start-Sleep -Seconds 2
    $attempt++
}

Write-Info "Exécution des tests d'intégration..."
$testResult = 0

try {
    dotnet test tests/LeadTracker.IntegrationTests/LeadTracker.IntegrationTests.csproj --filter "FullyQualifiedName~DockerCompose" --verbosity normal
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tous les tests d'intégration ont réussi !"
    } else {
        Write-Error "Certains tests d'intégration ont échoué."
        $testResult = 1
    }
} catch {
    Write-Error "Erreur lors de l'exécution des tests: $_"
    $testResult = 1
}

if (-not $SkipCleanup) {
    Write-Info "Arrêt des services de test..."
    docker-compose -f docker-compose.test.yml down -v
}

if ($testResult -eq 0) {
    Write-Success "Tests d'intégration terminés avec succès !"
    exit 0
} else {
    Write-Error "Tests d'intégration échoués."
    exit 1
}
