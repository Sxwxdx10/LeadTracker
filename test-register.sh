#!/bin/bash

# Script pour tester l'inscription avec monitoring des logs

echo "🚀 Test d'inscription avec monitoring des logs"

# Générer des données uniques
TIMESTAMP=$(date +%s)
EMAIL="test-${TIMESTAMP}@example.com"
DOMAIN="test-org-${TIMESTAMP}.com"
ORG_NAME="Test Org ${TIMESTAMP}"

echo "📧 Email: $EMAIL"
echo "🌐 Domaine: $DOMAIN"
echo "🏢 Organisation: $ORG_NAME"
echo ""

# Démarrer le monitoring des logs en arrière-plan
echo "📊 Monitoring des logs API..."
docker-compose logs -f api &
LOG_PID=$!

# Attendre un peu
sleep 2

# Faire la requête d'inscription
echo "📤 Envoi de la requête d'inscription..."
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\", 
    \"email\": \"$EMAIL\",
    \"password\": \"Test123!\",
    \"confirmPassword\": \"Test123!\", 
    \"organizationName\": \"$ORG_NAME\",
    \"organizationDomain\": \"$DOMAIN\"
  }" -w "\n\nStatus Code: %{http_code}\nTime: %{time_total}s\n"

# Arrêter le monitoring
sleep 3
kill $LOG_PID 2>/dev/null

echo ""
echo "✅ Test terminé"
