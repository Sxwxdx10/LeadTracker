#!/bin/bash
# Script pour tuer tous les processus backend qui tournent

echo "🔍 Recherche des processus dotnet sur le port 8080..."

# Trouver et tuer les processus sur le port 8080
PORT_PID=$(lsof -ti:8080)
if [ ! -z "$PORT_PID" ]; then
  echo "❌ Processus trouvé sur le port 8080: PID $PORT_PID"
  echo "🔪 Arrêt du processus..."
  kill -9 $PORT_PID
  echo "✅ Processus arrêté"
else
  echo "✅ Aucun processus sur le port 8080"
fi

# Tuer tous les dotnet run en cours
DOTNET_PIDS=$(ps aux | grep "[d]otnet run" | awk '{print $2}')
if [ ! -z "$DOTNET_PIDS" ]; then
  echo "❌ Processus dotnet run trouvés: $DOTNET_PIDS"
  echo "🔪 Arrêt des processus dotnet..."
  echo "$DOTNET_PIDS" | xargs kill -9 2>/dev/null
  echo "✅ Processus dotnet arrêtés"
else
  echo "✅ Aucun processus dotnet run en cours"
fi

echo ""
echo "✅ Nettoyage terminé! Vous pouvez relancer ./scripts/start-backend.sh"



