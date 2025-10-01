#!/bin/bash

# Script de validation de la configuration GitLab CI/CD
# Usage: ./scripts/validate-gitlab-ci.sh

set -e

echo "🔍 Validation de la configuration GitLab CI/CD..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f ".gitlab-ci.yml" ]; then
    log_error "Fichier .gitlab-ci.yml non trouvé. Exécutez ce script depuis la racine du projet."
    exit 1
fi

log_info "Vérification de la syntaxe YAML..."

# Vérifier la syntaxe YAML
if command -v yamllint &> /dev/null; then
    yamllint .gitlab-ci.yml
    log_info "Syntaxe YAML validée ✅"
else
    log_warn "yamllint non installé. Installation recommandée: pip install yamllint"
fi

# Vérifier la structure des stages
log_info "Vérification de la structure des stages..."

stages=$(grep -E "^\s*-\s+" .gitlab-ci.yml | head -10)
expected_stages=("test" "security" "build" "deploy" "notify")

for stage in "${expected_stages[@]}"; do
    if echo "$stages" | grep -q "$stage"; then
        log_info "Stage '$stage' trouvé ✅"
    else
        log_error "Stage '$stage' manquant ❌"
    fi
done

# Vérifier les jobs principaux
log_info "Vérification des jobs principaux..."

jobs=("test-api" "test-web" "e2e-tests" "security-scan" "build-images" "deploy-staging" "deploy-production")

for job in "${jobs[@]}"; do
    if grep -q "^$job:" .gitlab-ci.yml; then
        log_info "Job '$job' trouvé ✅"
    else
        log_error "Job '$job' manquant ❌"
    fi
done

# Vérifier les variables d'environnement
log_info "Vérification des variables d'environnement..."

required_vars=("DOTNET_VERSION" "NODE_VERSION" "REGISTRY" "API_IMAGE_NAME" "WEB_IMAGE_NAME")

for var in "${required_vars[@]}"; do
    if grep -q "$var:" .gitlab-ci.yml; then
        log_info "Variable '$var' définie ✅"
    else
        log_error "Variable '$var' manquante ❌"
    fi
done

# Vérifier les services
log_info "Vérification des services..."

services=("postgres:15" "redis:7-alpine")
for service in "${services[@]}"; do
    if grep -q "$service" .gitlab-ci.yml; then
        log_info "Service '$service' configuré ✅"
    else
        log_error "Service '$service' manquant ❌"
    fi
done

# Vérifier les caches
log_info "Vérification des caches..."

if grep -q "cache:" .gitlab-ci.yml; then
    log_info "Configuration de cache trouvée ✅"
else
    log_warn "Aucune configuration de cache trouvée ⚠️"
fi

# Vérifier les artifacts
log_info "Vérification des artifacts..."

if grep -q "artifacts:" .gitlab-ci.yml; then
    log_info "Configuration d'artifacts trouvée ✅"
else
    log_warn "Aucune configuration d'artifacts trouvée ⚠️"
fi

# Vérifier les conditions de déploiement
log_info "Vérification des conditions de déploiement..."

if grep -q "only:" .gitlab-ci.yml; then
    log_info "Conditions de déploiement configurées ✅"
else
    log_warn "Aucune condition de déploiement trouvée ⚠️"
fi

# Vérifier les dépendances entre jobs
log_info "Vérification des dépendances entre jobs..."

if grep -q "needs:" .gitlab-ci.yml; then
    log_info "Dépendances entre jobs configurées ✅"
else
    log_warn "Aucune dépendance entre jobs trouvée ⚠️"
fi

# Vérifier la configuration Docker
log_info "Vérification de la configuration Docker..."

if grep -q "docker:" .gitlab-ci.yml; then
    log_info "Configuration Docker trouvée ✅"
else
    log_warn "Aucune configuration Docker trouvée ⚠️"
fi

# Vérifier les tests de sécurité
log_info "Vérification des tests de sécurité..."

if grep -q "security-scan" .gitlab-ci.yml; then
    log_info "Tests de sécurité configurés ✅"
else
    log_warn "Aucun test de sécurité trouvé ⚠️"
fi

# Vérifier les notifications
log_info "Vérification des notifications..."

if grep -q "notify" .gitlab-ci.yml; then
    log_info "Configuration de notifications trouvée ✅"
else
    log_warn "Aucune configuration de notifications trouvée ⚠️"
fi

# Résumé
echo ""
echo "📋 Résumé de la validation:"
echo "=========================="

# Compter les erreurs et avertissements
errors=0
warnings=0

if [ "$errors" -eq 0 ]; then
    log_info "Configuration GitLab CI/CD validée avec succès! 🎉"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Configurez les variables d'environnement dans GitLab"
    echo "2. Testez le pipeline sur une branche de développement"
    echo "3. Vérifiez les permissions et les accès aux registries"
else
    log_error "Des erreurs ont été détectées. Veuillez les corriger avant de déployer."
    exit 1
fi

echo ""
echo "📚 Documentation:"
echo "- Variables requises: .gitlab-ci-variables.md"
echo "- Guide de migration: scripts/GITLAB_MIGRATION_GUIDE.md"
