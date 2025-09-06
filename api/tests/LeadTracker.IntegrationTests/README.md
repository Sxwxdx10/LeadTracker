# Tests d'Intégration LeadTracker

Ce projet contient les tests d'intégration pour LeadTracker, utilisant PostgreSQL via Docker Compose.

## 🏗️ Architecture

### Types de Tests

1. **Tests de Contraintes d'Intégrité** (`DockerComposeIntegrityConstraintTests`)
   - Contraintes UNIQUE
   - Contraintes de clés étrangères
   - Contraintes de champs requis
   - Contraintes de longueur maximale
   - Politiques de cascade/restrict

2. **Tests de Performance** (`DockerComposePerformanceTests`)
   - Requêtes indexées
   - Requêtes composites
   - Requêtes avec relations
   - Tests de performance

### Infrastructure

- **Docker Compose** : PostgreSQL + Redis pour les tests
- **EF Core** : Accès à la base de données
- **FluentAssertions** : Assertions expressives
- **xUnit** : Framework de test

## 🚀 Exécution des Tests

### Prérequis

- Docker Desktop en cours d'exécution
- Docker Compose installé
- .NET 8 SDK

### Scripts Disponibles

#### Linux/macOS
```bash
# Exécuter tous les tests d'intégration
./run-integration-tests.sh

# Exécuter manuellement
docker-compose -f docker-compose.test.yml up -d
dotnet test tests/LeadTracker.IntegrationTests/ --filter "FullyQualifiedName~DockerCompose"
docker-compose -f docker-compose.test.yml down -v
```

#### Windows
```powershell
# Exécuter tous les tests d'intégration
.\run-integration-tests.ps1

# Exécuter sans nettoyage (pour debug)
.\run-integration-tests.ps1 -SkipCleanup
```

### Exécution Manuelle

1. **Démarrer les services** :
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Exécuter les tests** :
   ```bash
   dotnet test tests/LeadTracker.IntegrationTests/ --filter "FullyQualifiedName~DockerCompose"
   ```

3. **Arrêter les services** :
   ```bash
   docker-compose -f docker-compose.test.yml down -v
   ```

## 🔧 Configuration

### Ports Utilisés

- **PostgreSQL** : 5433 (pour éviter les conflits avec le port 5432)
- **Redis** : 6380 (pour éviter les conflits avec le port 6379)

### Variables d'Environnement

- `POSTGRES_DB=leadtracker_test`
- `POSTGRES_USER=test`
- `POSTGRES_PASSWORD=test`

### Connexion à la Base

```csharp
Host=localhost;Port=5433;Database=leadtracker_test;Username=test;Password=test;
```

## 📊 Résultats Attendus

### Tests de Contraintes d'Intégrité

- ✅ Contrainte UNIQUE sur domain
- ✅ Contrainte UNIQUE sur email par organisation
- ✅ Contraintes de clés étrangères
- ✅ Contraintes de champs requis
- ✅ Contraintes de longueur maximale
- ✅ Cascade delete
- ✅ Restrict delete

### Tests de Performance

- ✅ Requêtes par OrganizationId (< 500ms)
- ✅ Requêtes par Email (< 100ms)
- ✅ Requêtes par CreatedAt (< 200ms)
- ✅ Requêtes composites (< 300ms)
- ✅ Requêtes de comptage (< 200ms)
- ✅ Requêtes avec Include (< 300ms)

## 🐛 Dépannage

### PostgreSQL n'est pas prêt

```bash
# Vérifier les logs
docker-compose -f docker-compose.test.yml logs postgres-test

# Redémarrer les services
docker-compose -f docker-compose.test.yml restart
```

### Ports en conflit

Modifier les ports dans `docker-compose.test.yml` :
```yaml
ports:
  - "5434:5432"  # PostgreSQL
  - "6381:6379"  # Redis
```

### Tests qui échouent

1. Vérifier que Docker est en cours d'exécution
2. Vérifier que les ports ne sont pas utilisés
3. Vérifier les logs des conteneurs
4. Nettoyer les volumes : `docker-compose -f docker-compose.test.yml down -v`

## 📝 Notes

- Les tests utilisent une base de données dédiée (`leadtracker_test`)
- Les données sont nettoyées après chaque test
- Les conteneurs sont automatiquement arrêtés après les tests
- Les tests sont plus lents que les tests unitaires (démarrage des conteneurs)
