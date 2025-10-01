#!/bin/bash

# Script pour construire et pousser les images Docker localement
# Usage: ./scripts/build-and-push-local.sh

set -e

echo "🐳 Build et push des images Docker LeadTracker"
echo "============================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution"
    echo "📥 Démarrez Docker Desktop et relancez ce script"
    exit 1
fi

log_info "Docker est en cours d'exécution ✅"

# Vérifier la connexion Docker Hub
echo ""
log_step "Connexion à Docker Hub..."
read -p "Nom d'utilisateur Docker Hub (franckmbd): " dockerhub_username
dockerhub_username=${dockerhub_username:-franckmbd}

echo "Connexion à Docker Hub en tant que $dockerhub_username..."
docker login -u "$dockerhub_username"

if [ $? -eq 0 ]; then
    log_info "Connecté à Docker Hub ✅"
else
    echo "❌ Échec de la connexion à Docker Hub"
    exit 1
fi

# Variables
API_IMAGE_NAME="$dockerhub_username/leadtracker-api"
WEB_IMAGE_NAME="$dockerhub_username/leadtracker-web"

echo ""
log_step "Build de l'image API..."
echo "Image: $API_IMAGE_NAME:latest"

if [ -f "api/Dockerfile" ]; then
    docker build -t "$API_IMAGE_NAME:latest" -f api/Dockerfile api/
    log_info "Image API construite ✅"
else
    echo "❌ Fichier api/Dockerfile non trouvé"
    exit 1
fi

echo ""
log_step "Build de l'image Web..."
echo "Image: $WEB_IMAGE_NAME:latest"

if [ -f "web/Dockerfile" ]; then
    docker build -t "$WEB_IMAGE_NAME:latest" -f web/Dockerfile web/
    log_info "Image Web construite ✅"
else
    echo "❌ Fichier web/Dockerfile non trouvé"
    exit 1
fi

echo ""
log_step "Push des images vers Docker Hub..."

echo "Pushing $API_IMAGE_NAME:latest..."
docker push "$API_IMAGE_NAME:latest"
log_info "Image API poussée ✅"

echo "Pushing $WEB_IMAGE_NAME:latest..."
docker push "$WEB_IMAGE_NAME:latest"
log_info "Image Web poussée ✅"

echo ""
log_info "🎉 Build et push terminés avec succès !"
echo ""
echo "📦 Images disponibles sur Docker Hub:"
echo "   - $API_IMAGE_NAME:latest"
echo "   - $WEB_IMAGE_NAME:latest"
echo ""
echo "🔗 Vérifiez sur: https://hub.docker.com/r/$dockerhub_username"
