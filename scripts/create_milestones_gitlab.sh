#!/usr/bin/env bash
set -euo pipefail

# Script pour créer les milestones sur GitLab
# Utilise l'API GitLab au lieu de GitHub CLI

GITLAB_URL="https://depot.dinf.usherbrooke.ca"
PROJECT_ID="dinf/projets/a25/eq24/leadtracker"

# Fonction pour créer un milestone via l'API GitLab
create_milestone() {
    local title="$1"
    local description="$2"
    local due_date="$3"
    
    echo "Création du milestone: $title"
    
    curl -X POST \
        -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        -H "Content-Type: application/json" \
        "$GITLAB_URL/api/v4/projects/$(echo $PROJECT_ID | sed 's/\//%2F/g')/milestones" \
        -d "{
            \"title\": \"$title\",
            \"description\": \"$description\",
            \"due_date\": \"$due_date\"
        }" 2>/dev/null || echo "Erreur: Vérifiez votre token GitLab"
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
    "Setup + base API/DB/UI - 4 semaines (80h)

Semaine 1 (fait) ✅: Bootstraper le repo, Docker, CI/CD minimal
Semaine 2 (30h): Modèle de données + Auth multi-tenant JWT
Semaine 3 (25h): CRUD Leads + UI Next.js
Semaine 4 (25h): Kanban drag & drop (entamé) + Buffer + relecture

Livrable: API Auth + CRUD leads, UI de base avec pipeline Kanban partiel" \
    "2025-09-30"

# Jalon B — Octobre 2025
create_milestone "Jalon B - Octobre 2025" \
    "Features principales + analytics - 4 semaines (80h)

Semaine 5 (25h): Kanban (fin) + Tâches & rappels
Semaine 6 (25h): Recherche & filtres + Rapports & analytics
Semaine 7 (20h): Import/Export CSV + Notifications email
Semaine 8 (20h): Tests unitaires initiaux + Buffer

Livrable: Application complète MVP (CRUD + Kanban + filtres + rappels + rapports + CSV)" \
    "2025-10-31"

# Jalon C — Novembre 2025
create_milestone "Jalon C - Novembre 2025" \
    "Stabilité + DevOps + qualité - 4 semaines (80h)

Semaine 9 (20h): Tests unitaires & intégration + Déploiement Azure
Semaine 10 (20h): CI/CD pipeline complet + Documentation technique
Semaine 11 (20h): Optimisation performance + Sécurité & audit
Semaine 12 (20h): Monitoring & observabilité + Tests de charge + Buffer

Livrable: Application déployée en Azure avec CI/CD, docs, monitoring, tests" \
    "2025-11-30"

# Jalon Final — Décembre 2025
create_milestone "Jalon Final - Décembre 2025" \
    "Polish + présentation - 1 semaine (30h)

Semaine 13 (30h): Finalisation & présentation + Revue globale + Polish UI/UX
Buffer final (~10h)

Livrable final (12 déc.): Application multi-tenant fonctionnelle" \
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
