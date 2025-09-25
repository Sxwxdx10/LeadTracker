#!/bin/bash

# Script pour récupérer les identifiants Azure Container Registry
# Usage: ./scripts/get-azure-credentials.sh

set -e

echo "🔍 Récupération des identifiants Azure Container Registry..."

# Vérifier si Azure CLI est installé
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI n'est pas installé."
    echo "📥 Installez-le avec: brew install azure-cli"
    exit 1
fi

# Vérifier si l'utilisateur est connecté
if ! az account show &> /dev/null; then
    echo "🔐 Connexion à Azure requise..."
    az login
fi

echo "✅ Connecté à Azure"

# Lister les Container Registries
echo ""
echo "📋 Container Registries disponibles:"
echo "=================================="

# Récupérer tous les ACR
acr_list=$(az acr list --query "[].{Name:name, ResourceGroup:resourceGroup, LoginServer:loginServer}" --output table)

if [ -z "$acr_list" ]; then
    echo "❌ Aucun Container Registry trouvé."
    echo ""
    echo "💡 Solutions possibles:"
    echo "1. Créer un nouveau ACR: az acr create --resource-group <rg-name> --name <acr-name> --sku Basic"
    echo "2. Vérifier que vous avez les bonnes permissions"
    exit 1
fi

echo "$acr_list"

# Chercher les ACR LeadTracker
echo ""
echo "🔍 Recherche des ACR LeadTracker..."
echo "=================================="

leadtracker_acr=$(az acr list --query "[?contains(name, 'leadtracker')].{Name:name, ResourceGroup:resourceGroup, LoginServer:loginServer}" --output table)

if [ -n "$leadtracker_acr" ]; then
    echo "✅ ACR LeadTracker trouvé(s):"
    echo "$leadtracker_acr"
else
    echo "⚠️  Aucun ACR LeadTracker trouvé."
    echo ""
    echo "💡 Voulez-vous créer un nouveau ACR LeadTracker ?"
    read -p "Nom du ACR (ex: leadtrackeracr): " acr_name
    read -p "Nom du Resource Group: " rg_name
    read -p "Location (ex: westeurope): " location
    
    echo "🏗️  Création du Container Registry..."
    az acr create \
        --resource-group "$rg_name" \
        --name "$acr_name" \
        --sku Basic \
        --admin-enabled true \
        --location "$location"
    
    echo "✅ ACR créé avec succès!"
    acr_name="$acr_name"
    rg_name="$rg_name"
else
    # Demander à l'utilisateur de choisir
    echo ""
    echo "🎯 Choisissez votre ACR LeadTracker:"
    acr_names=($(az acr list --query "[?contains(name, 'leadtracker')].name" --output tsv))
    
    if [ ${#acr_names[@]} -eq 1 ]; then
        acr_name="${acr_names[0]}"
        rg_name=$(az acr show --name "$acr_name" --query "resourceGroup" --output tsv)
        echo "✅ ACR sélectionné: $acr_name"
    else
        echo "ACRs disponibles:"
        for i in "${!acr_names[@]}"; do
            echo "$((i+1)). ${acr_names[$i]}"
        done
        
        read -p "Numéro de l'ACR à utiliser: " choice
        acr_name="${acr_names[$((choice-1))]}"
        rg_name=$(az acr show --name "$acr_name" --query "resourceGroup" --output tsv)
        echo "✅ ACR sélectionné: $acr_name"
    fi
fi

# Récupérer les identifiants
echo ""
echo "🔑 Récupération des identifiants..."
echo "================================="

login_server=$(az acr show --name "$acr_name" --query "loginServer" --output tsv)
admin_username=$(az acr credential show --name "$acr_name" --query "username" --output tsv)
admin_password=$(az acr credential show --name "$acr_name" --query "passwords[0].value" --output tsv)

echo ""
echo "🎉 Identifiants Azure Container Registry:"
echo "======================================="
echo ""
echo "ACR_USERNAME = $admin_username"
echo "ACR_PASSWORD = $admin_password"
echo "REGISTRY = $login_server"
echo ""

# Créer un fichier de configuration
config_file="azure-acr-config.txt"
cat > "$config_file" << EOF
# Configuration Azure Container Registry
# Date: $(date)

ACR_USERNAME=$admin_username
ACR_PASSWORD=$admin_password
REGISTRY=$login_server

# Instructions pour GitLab:
# 1. Aller dans Settings > CI/CD > Variables
# 2. Ajouter ces variables avec "Mask variable" et "Protect variable" activés
EOF

echo "💾 Configuration sauvegardée dans: $config_file"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Copiez les valeurs ci-dessus"
echo "2. Allez dans GitLab > Settings > CI/CD > Variables"
echo "3. Ajoutez chaque variable avec 'Mask variable' et 'Protect variable'"
echo ""
echo "⚠️  IMPORTANT: Ne partagez jamais ces identifiants !"
