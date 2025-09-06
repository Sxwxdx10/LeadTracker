#!/usr/bin/env bash
set -euo pipefail

# Script wrapper pour exécuter l'import GitLab avec l'environnement virtuel

echo "🚀 Activation de l'environnement virtuel et import des issues..."

# Activer l'environnement virtuel et exécuter le script
source venv/bin/activate && python3 scripts/import_issues_gitlab.py
