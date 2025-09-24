#!/usr/bin/env python3
"""
Serveur HTTP simple pour servir le dashboard de monitoring
Usage: python3 serve-dashboard.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 3001
DASHBOARD_FILE = "monitoring-dashboard-simple.html"

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Ajouter les headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Org-Id')
        super().end_headers()

    def do_OPTIONS(self):
        # Gérer les requêtes preflight CORS
        self.send_response(200)
        self.end_headers()

def main():
    # Changer vers le répertoire du script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Vérifier que le fichier dashboard existe
    if not os.path.exists(DASHBOARD_FILE):
        print(f"❌ Erreur: Fichier {DASHBOARD_FILE} non trouvé")
        sys.exit(1)
    
    # Créer le serveur
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"🚀 Serveur de dashboard démarré sur http://localhost:{PORT}")
        print(f"📊 Dashboard disponible sur: http://localhost:{PORT}/{DASHBOARD_FILE}")
        print(f"📁 Répertoire de travail: {script_dir}")
        print("")
        print("💡 Conseils:")
        print("- Le dashboard se met à jour automatiquement toutes les 30 secondes")
        print("- Vérifiez que l'API est en cours d'exécution sur http://localhost:8080")
        print("- Pour arrêter le serveur: Ctrl+C")
        print("")
        
        # Ouvrir automatiquement le dashboard
        try:
            webbrowser.open(f"http://localhost:{PORT}/{DASHBOARD_FILE}")
            print("🌐 Dashboard ouvert dans le navigateur")
        except Exception as e:
            print(f"⚠️  Impossible d'ouvrir automatiquement le navigateur: {e}")
            print(f"   Ouvrez manuellement: http://localhost:{PORT}/{DASHBOARD_FILE}")
        
        print("")
        print("🔄 Serveur en cours d'exécution...")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Arrêt du serveur...")
            httpd.shutdown()

if __name__ == "__main__":
    main()
