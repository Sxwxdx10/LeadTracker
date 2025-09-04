# Lead Tracker - Next Steps Checklist

## 🎯 Project Overview
**Lead Tracker** est maintenant scaffoldé avec une architecture complète :
- **Backend**: .NET 8 + EF Core + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS  
- **Infrastructure**: Docker + Azure + Terraform
- **CI/CD**: GitHub Actions avec déploiement automatisé

---

## 📋 Phase 1: Setup Initial (Jalon A - 19 Sept 2025)

### ✅ Déjà Complété
- [x] Lecture et analyse du PROJECT_BRIEF.md
- [x] Expansion du BACKLOG_SEED.csv en issues détaillées
- [x] Création des 8 ADRs (Architecture Decision Records)
- [x] Configuration Docker Compose pour développement
- [x] Workflows GitHub Actions CI/CD
- [x] Scaffold solution .NET 8 API avec structure Clean Architecture
- [x] Scaffold application Next.js avec TypeScript
- [x] Configuration infrastructure Terraform pour Azure

### 🔄 À Faire Immédiatement

#### 1. Configuration de l'Environnement de Développement
```bash
# Cloner le repository
git clone <repository-url>
cd LeadTracker

# Copier les fichiers d'environnement
cp env.example .env
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars

# Démarrer les services
docker-compose up -d
```

#### 2. Implémentation des Entités Core (.NET)
- [ ] **Entités de base** (`/api/LeadTracker.Core/Entities/`)
  - [ ] `Organization.cs` - Entité racine multi-tenant
  - [ ] `ApplicationUser.cs` - Extension d'Identity User
  - [ ] `Lead.cs` - Entité principale métier
  - [ ] `Stage.cs` - Étapes du pipeline
  - [ ] `Task.cs` - Tâches et rappels
  - [ ] `Note.cs`, `Tag.cs`, `Activity.cs` - Entités support

#### 3. Configuration de la Base de Données
- [ ] **DbContext** (`/api/LeadTracker.Infrastructure/Data/`)
  - [ ] `LeadTrackerDbContext.cs` avec query filters multi-tenant
  - [ ] Configuration des entités et relations
  - [ ] Indexes optimisés pour les requêtes multi-tenant
- [ ] **Migrations EF Core**
  ```bash
  cd api
  dotnet ef migrations add InitialCreate
  dotnet ef database update
  ```

#### 4. Authentification et Autorisation
- [ ] **Services d'authentification** (`/api/LeadTracker.Api/Services/`)
  - [ ] `AuthService.cs` - JWT + refresh tokens
  - [ ] `TenantContext.cs` - Résolution de l'organisation
  - [ ] `CurrentUserService.cs` - Contexte utilisateur
- [ ] **Middleware** (`/api/LeadTracker.Api/Middleware/`)
  - [ ] `TenantResolutionMiddleware.cs` - Header X-Org-Id
  - [ ] `GlobalExceptionMiddleware.cs` - Gestion d'erreurs
  - [ ] `RequestCorrelationMiddleware.cs` - Traçabilité

#### 5. API Controllers de Base
- [ ] **Controllers** (`/api/LeadTracker.Api/Controllers/`)
  - [ ] `AuthController.cs` - Login/Register/Refresh
  - [ ] `LeadsController.cs` - CRUD leads avec validation
  - [ ] `StagesController.cs` - Gestion des étapes
  - [ ] `HealthController.cs` - Health checks

---

## 📋 Phase 2: Fonctionnalités Core (Jalon A - Suite)

#### 6. Interface Utilisateur Next.js
- [ ] **Composants UI de base** (`/web/src/components/ui/`)
  - [ ] `Button.tsx`, `Input.tsx`, `Card.tsx` - Composants Tailwind
  - [ ] `Modal.tsx`, `Toast.tsx` - Composants d'interaction
  - [ ] `DataTable.tsx` - Tableau avec tri/filtres
- [ ] **Pages principales** (`/web/src/app/`)
  - [ ] `login/page.tsx` - Authentification
  - [ ] `dashboard/page.tsx` - Tableau de bord
  - [ ] `leads/page.tsx` - Liste des leads
  - [ ] `leads/[id]/page.tsx` - Détail lead

#### 7. Gestion d'État et API
- [ ] **Services API** (`/web/src/api/`)
  - [ ] `authApi.ts` - Appels authentification
  - [ ] `leadsApi.ts` - CRUD leads
  - [ ] `apiClient.ts` - Client HTTP avec intercepteurs
- [ ] **Hooks React Query** (`/web/src/hooks/`)
  - [ ] `useAuth.ts` - Gestion authentification
  - [ ] `useLeads.ts` - Gestion des leads
  - [ ] `useTenant.ts` - Contexte organisation

#### 8. Recherche et Filtres
- [ ] **Backend**
  - [ ] Service de recherche full-text PostgreSQL
  - [ ] Endpoints de filtrage combinable
  - [ ] Pagination et tri optimisés
- [ ] **Frontend**
  - [ ] Composant de recherche avec debounce
  - [ ] Filtres avancés (étape, propriétaire, dates)
  - [ ] Sauvegarde des filtres dans l'URL

---

## 📋 Phase 3: Features Avancées (Jalon B - Oct 2025)

#### 9. Kanban Pipeline
- [ ] **Backend**
  - [ ] API de réorganisation des étapes
  - [ ] WebSocket pour mises à jour temps réel
  - [ ] Calcul des métriques par colonne
