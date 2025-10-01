#!/bin/bash

# Script pour créer un Container Registry Azure gratuit
# Usage: ./scripts/create-free-acr.sh

set -e

echo "🏗️  Création d'un Azure Container Registry gratuit..."

# Vérifier si Azure CLI est installé
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI n'est pas installé."
    echo "📥 Installez-le avec: brew install azure-cli"
    exit 1
fi

echo ""
echo "💡 Vous avez deux options:"
echo "1. Créer un nouveau compte Azure gratuit"
echo "2. Utiliser un compte existant"
echo ""

read -p "Choisissez une option (1 ou 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🎉 Création d'un compte Azure gratuit..."
    echo "======================================="
    echo ""
    echo "1. Allez sur: https://azure.microsoft.com/free/"
    echo "2. Cliquez sur 'Start free'"
    echo "3. Créez un compte Microsoft (gratuit)"
    echo "4. Suivez les étapes pour créer votre abonnement Azure gratuit"
    echo "5. Revenez ici et tapez: az login"
    echo ""
    echo "⚠️  Une fois connecté, relancez ce script avec l'option 2"
    exit 0
fi

if [ "$choice" = "2" ]; then
    echo ""
    echo "🔐 Connexion à Azure..."
    echo "======================"
    
    # Se connecter à Azure
    az login
    
    echo ""
    echo "📋 Sélection de l'abonnement..."
    echo "=============================="
    
    # Lister les abonnements
    subscriptions=$(az account list --output table)
    echo "$subscriptions"
    
    # Demander à l'utilisateur de choisir
    read -p "Entrez l'ID de l'abonnement à utiliser: " subscription_id
    az account set --subscription "$subscription_id"
    
    echo ""
    echo "🏗️  Création du Resource Group..."
    echo "================================"
    
    # Demander les informations
    read -p "Nom du Resource Group (ex: leadtracker-rg): " rg_name
    read -p "Location (ex: westeurope, eastus): " location
    
    # Créer le Resource Group
    echo "Création du Resource Group: $rg_name"
    az group create --name "$rg_name" --location "$location"
    
    echo ""
    echo "🐳 Création du Container Registry..."
    echo "=================================="
    
    # Générer un nom unique pour l'ACR
    acr_name="leadtracker$(date +%s | tail -c 6)"
    echo "Nom du ACR: $acr_name"
    
    # Créer le Container Registry
    echo "Création du Container Registry..."
    az acr create \
        --resource-group "$rg_name" \
        --name "$acr_name" \
        --sku Basic \
        --admin-enabled true \
        --location "$location"
    
    echo ""
    echo "🔑 Récupération des identifiants..."
    echo "================================="
    
    # Récupérer les identifiants
    login_server=$(az acr show --name "$acr_name" --query "loginServer" --output tsv)
    admin_username=$(az acr credential show --name "$acr_name" --query "username" --output tsv)
    admin_password=$(az acr credential show --name "$acr_name" --query "passwords[0].value" --output tsv)
    
    echo ""
    echo "🎉 Container Registry créé avec succès!"
    echo "====================================="
    echo ""
    echo "📋 Vos identifiants:"
    echo "ACR_USERNAME = $admin_username"
    echo "ACR_PASSWORD = $admin_password"
    echo "REGISTRY = $login_server"
    echo ""
    
    # Créer un fichier de configuration
    config_file="azure-acr-config.txt"
    cat > "$config_file" << EOF
# Configuration Azure Container Registry
# Date: $(date)
# Resource Group: $rg_name
# Location: $location

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
    echo "💰 Coût: ~5€/mois pour le Container Registry Basic"
    echo "⚠️  IMPORTANT: Ne partagez jamais ces identifiants !"
    
else
    echo "❌ Option invalide. Relancez le script."
    exit 1
fi
