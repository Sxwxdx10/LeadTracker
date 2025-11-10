#!/bin/bash
# Script pour synchroniser l'historique des migrations EF

echo "🔄 Synchronisation de l'historique des migrations..."

cd "$(dirname "$0")/.."

# Vérifier que PostgreSQL est démarré
if ! docker exec leadtracker-db pg_isready -U postgres > /dev/null 2>&1; then
  echo "❌ PostgreSQL n'est pas démarré. Lancez d'abord: docker-compose up -d postgres"
  exit 1
fi

echo "✅ PostgreSQL est prêt"

# Appliquer le script de synchronisation
echo "📝 Application du script de synchronisation..."
docker exec -i leadtracker-db psql -U postgres -d leadtracker < api/sync-migrations-history.sql

echo ""
echo "✅ Synchronisation terminée!"
echo ""
echo "Vous pouvez maintenant utiliser 'dotnet ef database update' pour les futures migrations."



