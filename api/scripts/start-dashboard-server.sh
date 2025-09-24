#!/bin/bash

# Script pour démarrer le serveur de dashboard avec CORS
# Usage: ./start-dashboard-server.sh

set -e

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Lead Tracker - Serveur de Dashboard ===${NC}"
echo ""

# Vérifier que Python est installé
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 n'est pas installé${NC}"
    echo "Veuillez installer Python 3 pour utiliser ce serveur"
    exit 1
fi

# Vérifier que l'API est en cours d'exécution
echo -e "${YELLOW}Vérification de l'API...${NC}"
if ! curl -s "http://localhost:8080/api/monitoring/health" > /dev/null; then
    echo -e "${RED}❌ L'API n'est pas accessible sur http://localhost:8080${NC}"
    echo "Veuillez démarrer l'API avec: cd api && dotnet run --project LeadTracker.Api --urls=http://localhost:8080"
    exit 1
fi

echo -e "${GREEN}✅ API accessible${NC}"
echo ""

# Obtenir le chemin absolu du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_FILE="$SCRIPT_DIR/monitoring-dashboard-simple.html"

if [ ! -f "$DASHBOARD_FILE" ]; then
    echo -e "${RED}❌ Fichier dashboard non trouvé: $DASHBOARD_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Démarrage du serveur de dashboard...${NC}"
echo "Le dashboard sera accessible sur: http://localhost:3001/monitoring-dashboard-simple.html"
echo ""

# Démarrer le serveur Python
cd "$SCRIPT_DIR"
python3 serve-dashboard.py