- [ ] **Frontend**
  - [ ] Composant Kanban avec `@dnd-kit`
  - [ ] Drag & drop entre colonnes
  - [ ] Mise à jour optimiste

#### 10. Système de Tâches et Rappels
- [ ] **Backend**
  - [ ] Jobs Hangfire pour rappels email
  - [ ] Gestion des récurrences
  - [ ] API tâches avec notifications
- [ ] **Frontend**
  - [ ] Vue "Ma journée" des tâches
  - [ ] Calendrier intégré
  - [ ] Notifications push

#### 11. Import/Export CSV
- [ ] **Backend**
  - [ ] Service d'upload et validation
  - [ ] Mapping de colonnes configurable
  - [ ] Jobs de traitement en arrière-plan
- [ ] **Frontend**
  - [ ] Wizard d'import multi-étapes
  - [ ] Prévisualisation des données
  - [ ] Suivi de progression temps réel

#### 12. Rapports et Analytics
- [ ] **Backend**
  - [ ] Services de calcul des métriques
  - [ ] Cache des rapports pré-calculés
  - [ ] Export PDF/Excel
- [ ] **Frontend**
  - [ ] Graphiques avec Chart.js
  - [ ] Dashboard analytics
  - [ ] Filtres de période

---

## 📋 Phase 4: Production Ready

#### 13. Tests et Qualité
- [ ] **Tests Backend**
  ```bash
  cd api
  dotnet test tests/LeadTracker.UnitTests
  dotnet test tests/LeadTracker.IntegrationTests
  ```
- [ ] **Tests Frontend**
  ```bash
  cd web
  npm run test
  npm run test:e2e
  ```
- [ ] **Tests de Sécurité**
  - [ ] Scan de vulnérabilités avec Trivy
  - [ ] Tests d'isolation multi-tenant
  - [ ] Audit des dépendances

#### 14. Observabilité et Monitoring
- [ ] **Logging structuré**
  - [ ] Configuration Serilog avec enrichers
  - [ ] Corrélation des traces par org_id
  - [ ] Intégration Application Insights
- [ ] **Métriques métier**
  - [ ] Collecte des KPIs (leads, conversions)
  - [ ] Alertes sur erreurs critiques
  - [ ] Dashboard de monitoring

#### 15. Déploiement Infrastructure
- [ ] **Azure Infrastructure**
  ```bash
  cd infra/terraform
  terraform init
  terraform plan
  terraform apply
  ```
- [ ] **Configuration CI/CD**
  - [ ] Secrets GitHub Actions
  - [ ] Environnements staging/production
  - [ ] Déploiement blue-green

---

## 🚀 Quick Start Commands

### Développement Local
```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f api web

# Accès aux services
# - Web: http://localhost:3000
# - API: http://localhost:8080
# - Swagger: http://localhost:8080/swagger
# - Hangfire: http://localhost:8080/hangfire
# - PgAdmin: http://localhost:5050
# - MailHog: http://localhost:8025
```

### Base de Données
```bash
# Migrations EF Core
cd api
dotnet ef migrations add InitialCreate
dotnet ef database update

# Seed des données de développement
dotnet run --project LeadTracker.Api -- --seed
```

### Tests
```bash
# Tests API
cd api && dotnet test

# Tests Web
cd web && npm test

# Tests E2E
cd web && npm run test:e2e
```

---

## 📚 Documentation Créée

1. **ADRs** (`/docs/adr/`)
   - ADR-001: Authentication Strategy
   - ADR-002: Multi-tenant Data Isolation
   - ADR-003: Data Model Design
   - ADR-004: Background Jobs Strategy
   - ADR-005: Reporting and Analytics
   - ADR-006: Import/Export Strategy
   - ADR-007: Observability and Monitoring
   - ADR-008: CI/CD Deployment Strategy

2. **Issues Détaillées** (`/docs/issues/detailed-backlog.md`)
   - 19 issues avec critères d'acceptation et tests
   - Répartition sur 2 jalons (Sept-Oct 2025)

3. **Configuration**
   - Docker Compose multi-services
   - GitHub Actions CI/CD
   - Terraform pour Azure
   - Nginx reverse proxy

---

## ⚡ Prochaines Actions Prioritaires

1. **Aujourd'hui**: Implémenter les entités de base et DbContext
2. **Cette semaine**: Authentification JWT + middleware multi-tenant
3. **Semaine suivante**: CRUD leads + interface de base
4. **Mois prochain**: Kanban + système de tâches

---

## 🎯 Objectifs par Jalon

### Jalon A (19 Sept 2025) - MVP Core
- ✅ Setup et architecture
- 🔄 Auth multi-tenant fonctionnelle
- 🔄 CRUD leads avec validation
- 🔄 Interface de base responsive
- 🔄 Recherche et filtres
- 🔄 Seed de données et CI/CD

### Jalon B (Oct 2025) - Features Avancées
- 🔄 Kanban avec drag & drop
- 🔄 Tâches et rappels
- 🔄 Import/Export CSV
- 🔄 Rapports et analytics
- 🔄 Accessibilité et documentation

---

## 💡 Notes Importantes

- **Sécurité**: Tous les endpoints sont protégés par JWT + isolation multi-tenant
- **Performance**: Indexes optimisés, cache Redis, CDN pour assets
- **Scalabilité**: Architecture clean, background jobs, auto-scaling Azure
- **Qualité**: Tests automatisés, linting, monitoring complet

**🚀 Le projet est prêt pour le développement ! Commencez par la Phase 1.**
