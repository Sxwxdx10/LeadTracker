#!/usr/bin/env bash
set -euo pipefail

# Script pour créer les milestones sur GitLab
# Utilise l'API GitLab au lieu de GitHub CLI

GITLAB_URL="https://depot.dinf.usherbrooke.ca"
PROJECT_ID="4232"

# Fonction pour créer un milestone via l'API GitLab
create_milestone() {
    local title="$1"
    local description="$2"
    local due_date="$3"
    
    echo "Création du milestone: $title"
    
    # Créer un fichier JSON temporaire pour éviter les problèmes d'échappement
    local json_file=$(mktemp)
    cat > "$json_file" << EOF
{
    "title": "$title",
    "description": "$description",
    "due_date": "$due_date"
}
EOF
    
    curl -X POST \
        -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        -H "Content-Type: application/json" \
        "$GITLAB_URL/api/v4/projects/$PROJECT_ID/milestones" \
        -d @"$json_file" || echo "Erreur: Vérifiez votre token GitLab"
    
    rm -f "$json_file"
}

# Vérifier que le token GitLab est défini
if [ -z "${GITLAB_TOKEN:-}" ]; then
    echo "❌ Erreur: Variable GITLAB_TOKEN non définie"
    echo "Pour obtenir votre token:"
    echo "1. Allez sur $GITLAB_URL/-/profile/personal_access_tokens"
    echo "2. Créez un token avec scope 'api'"
    echo "3. Exécutez: export GITLAB_TOKEN=votre_token"
    exit 1
fi

echo "🚀 Création des milestones sur GitLab..."

# Jalon A — Septembre 2025
create_milestone "Jalon A - Septembre 2025" \
    "Setup + base API/DB/UI - 4 semaines (80h)" \
    "2025-09-30"

# Jalon B — Octobre 2025
create_milestone "Jalon B - Octobre 2025" \
    "Features principales + analytics - 4 semaines (80h)" \
    "2025-10-31"

# Jalon C — Novembre 2025
create_milestone "Jalon C - Novembre 2025" \
    "Stabilité + DevOps + qualité - 4 semaines (80h)" \
    "2025-11-30"

# Jalon Final — Décembre 2025
create_milestone "Jalon Final - Décembre 2025" \
    "Polish + présentation - 1 semaine (30h)" \
    "2025-12-12"

echo "✅ Milestones créés avec succès sur GitLab !"
echo ""
echo "📅 Planification 2025:"
echo "   • Jalon A (Sept 2025): Setup + base API/DB/UI - 80h"
echo "   • Jalon B (Oct 2025): Features principales + analytics - 80h"
echo "   • Jalon C (Nov 2025): Stabilité + DevOps + qualité - 80h"
echo "   • Jalon Final (Déc 2025): Polish + présentation - 30h"
echo ""
echo "🎯 Total: 270h sur 13 semaines"
