#!/bin/bash

# Script simplifié pour configurer GitLab avec Docker Hub
# Usage: ./scripts/configure-gitlab-dockerhub.sh

set -e

echo "🐳 Configuration GitLab CI/CD avec Docker Hub"
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

echo ""
echo "🎯 Ce script va vous aider à configurer GitLab CI/CD avec Docker Hub"
echo ""

# Demander les informations Docker Hub
echo "📋 Informations Docker Hub requises:"
echo ""

read -p "Nom d'utilisateur Docker Hub: " dockerhub_username
read -s -p "Token d'accès Docker Hub (ou mot de passe): " dockerhub_password
echo ""

if [ -z "$dockerhub_username" ] || [ -z "$dockerhub_password" ]; then
    echo "❌ Nom d'utilisateur et token/mot de passe requis"
    exit 1
fi

echo ""
log_step "Migration vers Docker Hub"
echo "=========================="

# Sauvegarder l'ancienne configuration
if [ -f ".gitlab-ci.yml" ]; then
    mv .gitlab-ci.yml .gitlab-ci-azure.yml
    log_info "Ancienne configuration Azure sauvegardée dans .gitlab-ci-azure.yml"
fi

# Utiliser la nouvelle configuration Docker Hub
if [ -f ".gitlab-ci-dockerhub.yml" ]; then
    mv .gitlab-ci-dockerhub.yml .gitlab-ci.yml
    log_info "Configuration Docker Hub activée"
else
    log_error "Fichier .gitlab-ci-dockerhub.yml non trouvé"
    exit 1
fi

# Mettre à jour les noms d'images dans le fichier
sed -i.bak "s/votre-username/$dockerhub_username/g" .gitlab-ci.yml
log_info "Noms d'images mis à jour avec votre nom d'utilisateur"

echo ""
log_step "Configuration GitLab CI/CD"
echo "==========================="

echo ""
echo "🎉 Variables à ajouter dans GitLab:"
echo ""
echo "Allez dans GitLab > Settings > CI/CD > Variables"
echo ""
echo "1. Variable 1:"
echo "   Key: DOCKERHUB_USERNAME"
echo "   Value: $dockerhub_username"
echo "   ✅ Mask variable"
echo "   ✅ Protect variable"
echo ""
echo "2. Variable 2:"
echo "   Key: DOCKERHUB_PASSWORD"
echo "   Value: $dockerhub_password"
echo "   ✅ Mask variable"
echo "   ✅ Protect variable"
echo ""

# Créer un fichier de configuration
config_file="dockerhub-gitlab-config.txt"
cat > "$config_file" << EOF
# Configuration Docker Hub pour GitLab CI/CD
# Date: $(date)

DOCKERHUB_USERNAME=$dockerhub_username
DOCKERHUB_PASSWORD=$dockerhub_password

# Instructions pour GitLab:
# 1. Aller dans Settings > CI/CD > Variables
# 2. Ajouter ces variables avec "Mask variable" et "Protect variable" activés
# 3. Le fichier .gitlab-ci.yml a été mis à jour automatiquement

# Images Docker qui seront créées:
# - $dockerhub_username/leadtracker-api:latest
# - $dockerhub_username/leadtracker-web:latest
EOF

log_info "Configuration sauvegardée dans: $config_file"

echo ""
log_step "Test de la configuration"
echo "========================"

echo ""
echo "🧪 Pour tester votre configuration:"
echo ""
echo "1. Ajoutez les variables dans GitLab"
echo "2. Créez une branche de test:"
echo "   git checkout -b test-gitlab-ci"
echo "   git add ."
echo "   git commit -m 'Test GitLab CI avec Docker Hub'"
echo "   git push origin test-gitlab-ci"
echo ""
echo "3. Vérifiez le pipeline dans GitLab"
echo "4. Regardez les images créées sur Docker Hub"
echo ""

echo ""
log_step "Avantages de cette configuration"
echo "================================="

echo ""
echo "✅ **Gratuit** : Docker Hub gratuit"
echo "✅ **Simple** : Seulement 2 variables à configurer"
echo "✅ **Éducatif** : Apprentissage des concepts CI/CD"
echo "✅ **Rapide** : Configuration en 5 minutes"
echo "✅ **Réaliste** : Workflow d'entreprise"
echo ""

echo ""
log_step "Prochaines étapes"
echo "=================="

echo ""
echo "1. 📝 Ajoutez les variables dans GitLab"
echo "2. 🧪 Testez le pipeline sur une branche de développement"
echo "3. 🐳 Vérifiez que les images sont poussées sur Docker Hub"
echo "4. 📚 Apprenez les concepts de CI/CD"
echo ""

log_info "Configuration terminée ! 🎉"
echo ""
echo "📚 Documentation:"
echo "- Variables requises: .gitlab-ci-dockerhub-variables.md"
echo "- Configuration sauvegardée: $config_file"
echo "- Ancienne config Azure: .gitlab-ci-azure.yml"
