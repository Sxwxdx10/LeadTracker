#!/bin/bash

# Script pour tester le système de seeding
# Usage: ./test-seeding.sh [base_url] [token] [org_id]

BASE_URL=${1:-"http://localhost:8080"}
TOKEN=${2:-""}
ORG_ID=${3:-""}

echo "🧪 Test du système de seeding LeadTracker"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Organization ID: $ORG_ID"
echo ""

# Vérifier si le token et l'org ID sont fournis
if [ -z "$TOKEN" ] || [ -z "$ORG_ID" ]; then
    echo "❌ Token d'authentification et Organization ID requis"
    echo "Usage: $0 [base_url] [token] [org_id]"
    echo "Exemple: $0 http://localhost:8080 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... 7b0150ff-3856-4d8c-aa6e-b15575ce8a6c"
    exit 1
fi

# Headers pour les requêtes
HEADERS=(
    -H "Content-Type: application/json"
    -H "Authorization: Bearer $TOKEN"
    -H "X-Org-Id: $ORG_ID"
)

echo "1️⃣ Test de seeding des stages..."
echo "--------------------------------"
STAGES_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST "$BASE_URL/api/seed/stages")
STAGES_HTTP_CODE=$(echo "$STAGES_RESPONSE" | tail -n1)
STAGES_BODY=$(echo "$STAGES_RESPONSE" | head -n -1)

if [ "$STAGES_HTTP_CODE" = "200" ]; then
    echo "✅ Stages créés avec succès"
    echo "$STAGES_BODY" | jq '.' 2>/dev/null || echo "$STAGES_BODY"
else
    echo "❌ Erreur lors de la création des stages (HTTP $STAGES_HTTP_CODE)"
    echo "$STAGES_BODY"
fi

echo ""
echo "2️⃣ Test de seeding des utilisateurs..."
echo "-------------------------------------"
USERS_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST "$BASE_URL/api/seed/users")
USERS_HTTP_CODE=$(echo "$USERS_RESPONSE" | tail -n1)
USERS_BODY=$(echo "$USERS_RESPONSE" | head -n -1)

if [ "$USERS_HTTP_CODE" = "200" ]; then
    echo "✅ Utilisateurs créés avec succès"
    echo "$USERS_BODY" | jq '.' 2>/dev/null || echo "$USERS_BODY"
else
    echo "❌ Erreur lors de la création des utilisateurs (HTTP $USERS_HTTP_CODE)"
    echo "$USERS_BODY"
fi

echo ""
echo "3️⃣ Test de seeding des leads (20 leads)..."
echo "------------------------------------------"
LEADS_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST "$BASE_URL/api/seed/leads?count=20")
LEADS_HTTP_CODE=$(echo "$LEADS_RESPONSE" | tail -n1)
LEADS_BODY=$(echo "$LEADS_RESPONSE" | head -n -1)

if [ "$LEADS_HTTP_CODE" = "200" ]; then
    echo "✅ Leads créés avec succès"
    echo "$LEADS_BODY" | jq '.' 2>/dev/null || echo "$LEADS_BODY"
else
    echo "❌ Erreur lors de la création des leads (HTTP $LEADS_HTTP_CODE)"
    echo "$LEADS_BODY"
fi

echo ""
echo "4️⃣ Test de seeding complet (5 leads)..."
echo "---------------------------------------"
ALL_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST "$BASE_URL/api/seed/all?leadCount=5")
ALL_HTTP_CODE=$(echo "$ALL_RESPONSE" | tail -n1)
ALL_BODY=$(echo "$ALL_RESPONSE" | head -n -1)

if [ "$ALL_HTTP_CODE" = "200" ]; then
    echo "✅ Seeding complet réussi"
    echo "$ALL_BODY" | jq '.' 2>/dev/null || echo "$ALL_BODY"
else
    echo "❌ Erreur lors du seeding complet (HTTP $ALL_HTTP_CODE)"
    echo "$ALL_BODY"
fi

echo ""
echo "🎉 Tests terminés !"
echo "=================="
