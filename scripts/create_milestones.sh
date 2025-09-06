#!/usr/bin/env bash
set -euo pipefail

# Jalon A — Septembre (setup + base API/DB/UI) - 4 semaines (80h)
gh milestone create "Jalon A - Septembre 2025" \
  --description "Setup + base API/DB/UI - 4 semaines (80h)
  
Semaine 1 (fait) ✅: Bootstraper le repo, Docker, CI/CD minimal
Semaine 2 (30h): Modèle de données + Auth multi-tenant JWT
Semaine 3 (25h): CRUD Leads + UI Next.js
Semaine 4 (25h): Kanban drag & drop (entamé) + Buffer + relecture

Livrable: API Auth + CRUD leads, UI de base avec pipeline Kanban partiel" \
  --due-date 2025-09-30 2>/dev/null || true

# Jalon B — Octobre (features principales + analytics) - 4 semaines (80h)
gh milestone create "Jalon B - Octobre 2025" \
  --description "Features principales + analytics - 4 semaines (80h)
  
Semaine 5 (25h): Kanban (fin) + Tâches & rappels
Semaine 6 (25h): Recherche & filtres + Rapports & analytics
Semaine 7 (20h): Import/Export CSV + Notifications email
Semaine 8 (20h): Tests unitaires initiaux + Buffer

Livrable: Application complète MVP (CRUD + Kanban + filtres + rappels + rapports + CSV)" \
  --due-date 2025-10-31 2>/dev/null || true

# Jalon C — Novembre (stabilité + DevOps + qualité) - 4 semaines (80h)
gh milestone create "Jalon C - Novembre 2025" \
  --description "Stabilité + DevOps + qualité - 4 semaines (80h)
  
Semaine 9 (20h): Tests unitaires & intégration + Déploiement Azure
Semaine 10 (20h): CI/CD pipeline complet + Documentation technique
Semaine 11 (20h): Optimisation performance + Sécurité & audit
Semaine 12 (20h): Monitoring & observabilité + Tests de charge + Buffer

Livrable: Application déployée en Azure avec CI/CD, docs, monitoring, tests" \
  --due-date 2025-11-30 2>/dev/null || true

# Jalon Final — Décembre (polish + présentation) - 1 semaine (30h)
gh milestone create "Jalon Final - Décembre 2025" \
  --description "Polish + présentation - 1 semaine (30h)
  
Semaine 13 (30h): Finalisation & présentation + Revue globale + Polish UI/UX
Buffer final (~10h)

Livrable final (12 déc.): Application multi-tenant fonctionnelle" \
  --due-date 2025-12-12 2>/dev/null || true

echo "✅ Milestones créés avec planification détaillée (ou déjà existants)."
echo ""
echo "📅 Planification 2025:"
echo "   • Jalon A (Sept 2025): Setup + base API/DB/UI - 80h"
echo "   • Jalon B (Oct 2025): Features principales + analytics - 80h"
echo "   • Jalon C (Nov 2025): Stabilité + DevOps + qualité - 80h"
echo "   • Jalon Final (Déc 2025): Polish + présentation - 30h"
echo ""
echo "🎯 Total: 270h sur 13 semaines"
