#!/bin/bash

# Script pour exécuter les tests d'intégration avec Docker Compose
# Usage: ./run-integration-tests.sh

set -e

echo "🚀 Démarrage des tests d'intégration avec Docker Compose..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les logs colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    log_error "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Vérifier si Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose n'est pas installé."
    exit 1
fi

log_info "Arrêt des conteneurs existants (si nécessaire)..."
docker-compose -f docker-compose.test.yml down -v

log_info "Démarrage des services de test..."
docker-compose -f docker-compose.test.yml up -d

log_info "Attente que PostgreSQL soit prêt..."
sleep 10

# Vérifier que PostgreSQL est prêt
log_info "Vérification de la connexion PostgreSQL..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U test -d leadtracker_test > /dev/null 2>&1; then
        log_success "PostgreSQL est prêt !"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL n'est pas prêt après $max_attempts tentatives."
        docker-compose -f docker-compose.test.yml logs postgres-test
        exit 1
    fi
    
    log_info "Tentative $attempt/$max_attempts - Attente de PostgreSQL..."
    sleep 2
    ((attempt++))
done

log_info "Exécution des tests d'intégration..."
if dotnet test tests/LeadTracker.IntegrationTests/LeadTracker.IntegrationTests.csproj --filter "FullyQualifiedName~DockerCompose" --verbosity normal; then
    log_success "Tous les tests d'intégration ont réussi !"
    TEST_RESULT=0
else
    log_error "Certains tests d'intégration ont échoué."
    TEST_RESULT=1
fi

log_info "Arrêt des services de test..."
docker-compose -f docker-compose.test.yml down -v

if [ $TEST_RESULT -eq 0 ]; then
    log_success "Tests d'intégration terminés avec succès !"
    exit 0
else
    log_error "Tests d'intégration échoués."
    exit 1
fi
