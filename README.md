# Lead Tracker

Système de gestion de leads multi-tenant avec tableaux Kanban, gestion des tâches et analyses.

## 🚀 Guide de Démarrage (Première Installation)

Temps estimé : moins de 5 minutes

### 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **[Docker Desktop](https://www.docker.com/get-started)** (ou Docker Engine + Docker Compose)
  - Vérifiez l'installation : `docker --version` et `docker-compose --version`
- **[Git](https://git-scm.com/)** pour cloner le projet
  - Vérifiez l'installation : `git --version`

### 🔧 Installation Étape par Étape

#### Étape 1 : Cloner le projet

```bash
git clone <repository-url>
cd LeadTracker
```

#### Étape 2 : Démarrer tous les services

Lancez tous les services (base de données, API, frontend) avec Docker Compose :

```bash
docker-compose up -d
```

> **Note** : La première fois, cela peut prendre quelques minutes car Docker doit télécharger les images et construire les conteneurs.

#### Étape 3 : Vérifier que tous les services sont démarrés

```bash
docker-compose ps
```

Vous devriez voir tous les services avec le statut `Up` ou `healthy` :
- ✅ `leadtracker-db` (PostgreSQL)
- ✅ `leadtracker-redis` (Redis)
- ✅ `leadtracker-api` (API .NET)
- ✅ `leadtracker-web` (Frontend Next.js)
- ✅ `leadtracker-proxy` (Nginx)
- ✅ `leadtracker-mailhog` (MailHog)

#### Étape 4 : Attendre que l'API soit prête

Les migrations de base de données sont appliquées automatiquement au démarrage de l'API. Attendez environ 30-60 secondes, puis vérifiez :

```bash
# Vérifier que l'API répond
curl http://localhost:8080/health
# Réponse attendue: "Healthy"
```

#### Étape 5 : Accéder à l'application

Ouvrez votre navigateur et allez sur : **http://localhost:3000**

Vous devriez voir la page de connexion de l'application.

#### Étape 6 : Créer votre premier compte

1. Cliquez sur **"S'inscrire"** ou **"Créer un compte"**
2. Remplissez le formulaire d'inscription :
   - Email
   - Mot de passe
   - Nom et prénom
   - Nom de votre organisation
   - Domaine de votre organisation (ex: `mon-entreprise`)
3. Validez l'inscription

> **Note** : Votre organisation sera créée automatiquement lors de l'inscription.

#### Étape 7 : (Optionnel) Ajouter des données de test

Si vous souhaitez tester l'application avec des données pré-remplies, vous pouvez utiliser le système de seeding :

1. Connectez-vous à l'application
2. Consultez la [documentation du seeding](api/scripts/README_SEEDING.md) pour les instructions détaillées

Ou utilisez directement l'API (nécessite un token JWT) :

```bash
# 1. Obtenir un token en vous connectant via l'API
# 2. Utiliser le token pour appeler l'endpoint de seeding
curl -X POST "http://localhost:8080/api/seed/all?leadCount=20" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "X-Org-Id: VOTRE_ORG_ID"
```

### ✅ Vérification Complète

Pour vérifier que tout fonctionne correctement :

```bash
# 1. Vérifier l'API
curl http://localhost:8080/health
# Réponse attendue: "Healthy"

# 2. Vérifier Swagger (documentation API)
# Ouvrir http://localhost:8080/swagger dans votre navigateur

# 3. Vérifier PostgreSQL
docker exec leadtracker-db psql -U postgres -d leadtracker -c "SELECT 1;"
# Réponse attendue: (1 row)

# 4. Vérifier l'application web
# Ouvrir http://localhost:3000 dans votre navigateur
```

## ⚡ Démarrage Rapide (Utilisateurs Expérimentés)

Si vous avez déjà installé l'application précédemment :

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps

# Accéder à l'application
# Ouvrir http://localhost:3000 dans votre navigateur
```

### Accès aux Services

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Application principale |
| API | http://localhost:8080 | API REST |
| Swagger | http://localhost:8080/swagger | Documentation API |
| Hangfire | http://localhost:8080/hangfire | Jobs en arrière-plan |
| MailHog | http://localhost:8025 | Interface email de développement |
| PostgreSQL | localhost:5434 | Base de données (port externe) |
| Redis | localhost:6379 | Cache et sessions |

### Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart api

# Arrêter tous les services
docker-compose down

# Reconstruire les images
docker-compose build

# Nettoyer complètement
docker-compose down -v --remove-orphans
```


## 💻 Démarrage Sans Docker (Développement Local)

Si vous préférez développer sans Docker, vous pouvez installer et exécuter tous les services localement.

### 📋 Prérequis

Installez les outils suivants sur votre machine :

1. **[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)**
   - Vérifiez l'installation : `dotnet --version` (doit afficher 8.x.x)

2. **[Node.js 18+](https://nodejs.org/)** et **npm 8+**
   - Vérifiez l'installation : `node --version` et `npm --version`

3. **[PostgreSQL 15+](https://www.postgresql.org/download/)**
   - Vérifiez l'installation : `psql --version`
   - Créez un utilisateur et une base de données (voir ci-dessous)

4. **[Redis](https://redis.io/download)**
   - Vérifiez l'installation : `redis-cli --version`
   - Sur Mac : `brew install redis`
   - Sur Linux : `sudo apt-get install redis-server` (Ubuntu/Debian)
   - Sur Windows : Utilisez WSL ou téléchargez depuis le site officiel

5. **(Optionnel) [MailHog](https://github.com/mailhog/MailHog)** pour les emails de développement
   - Sur Mac : `brew install mailhog`
   - Ou téléchargez depuis GitHub

### 🔧 Installation Étape par Étape

#### Étape 1 : Cloner le projet

```bash
git clone <repository-url>
cd LeadTracker
```

#### Étape 2 : Configurer PostgreSQL

Créez la base de données :

```bash
# Se connecter à PostgreSQL (l'utilisateur postgres existe généralement déjà)
psql -U postgres

# Dans le shell PostgreSQL, exécutez :
CREATE DATABASE leadtracker;
GRANT ALL PRIVILEGES ON DATABASE leadtracker TO postgres;
\q
```

> **Note** : 
> - Si l'utilisateur `postgres` n'existe pas, créez-le avec : `CREATE USER postgres WITH PASSWORD 'postgres';`
> - Si vous utilisez un autre utilisateur/mot de passe, mettez-les à jour dans la configuration (voir Étape 5).
> - Le port par défaut de PostgreSQL est 5432 (pas 5434 comme dans Docker).

#### Étape 3 : Démarrer Redis

```bash
# Sur Mac/Linux
redis-server

# Ou en arrière-plan
redis-server --daemonize yes

# Vérifier que Redis fonctionne
redis-cli ping
# Réponse attendue: PONG
```

#### Étape 4 : (Optionnel) Démarrer MailHog

```bash
# Sur Mac avec Homebrew
mailhog

# Ou téléchargez et exécutez depuis GitHub
# Accédez ensuite à http://localhost:8025 pour voir les emails
```

#### Étape 5 : Configurer l'API

1. **Modifier `api/LeadTracker.Api/appsettings.Development.json`** :

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=127.0.0.1;Port=5432;Database=leadtracker;Username=postgres;Password=postgres",
    "Redis": "localhost:6379"
  },
  "JWT": {
    "SecretKey": "development-secret-key-change-this-in-production-minimum-32-chars",
    "Issuer": "http://localhost:8080",
    "Audience": "http://localhost:3000"
  },
  "Email": {
    "SmtpHost": "localhost",
    "SmtpPort": 1025,
    "FromAddress": "dev@leadtracker.local",
    "FromName": "Lead Tracker Dev"
  }
}
```

> **Note** : Ajustez les paramètres selon votre configuration PostgreSQL locale (port, utilisateur, mot de passe).

2. **Installer les dépendances .NET** :

```bash
cd api
dotnet restore
cd ..
```

#### Étape 6 : Appliquer les migrations de base de données

```bash
cd api

# Installer l'outil EF Core (si ce n'est pas déjà fait)
dotnet tool install --global dotnet-ef

# Appliquer les migrations
dotnet ef database update --project LeadTracker.Infrastructure --startup-project LeadTracker.Api

cd ..
```

> **Note** : Les migrations sont appliquées automatiquement au démarrage de l'API, mais vous pouvez aussi les appliquer manuellement.

#### Étape 7 : Démarrer l'API

```bash
cd api/LeadTracker.Api
dotnet run
```

L'API devrait démarrer sur **http://localhost:8080**

Vérifiez que tout fonctionne :
```bash
curl http://localhost:8080/health
# Réponse attendue: "Healthy"
```

#### Étape 8 : Configurer le Frontend

1. **Créer/modifier `web/.env.local`** :

```bash
cd web

# Le fichier .env.local devrait contenir :
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-this-in-production
NEXT_PUBLIC_APP_NAME=Lead Tracker
NEXT_PUBLIC_APP_VERSION=1.0.0-dev
NEXT_PUBLIC_SIGNALR_HUB_URL=http://localhost:8080/hubs
NODE_ENV=development
```

2. **Installer les dépendances** :

```bash
npm install
```

#### Étape 9 : Démarrer le Frontend

Dans un **nouveau terminal** :

```bash
cd web
npm run dev
```

L'application devrait démarrer sur **http://localhost:3000**

### ✅ Vérification

1. **API** : http://localhost:8080/health → Devrait retourner "Healthy"
2. **Swagger** : http://localhost:8080/swagger → Documentation de l'API
3. **Frontend** : http://localhost:3000 → Application web
4. **MailHog** (si installé) : http://localhost:8025 → Interface email

### 🚀 Commandes Utiles (Sans Docker)

```bash
# Démarrer l'API
cd api/LeadTracker.Api
dotnet run

# Démarrer le frontend (dans un autre terminal)
cd web
npm run dev

# Appliquer de nouvelles migrations
cd api
dotnet ef database update --project LeadTracker.Infrastructure --startup-project LeadTracker.Api

# Créer une nouvelle migration
dotnet ef migrations add NomDeLaMigration --project LeadTracker.Infrastructure --startup-project LeadTracker.Api

# Voir les logs de l'API
# Les logs sont dans api/LeadTracker.Api/logs/

# Redémarrer Redis
redis-cli shutdown
redis-server

# Vérifier PostgreSQL
psql -U postgres -d leadtracker -c "SELECT 1;"
```

### 🔧 Dépannage (Sans Docker)

#### Problème : L'API ne peut pas se connecter à PostgreSQL

**Solution** :
```bash
# Vérifier que PostgreSQL est démarré
# Sur Mac/Linux :
brew services list  # ou systemctl status postgresql sur Linux

# Vérifier la connexion
psql -U postgres -d leadtracker -c "SELECT 1;"

# Vérifier le port (par défaut 5432)
lsof -i :5432
```

#### Problème : Erreur de connexion Redis

**Solution** :
```bash
# Vérifier que Redis est démarré
redis-cli ping

# Redémarrer Redis
redis-cli shutdown
redis-server
```

#### Problème : Port 8080 ou 3000 déjà utilisé

**Solution** :
```bash
# Trouver le processus qui utilise le port
lsof -i :8080  # pour l'API
lsof -i :3000  # pour le frontend

# Arrêter le processus ou changer le port dans la configuration
```

#### Problème : Les migrations échouent

**Solution** :
```bash
# Vérifier que la base de données existe
psql -U postgres -l | grep leadtracker

# Réappliquer les migrations
cd api
dotnet ef database drop --project LeadTracker.Infrastructure --startup-project LeadTracker.Api
dotnet ef database update --project LeadTracker.Infrastructure --startup-project LeadTracker.Api
```

#### Problème : Erreurs de dépendances .NET

**Solution** :
```bash
# Nettoyer et restaurer
cd api
dotnet clean
dotnet restore
dotnet build
```

#### Problème : Erreurs de dépendances Node.js

**Solution** :
```bash
# Supprimer node_modules et réinstaller
cd web
rm -rf node_modules package-lock.json
npm install
```

## Architecture

- **Backend**: .NET 8 + EF Core + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Cache**: Redis
- **Jobs**: Hangfire
- **Proxy**: Nginx
- **Email**: MailHog (développement)

## Documentation

- [Issues détaillées](docs/issues/detailed-backlog.md) - Backlog complet avec critères d'acceptation
- [ADRs](docs/adr/) - Décisions d'architecture

## 🔧 Dépannage

### Problème : Les services ne démarrent pas

**Symptôme** : `docker-compose ps` montre des services avec le statut `Exit` ou `Restarting`

**Solution** :
```bash
# 1. Vérifier les logs d'erreur
docker-compose logs [nom-du-service]
# Exemple : docker-compose logs api

# 2. Si nécessaire, reconstruire complètement
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problème : Port déjà utilisé

**Symptôme** : Erreur `port is already allocated` ou `address already in use`

**Solutions** :

1. **Arrêter le service qui utilise le port** :
   ```bash
   # Trouver quel processus utilise le port
   # Sur Mac/Linux :
   lsof -i :3000  # pour le port 3000
   lsof -i :8080  # pour le port 8080
   lsof -i :5434  # pour PostgreSQL
   
   # Arrêter le processus ou modifier docker-compose.yml
   ```

2. **Modifier les ports dans `docker-compose.yml`** :
   ```yaml
   # Exemple pour changer le port de l'API
   api:
     ports:
       - "8081:8080"  # Utiliser 8081 au lieu de 8080
   ```

### Problème : L'API ne répond pas après le démarrage

**Symptôme** : `curl http://localhost:8080/health` retourne une erreur

**Solutions** :
```bash
# 1. Vérifier que l'API est bien démarrée
docker-compose ps api

# 2. Vérifier les logs pour voir les erreurs
docker-compose logs api

# 3. Attendre un peu plus (les migrations peuvent prendre du temps)
# Attendre 1-2 minutes puis réessayer

# 4. Vérifier que PostgreSQL est prêt
docker exec leadtracker-db pg_isready -U postgres
```

### Problème : Erreur de connexion à la base de données

**Symptôme** : Logs de l'API montrent des erreurs de connexion PostgreSQL

**Solutions** :
```bash
# 1. Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# 2. Vérifier la connexion manuellement
docker exec leadtracker-db psql -U postgres -d leadtracker -c "SELECT 1;"

# 3. Redémarrer PostgreSQL
docker-compose restart postgres
```

### Problème : L'application web ne se charge pas

**Symptôme** : http://localhost:3000 ne répond pas ou affiche une erreur

**Solutions** :
```bash
# 1. Vérifier que le service web est démarré
docker-compose ps web

# 2. Vérifier les logs
docker-compose logs web

# 3. Vérifier que l'API est accessible depuis le conteneur web
docker exec leadtracker-web curl http://api:8080/health

# 4. Redémarrer le service web
docker-compose restart web
```

### Problème : Migrations de base de données échouent

**Symptôme** : Erreurs dans les logs de l'API concernant les migrations

**Solutions** :
```bash
# 1. Vérifier l'état de la base de données
docker exec leadtracker-db psql -U postgres -d leadtracker -c "\dt"

# 2. Si nécessaire, réinitialiser complètement la base
docker-compose down -v  # Supprime les volumes
docker-compose up -d     # Recrée tout depuis zéro
```

### Problème : Permissions sur Linux/Mac

**Symptôme** : Erreurs de permissions lors de l'écriture de fichiers

**Solution** :
```bash
# Donner les bonnes permissions au répertoire
sudo chown -R $USER:$USER .
```

### Problème : Docker Desktop n'est pas démarré

**Symptôme** : `docker-compose up` échoue avec des erreurs de connexion

**Solution** :
- Sur Mac/Windows : Démarrer Docker Desktop
- Sur Linux : Vérifier que le service Docker est actif : `sudo systemctl status docker`

## Contribution

1. Suivre les [ADRs](docs/adr/) pour les décisions techniques
2. Utiliser les [issues détaillées](docs/issues/detailed-backlog.md) comme référence
3. Tester avec `docker-compose up -d` avant de commit

## Objectif MVP

Fonctionnalités principales : Authentification multi-tenant, CRUD leads, Kanban, Tâches et rappels, Recherche et filtres, Rapports, Import/Export CSV, CI/CD.

Temps de démarrage : moins de 5 minutes avec Docker Compose.