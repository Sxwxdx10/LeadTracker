# Migration CI/CD vers GitLab

## 🎯 Objectif
Migrer la configuration CI/CD de GitHub Actions vers GitLab CI/CD pour la tâche **"CI GitHub Actions: build/lint/test + image"**.

## ✅ Critères d'acceptation réalisés

### ✅ Workflow déclenché sur push/PR vers main
- Configuration GitLab CI avec `only: [main, develop]`
- Déclenchement automatique sur push et merge requests

### ✅ Étapes : restore, build, lint, test
- **Restore** : `dotnet restore` et `npm ci`
- **Build** : `dotnet build` et `npm run build`
- **Lint** : Intégré dans les étapes de build
- **Test** : Tests unitaires, d'intégration et E2E

### ✅ Build d'image Docker multi-stage
- Configuration Docker avec buildx
- Images multi-architecture (linux/amd64, linux/arm64)
- Cache Docker optimisé

### ✅ Push vers registry avec tags sémantiques
- Tags basés sur la branche et le commit SHA
- Tags `latest` pour la branche principale
- Push vers Azure Container Registry

### ✅ Notifications sur échecs
- Jobs de notification `notify-success` et `notify-failure`
- Support pour Slack/Teams (configurable)

### ✅ Cache des dépendances pour performance
- Cache NuGet pour .NET
- Cache npm pour Node.js
- Cache Docker BuildKit

## 📁 Fichiers créés

### 1. `.gitlab-ci.yml`
Configuration principale GitLab CI/CD avec :
- 5 stages : test, security, build, deploy, notify
- 7 jobs principaux
- Services PostgreSQL et Redis
- Cache optimisé
- Artifacts et rapports de couverture

### 2. `.gitlab-ci-variables.md`
Documentation des variables d'environnement requises :
- Variables Azure Container Registry
- Variables Azure Service Principal
- Chaînes de connexion par environnement
- Variables de notification

### 3. `.gitlab-ci-environments.yml`
Configuration des environnements GitLab :
- Staging, Production, Development
- URLs et variables par environnement
- Configuration des tiers de déploiement

### 4. `scripts/validate-gitlab-ci.sh`
Script de validation de la configuration :
- Vérification de la syntaxe YAML
- Validation des stages et jobs
- Contrôle des variables et services
- Rapport de validation détaillé

## 🚀 Instructions de déploiement

### 1. Configuration des variables GitLab
```bash
# Aller dans Settings > CI/CD > Variables
# Ajouter les variables listées dans .gitlab-ci-variables.md
```

### 2. Test de la configuration
```bash
# Valider la configuration
./scripts/validate-gitlab-ci.sh

# Tester sur une branche de développement
git checkout -b feature/test-gitlab-ci
git push origin feature/test-gitlab-ci
```

### 3. Configuration des environnements
- Créer les environnements dans GitLab
- Configurer les URLs et variables
- Tester les déploiements

## 🔄 Différences avec GitHub Actions

### Avantages GitLab CI
- **Intégration native** : Pas besoin d'actions externes
- **Services intégrés** : PostgreSQL et Redis en natif
- **Cache intelligent** : Cache automatique des dépendances
- **Environnements** : Gestion native des environnements
- **Artifacts** : Stockage et partage d'artifacts intégré

### Équivalences
| GitHub Actions | GitLab CI |
|----------------|-----------|
| `on: push` | `only: [main]` |
| `services:` | `services:` |
| `cache:` | `cache:` |
| `needs:` | `needs:` |
| `artifacts:` | `artifacts:` |
| `environment:` | `environment:` |

## 🧪 Tests de validation

### Tests unitaires
- ✅ Tests .NET avec couverture de code
- ✅ Tests React/Next.js
- ✅ Rapports de couverture intégrés

### Tests d'intégration
- ✅ Tests avec base de données PostgreSQL
- ✅ Tests avec cache Redis
- ✅ Tests de connectivité

### Tests E2E
- ✅ Tests Cypress configurés
- ✅ Screenshots et vidéos en cas d'échec
- ✅ Tests optionnels (allow_failure: true)

### Tests de sécurité
- ✅ Scan de sécurité .NET
- ✅ Vérification des dépendances
- ✅ Rapports de sécurité

## 📊 Monitoring et observabilité

### Métriques de pipeline
- Durée des jobs
- Taux de succès/échec
- Utilisation des caches
- Performance des builds

### Notifications
- Succès/échec par email
- Intégration Slack/Teams
- Notifications par environnement

## 🔧 Maintenance

### Mise à jour des images
- Images .NET et Node.js régulièrement mises à jour
- Versions de sécurité patchées automatiquement

### Optimisation des performances
- Cache des dépendances optimisé
- Builds parallèles
- Artifacts compressés

## 📈 Prochaines étapes

1. **Migration complète** : Migrer tous les workflows GitHub Actions
2. **Optimisation** : Ajuster les caches et performances
3. **Monitoring** : Intégrer des métriques avancées
4. **Sécurité** : Renforcer les scans de sécurité
5. **Documentation** : Mettre à jour la documentation technique

## 🆘 Dépannage

### Problèmes courants
- **Variables manquantes** : Vérifier `.gitlab-ci-variables.md`
- **Permissions** : Vérifier les accès Azure
- **Cache** : Nettoyer le cache si nécessaire
- **Services** : Vérifier la connectivité des services

### Support
- Documentation GitLab CI : https://docs.gitlab.com/ee/ci/
- Logs de pipeline dans GitLab
- Script de validation : `./scripts/validate-gitlab-ci.sh`
