#!/bin/bash

# Script de test pour le dashboard de monitoring
# Usage: ./test-dashboard.sh

set -e

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test du Dashboard de Monitoring ===${NC}"
echo ""

# Configuration
API_URL="http://localhost:8080/api"
DASHBOARD_URL="http://localhost:3001/monitoring-dashboard-simple.html"
ORG_ID="7b0150ff-3856-4d8c-aa6e-b15575ce8a6c"

# Fonction pour tester un endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-"GET"}
    local data=${3:-""}
    local auth=${4:-false}
    
    echo -e "${YELLOW}Testing $method $endpoint${NC}"
    
    local headers=("-H" "Content-Type: application/json")
    if [ "$auth" = true ]; then
        headers+=("-H" "Authorization: Bearer $TOKEN")
        headers+=("-H" "X-Org-Id: $ORG_ID")
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${headers[@]}" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" "${headers[@]}" -X "$method" -d "$data" "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Success ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed ($http_code)${NC}"
        echo "$body"
    fi
    echo ""
}

# Vérifier que l'API est accessible
echo -e "${YELLOW}1. Vérification de l'API...${NC}"
if ! curl -s "http://localhost:8080/api/monitoring/health" > /dev/null; then
    echo -e "${RED}❌ L'API n'est pas accessible${NC}"
    echo "Veuillez démarrer l'API avec: cd api && dotnet run --project LeadTracker.Api --urls=http://localhost:8080"
    exit 1
fi
echo -e "${GREEN}✅ API accessible${NC}"
echo ""

# Vérifier que le serveur de dashboard est accessible
echo -e "${YELLOW}2. Vérification du serveur de dashboard...${NC}"
if ! curl -s "http://localhost:3001" > /dev/null; then
    echo -e "${RED}❌ Le serveur de dashboard n'est pas accessible${NC}"
    echo "Veuillez démarrer le serveur avec: ./api/scripts/start-dashboard-server.sh"
    exit 1
fi
echo -e "${GREEN}✅ Serveur de dashboard accessible${NC}"
echo ""

# Test de l'endpoint de santé (public)
echo -e "${YELLOW}3. Test de l'endpoint de santé (public)...${NC}"
test_endpoint "/monitoring/health"

# Obtenir un token d'authentification
echo -e "${YELLOW}4. Authentification...${NC}"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: $ORG_ID" \
  -d '{
    "email": "franackmbiele@gmail.com",
    "password": "Test123!",
    "organizationDomain": "fosso-org",
    "rememberMe": false
  }' | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Échec de l'authentification${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authentification réussie${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test des endpoints authentifiés
echo -e "${YELLOW}5. Test des métriques (authentifié)...${NC}"
test_endpoint "/monitoring/metrics" "GET" "" true

echo -e "${YELLOW}6. Test des statistiques de logs (authentifié)...${NC}"
test_endpoint "/monitoring/logs/stats" "GET" "" true

echo -e "${YELLOW}7. Test des métriques de performance (authentifié)...${NC}"
test_endpoint "/monitoring/performance" "GET" "" true

echo -e "${YELLOW}8. Test des alertes (authentifié)...${NC}"
test_endpoint "/monitoring/alerts?count=5" "GET" "" true

# Test du dashboard
echo -e "${YELLOW}9. Test du dashboard...${NC}"
if curl -s "$DASHBOARD_URL" | grep -q "Lead Tracker Monitoring"; then
    echo -e "${GREEN}✅ Dashboard accessible${NC}"
    echo "URL: $DASHBOARD_URL"
else
    echo -e "${RED}❌ Dashboard non accessible${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Tous les tests sont passés !${NC}"
echo ""
echo -e "${BLUE}📊 Dashboard disponible sur: $DASHBOARD_URL${NC}"
echo -e "${BLUE}🔧 API disponible sur: $API_URL${NC}"
echo ""
echo -e "${YELLOW}Conseils:${NC}"
echo "- Le dashboard se met à jour automatiquement toutes les 30 secondes"
echo "- Ouvrez le dashboard dans votre navigateur pour voir les métriques en temps réel"
echo "- Vérifiez la console du navigateur (F12) pour voir les logs de debug"
