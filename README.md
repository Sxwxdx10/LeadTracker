# Lead Tracker

Système de gestion de leads multi-tenant avec tableaux Kanban, gestion des tâches et analyses.

## Démarrage Rapide

Temps estimé : moins de 5 minutes

### Prérequis
- [Docker](https://www.docker.com/get-started) et Docker Compose
- [Git](https://git-scm.com/)

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd LeadTracker
   ```

2. **Configurer l'environnement**
   ```bash
   cp env.example .env
   # Modifier .env si nécessaire (optionnel pour le développement)
   ```

3. **Démarrer tous les services**
   ```bash
   docker-compose up -d
   ```

4. **Vérifier que tout fonctionne**
   ```bash
   docker-compose ps
   # Tous les services doivent être "Up" ou "healthy"
   ```

### Accès aux Services

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Application principale |
| API | http://localhost:8080 | API REST |
| Swagger | http://localhost:8080/swagger | Documentation API |
| Hangfire | http://localhost:8080/hangfire | Jobs en arrière-plan |
| MailHog | http://localhost:8025 | Interface email de développement |
| PostgreSQL | localhost:5433 | Base de données |
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

### Tests de Santé

```bash
# Tester l'API
curl http://localhost:8080/health
# Réponse attendue: "Healthy"

# Tester l'application web
curl http://localhost:3000/api/health
# Réponse attendue: {"status":"ok",...}

# Tester PostgreSQL
docker exec leadtracker-db psql -U postgres -d leadtracker -c "SELECT 1;"
# Réponse attendue: (1 row)
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

## Dépannage

### Services qui ne démarrent pas
```bash
# Vérifier les logs d'erreur
docker-compose logs [service-name]

# Reconstruire complètement
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Port déjà utilisé
Si le port 5433 (PostgreSQL) est occupé :
```bash
# Changer le port dans docker-compose.yml
ports:
  - "5434:5432"  # ou un autre port libre
```

### Problèmes de permissions
```bash
# Sur Linux/Mac, donner les bonnes permissions
sudo chown -R $USER:$USER .
```

## Contribution

1. Suivre les [ADRs](docs/adr/) pour les décisions techniques
2. Utiliser les [issues détaillées](docs/issues/detailed-backlog.md) comme référence
3. Tester avec `docker-compose up -d` avant de commit

## Objectif MVP

Fonctionnalités principales : Authentification multi-tenant, CRUD leads, Kanban, Tâches et rappels, Recherche et filtres, Rapports, Import/Export CSV, CI/CD.

Temps de démarrage : moins de 5 minutes avec Docker Compose.