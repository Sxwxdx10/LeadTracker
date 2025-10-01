#!/bin/bash

# Script pour configurer Docker Hub avec GitLab CI
# Usage: ./scripts/setup-dockerhub.sh

set -e

echo "🐳 Configuration Docker Hub pour GitLab CI..."
echo "============================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
echo "🎯 Ce script va vous aider à configurer Docker Hub pour votre projet LeadTracker"
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé."
    echo "📥 Installez Docker Desktop depuis: https://www.docker.com/products/docker-desktop"
    exit 1
fi

log_info "Docker est installé ✅"

# Vérifier si l'utilisateur est connecté à Docker Hub
if ! docker info | grep -q "Username"; then
    log_warn "Vous n'êtes pas connecté à Docker Hub"
    echo ""
    echo "🔐 Connexion à Docker Hub requise..."
    read -p "Nom d'utilisateur Docker Hub: " dockerhub_username
    read -s -p "Mot de passe Docker Hub: " dockerhub_password
    echo ""
    
    echo "$dockerhub_password" | docker login --username "$dockerhub_username" --password-stdin
    
    if [ $? -eq 0 ]; then
        log_info "Connecté à Docker Hub avec succès ✅"
    else
        log_error "Échec de la connexion à Docker Hub"
        exit 1
    fi
else
    dockerhub_username=$(docker info | grep "Username" | awk '{print $2}')
    log_info "Déjà connecté à Docker Hub en tant que: $dockerhub_username ✅"
fi

echo ""
log_step "Configuration des variables GitLab CI/CD"
echo "=========================================="

echo ""
echo "📋 Variables à ajouter dans GitLab:"
echo ""

# Générer un token d'accès Docker Hub
echo "🔑 Génération d'un token d'accès Docker Hub..."
echo ""
echo "1. Allez sur: https://hub.docker.com/settings/security"
echo "2. Cliquez sur 'New Access Token'"
echo "3. Donnez un nom: 'GitLab CI'"
echo "4. Copiez le token généré"
echo ""

read -p "Token d'accès Docker Hub (ou appuyez sur Entrée pour utiliser le mot de passe): " access_token

if [ -z "$access_token" ]; then
    read -s -p "Mot de passe Docker Hub: " dockerhub_password
    echo ""
    access_token="$dockerhub_password"
fi

echo ""
echo "🎉 Configuration GitLab CI/CD:"
echo "============================="
echo ""
echo "Allez dans GitLab > Settings > CI/CD > Variables"
echo ""
echo "Ajoutez ces variables:"
echo ""
echo "1. Variable 1:"
echo "   Key: DOCKERHUB_USERNAME"
echo "   Value: $dockerhub_username"
echo "   ✅ Mask variable"
echo "   ✅ Protect variable"
echo ""
echo "2. Variable 2:"
echo "   Key: DOCKERHUB_PASSWORD"
echo "   Value: $access_token"
echo "   ✅ Mask variable"
echo "   ✅ Protect variable"
echo ""

# Créer un fichier de configuration
config_file="dockerhub-gitlab-config.txt"
cat > "$config_file" << EOF
# Configuration Docker Hub pour GitLab CI/CD
# Date: $(date)

DOCKERHUB_USERNAME=$dockerhub_username
DOCKERHUB_PASSWORD=$access_token

# Instructions pour GitLab:
# 1. Aller dans Settings > CI/CD > Variables
# 2. Ajouter ces variables avec "Mask variable" et "Protect variable" activés
# 3. Remplacer .gitlab-ci.yml par .gitlab-ci-dockerhub.yml
EOF

log_info "Configuration sauvegardée dans: $config_file"

echo ""
log_step "Test de la configuration"
echo "========================"

# Tester la connexion
echo "🧪 Test de la connexion Docker Hub..."
if docker pull hello-world > /dev/null 2>&1; then
    log_info "Connexion Docker Hub fonctionnelle ✅"
else
    log_warn "Problème de connexion Docker Hub ⚠️"
fi

echo ""
log_step "Migration vers Docker Hub"
echo "=========================="

echo ""
echo "🔄 Pour migrer vers Docker Hub:"
echo ""
echo "1. Remplacez .gitlab-ci.yml par .gitlab-ci-dockerhub.yml:"
echo "   mv .gitlab-ci.yml .gitlab-ci-azure.yml"
echo "   mv .gitlab-ci-dockerhub.yml .gitlab-ci.yml"
echo ""
echo "2. Ou modifiez manuellement le fichier .gitlab-ci.yml"
echo ""
echo "3. Testez le pipeline sur une branche de développement"
echo ""

read -p "Voulez-vous faire la migration maintenant ? (y/N): " migrate_now

if [ "$migrate_now" = "y" ] || [ "$migrate_now" = "Y" ]; then
    log_step "Migration en cours..."
    
    # Sauvegarder l'ancienne configuration
    if [ -f ".gitlab-ci.yml" ]; then
        mv .gitlab-ci.yml .gitlab-ci-azure.yml
        log_info "Ancienne configuration sauvegardée dans .gitlab-ci-azure.yml"
    fi
    
    # Utiliser la nouvelle configuration
    mv .gitlab-ci-dockerhub.yml .gitlab-ci.yml
    log_info "Nouvelle configuration Docker Hub activée"
    
    echo ""
    log_info "✅ Migration terminée !"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Ajoutez les variables dans GitLab"
    echo "2. Testez le pipeline sur une branche de développement"
    echo "3. Vérifiez que les images sont poussées sur Docker Hub"
    echo ""
else
    echo ""
    log_info "Migration reportée. Vous pouvez la faire plus tard."
fi

echo ""
echo "🎓 Avantages de Docker Hub pour l'apprentissage:"
echo "=============================================="
echo "✅ Gratuit et simple"
echo "✅ Comprendre les concepts de CI/CD"
echo "✅ Expérience pratique avec Docker"
echo "✅ Workflow réaliste d'entreprise"
echo "✅ Pas de complexité Azure"
echo ""

log_info "Configuration terminée ! 🎉"
