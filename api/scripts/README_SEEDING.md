# Système de Seeding LeadTracker

Ce système permet de créer facilement des données de test pour tester l'application LeadTracker.

## 🚀 Utilisation Rapide

### 1. Authentification
D'abord, obtenez un token JWT en vous connectant via l'API d'authentification :

```bash
# Exemple de connexion
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe",
    "organizationDomain": "votre-domaine-org",
    "rememberMe": false
  }'
```

### 2. Seeding des Données

#### Option A: Seeding Complet (Recommandé)
```bash
# Seeding de tout (stages + utilisateurs + leads)
curl -X POST "http://localhost:8080/api/seed/all?leadCount=20" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"
```

#### Option B: Seeding Séparé
```bash
# 1. Créer les stages par défaut
curl -X POST "http://localhost:8080/api/seed/stages" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"

# 2. Créer des utilisateurs de test
curl -X POST "http://localhost:8080/api/seed/users" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"

# 3. Créer des leads de test
curl -X POST "http://localhost:8080/api/seed/leads?count=20" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"
```

## 📋 Scripts de Test

### Script Bash (Linux/Mac)
```bash
# Rendre le script exécutable
chmod +x scripts/test-seeding.sh

# Exécuter les tests
./scripts/test-seeding.sh "http://localhost:8080" "VOTRE_TOKEN" "VOTRE_ORG_ID"
```

### Script PowerShell (Windows)
```powershell
# Exécuter les tests
.\scripts\test-seeding.ps1 -BaseUrl "http://localhost:8080" -Token "VOTRE_TOKEN" -OrgId "VOTRE_ORG_ID"
```

## 🎯 Données Créées

### Stages par Défaut
- **Nouveau** - Lead nouvellement créé
- **Qualifié** - Lead qualifié et intéressé  
- **Proposition** - Proposition envoyée
- **Négociation** - En cours de négociation
- **Fermé - Gagné** - Deal conclu avec succès
- **Fermé - Perdu** - Deal perdu

### Utilisateurs de Test
- Marie Dubois (Commerciale Senior)
- Pierre Martin (Responsable Commercial)
- Sophie Bernard (Chargée de Prospection)

### Leads de Test
- **20 leads** par défaut (configurable)
- Données réalistes : noms, entreprises, emails, téléphones
- Valeurs estimées entre 5 000€ et 100 000€
- Probabilités de clôture variées
- Sources diverses (Site Web, LinkedIn, etc.)
- Notes contextuelles réalistes

## 🔧 Configuration

### Paramètres Disponibles
- `count` : Nombre de leads à créer (défaut: 20)
- `leadCount` : Alias pour `count` dans l'endpoint `/all`

### Exemples
```bash
# Créer 50 leads
curl -X POST "http://localhost:8080/api/seed/leads?count=50" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"

# Seeding complet avec 100 leads
curl -X POST "http://localhost:8080/api/seed/all?leadCount=100" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"
```

## 🛡️ Sécurité

- **Authentification requise** : Tous les endpoints nécessitent un token JWT valide
- **Isolation par organisation** : Les données sont créées uniquement pour l'organisation de l'utilisateur connecté
- **Pas de données sensibles** : Toutes les données sont fictives et sécurisées

## 🐛 Dépannage

### Erreur 401 (Non autorisé)
- Vérifiez que votre token JWT est valide
- Assurez-vous d'inclure le header `Authorization: Bearer VOTRE_TOKEN`
- Vérifiez que le token n'a pas expiré

### Erreur 400 (Mauvaise requête)
- Vérifiez que l'organisation de l'utilisateur est correctement configurée
- Assurez-vous d'inclure le header `X-Org-Id: VOTRE_ORG_ID`
- Vérifiez que l'utilisateur a les permissions nécessaires

### Erreur 500 (Erreur serveur)
- Vérifiez les logs de l'application
- Assurez-vous que la base de données est accessible
- Vérifiez que les migrations sont appliquées

## 📊 Vérification

Après le seeding, vous pouvez vérifier les données via l'API :

```bash
# Lister les leads
curl -X GET "http://localhost:8080/api/leads" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"

# Lister les stages
curl -X GET "http://localhost:8080/api/stages" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"

# Lister les utilisateurs
curl -X GET "http://localhost:8080/api/users" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"
```
