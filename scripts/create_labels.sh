#!/usr/bin/env bash
set -euo pipefail

# Exemple de labels
gh label create "infra" --color "5319E7" --description "Infrastructure" 2>/dev/null || true
gh label create "backend" --color "0052CC" --description "Backend" 2>/dev/null || true
gh label create "frontend" --color "0E8A16" --description "Frontend" 2>/dev/null || true
gh label create "auth" --color "B60205" --description "Authentication" 2>/dev/null || true
gh label create "security" --color "B60205" --description "Security" 2>/dev/null || true
gh label create "api" --color "1D76DB" --description "API" 2>/dev/null || true
gh label create "feature" --color "0052CC" --description "Feature" 2>/dev/null || true
gh label create "jobs" --color "FBCA04" --description "Background jobs" 2>/dev/null || true
gh label create "analytics" --color "5319E7" --description "Analytics/Reports" 2>/dev/null || true
gh label create "observability" --color "5319E7" --description "Logs/metrics" 2>/dev/null || true
gh label create "ci" --color "5319E7" --description "CI/CD" 2>/dev/null || true
gh label create "ux" --color "0E8A16" --description "UX" 2>/dev/null || true
gh label create "quality" --color "0E8A16" --description "Quality/Tests" 2>/dev/null || true
gh label create "docs" --color "D93F0B" --description "Docs" 2>/dev/null || true

echo "Labels créés (ou déjà existants)."
