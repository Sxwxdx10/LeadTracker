#!/usr/bin/env bash
set -euo pipefail

gh milestone create "Jalon A (19-09-2025)" --description "MVP: Auth + CRUD + seed + deploy" --due-date 2025-09-19 2>/dev/null || true
gh milestone create "Jalon B (Oct-2025)" --description "Kanban + Tasks + Reports + CSV" 2>/dev/null || true
echo "Milestones créés (ou déjà existants)."
