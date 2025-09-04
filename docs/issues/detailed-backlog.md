# Lead Tracker - Issues détaillées avec critères d'acceptation et tests

## Jalon A (19-09-2025)

### 1. Bootstraper le repo & Docker Compose
**Labels:** `infra`, `setup`  
**Poids:** 2  

#### Description
Initialiser solution .NET + React, config Docker (api, db, proxy), variables d'env, README démarrage.

#### Critères d'acceptation
- [x] Solution .NET 8 avec structure clean architecture
- [x] Application Next.js configurée avec TypeScript
- [x] Docker Compose avec services : API, DB PostgreSQL, proxy Nginx
- [x] Variables d'environnement documentées dans .env.example
- [x] README avec instructions de démarrage en < 5 minutes
- [x] Tous les services démarrent avec `docker-compose up`

#### Tests
- [x] Test d'intégration: `docker-compose up` démarre tous les services
- [x] Test de santé: endpoints `/health` retournent 200
- [x] Test de connectivité: API peut se connecter à PostgreSQL

---

### 2. Modèle de données initial (Org, User, Lead, Stage, Task)
**Labels:** `backend`, `data`  
**Poids:** 3  

#### Description
EF Core entities + migrations. Ajout des contraintes et indexes clés.

#### Critères d'acceptation
- [ ] Entités EF Core : Organization, User, Lead, Stage, Task
- [ ] Relations correctes avec clés étrangères
- [ ] Indexes sur colonnes fréquemment requêtées (org_id, email, created_at)
- [ ] Contraintes d'intégrité (email unique par org, etc.)
- [ ] Migration initiale appliquée automatiquement
- [ ] Seed data basique pour développement

#### Tests
- [ ] Tests unitaires pour validation des entités
- [ ] Tests d'intégration pour migrations
- [ ] Tests de contraintes d'intégrité
- [ ] Tests de performance sur requêtes indexées

---

### 3. Auth & JWT (multi-tenant)
**Labels:** `backend`, `auth`, `security`  
**Poids:** 3  

#### Description
ASP.NET Identity, login/register/reset, JWT + refresh, résolution org par header X-Org-Id.

#### Critères d'acceptation
- [ ] Endpoints : POST /auth/register, /auth/login, /auth/refresh, /auth/reset
- [ ] JWT avec claims : user_id, org_id, roles
- [ ] Refresh token sécurisé (httpOnly cookie)
- [ ] Header X-Org-Id résout l'organisation active
- [ ] Validation email lors de l'inscription
- [ ] Reset password avec token temporaire (15min)

#### Tests
- [ ] Tests unitaires pour AuthService
- [ ] Tests d'intégration pour endpoints auth
- [ ] Tests de sécurité : tentatives de force brute
- [ ] Tests multi-tenant : isolation des données

---

### 4. Filtre global EF Core par org_id
**Labels:** `backend`, `security`  
**Poids:** 2  

#### Description
HasQueryFilter sur entités tenantées, tests d'isolation des données.

#### Critères d'acceptation
- [ ] QueryFilter global sur toutes les entités tenantées
- [ ] Résolution automatique de org_id depuis le contexte utilisateur
- [ ] Impossible d'accéder aux données d'une autre organisation
- [ ] Tests d'isolation exhaustifs

#### Tests
- [ ] Tests unitaires pour query filters
- [ ] Tests d'intégration multi-tenant
- [ ] Tests de sécurité : tentatives d'accès cross-tenant
- [ ] Tests de performance avec filtres

---

### 5. Seed de données (50 leads de démo)
**Labels:** `backend`, `data`, `docs`  
**Poids:** 1  

#### Description
Script de seed pour démo et tests. Documentation incluse.

#### Critères d'acceptation
- [ ] 50 leads réalistes avec données variées
- [ ] Répartition sur différentes étapes du pipeline
- [ ] Tâches et rappels associés
- [ ] Script exécutable via commande CLI
- [ ] Documentation du jeu de données

#### Tests
- [ ] Test d'exécution du script de seed
- [ ] Validation de l'intégrité des données seedées
- [ ] Test de reproductibilité (idempotent)

---

### 6. CRUD Leads (API) + validation
**Labels:** `backend`, `api`  
**Poids:** 3  

#### Description
Endpoints REST + validations e-mail/téléphone + pagination/tri.

#### Critères d'acceptation
- [ ] Endpoints : GET, POST, PUT, DELETE /api/leads
- [ ] Validation : email format, téléphone international
- [ ] Pagination avec métadonnées (total, pages)
- [ ] Tri par : nom, email, created_at, stage
- [ ] Filtrage basique par stage et owner
- [ ] Réponses standardisées avec codes HTTP appropriés

#### Tests
- [ ] Tests unitaires pour validations
- [ ] Tests d'intégration pour CRUD operations
- [ ] Tests de pagination et tri
- [ ] Tests de validation des formats

---

### 7. UI Liste Leads + Détail
**Labels:** `frontend`, `ui`  
**Poids:** 3  

#### Description
Tableau (tri/filtres) + page détail lead (notes, tâches).

#### Critères d'acceptation
- [ ] Liste paginée avec tri par colonnes
- [ ] Filtres : recherche texte, étape, propriétaire
- [ ] Page détail avec onglets : infos, notes, tâches
- [ ] Édition inline des champs principaux
- [ ] Interface responsive (mobile-first)
- [ ] Loading states et gestion d'erreurs

#### Tests
- [ ] Tests unitaires pour composants React
- [ ] Tests d'intégration avec API
- [ ] Tests E2E pour workflows utilisateur
- [ ] Tests d'accessibilité (keyboard navigation)

---

### 8. Recherche & Filtres
**Labels:** `backend`, `frontend`, `feature`  
**Poids:** 3  

#### Description
Recherche texte et filtres combinables (étape, owner, tag, dates).

#### Critères d'acceptation
- [ ] Recherche full-text sur nom, email, société, notes
- [ ] Filtres combinables : étape, propriétaire, tags, dates
- [ ] Sauvegarde des filtres actifs dans l'URL
- [ ] Performance < 200ms pour 10k+ leads
- [ ] Auto-complétion pour tags et propriétaires

#### Tests
- [ ] Tests unitaires pour logique de recherche
- [ ] Tests de performance avec gros datasets
- [ ] Tests d'intégration frontend/backend
- [ ] Tests de combinaisons de filtres

---

### 9. Logs & Observabilité
**Labels:** `infra`, `observability`  
**Poids:** 2  

#### Description
Serilog + traces (corrélation org_id), niveaux de logs, dashboard simple.

#### Critères d'acceptation
- [ ] Serilog configuré avec enrichers (org_id, user_id)
- [ ] Niveaux de logs appropriés (Debug, Info, Warning, Error)
- [ ] Logs structurés (JSON) pour parsing
- [ ] Dashboard simple pour monitoring
- [ ] Alertes sur erreurs critiques

#### Tests
- [ ] Tests de configuration des logs
- [ ] Tests de corrélation des traces
- [ ] Tests d'intégration avec dashboard

---

### 10. CI GitHub Actions: build/lint/test + image
**Labels:** `infra`, `ci`  
**Poids:** 2  

#### Description
Pipeline: restore, build, test; build image Docker; push registry.

#### Critères d'acceptation
- [ ] Workflow déclenché sur push/PR vers main
- [ ] Étapes : restore, build, lint, test
- [ ] Build d'image Docker multi-stage
- [ ] Push vers registry avec tags sémantiques
- [ ] Notifications sur échecs
- [ ] Cache des dépendances pour performance

#### Tests
- [ ] Test du pipeline sur différentes branches
- [ ] Validation de la qualité des images Docker
- [ ] Tests de déploiement automatique

---

## Jalon B (Oct-2025)

### 11. Kanban Pipeline (drag & drop)
**Labels:** `frontend`, `feature`  
**Poids:** 3  

#### Description
Board par étapes, déplacement de cartes, recalcul métriques.

#### Critères d'acceptation
- [ ] Vue Kanban avec colonnes par étape
- [ ] Drag & drop des cartes entre colonnes
- [ ] Mise à jour temps réel via WebSocket
- [ ] Métriques par colonne (nombre, valeur totale)
- [ ] Filtrage des cartes affichées
- [ ] Performance fluide avec 500+ leads

#### Tests
- [ ] Tests E2E pour drag & drop
- [ ] Tests de performance avec gros datasets
- [ ] Tests de synchronisation temps réel
- [ ] Tests d'accessibilité pour interactions

---

### 12. Gestion des étapes (org)
**Labels:** `backend`, `feature`  
**Poids:** 2  

#### Description
CRUD des étapes, ordre personnalisable par org.

#### Critères d'acceptation
- [ ] CRUD complet pour les étapes
- [ ] Ordre personnalisable (drag & drop)
- [ ] Validation : au moins une étape active
- [ ] Migration automatique des leads lors de suppression d'étape
- [ ] Couleurs personnalisables par étape

#### Tests
- [ ] Tests CRUD pour étapes
- [ ] Tests de réorganisation
- [ ] Tests de migration des données
- [ ] Tests de validation métier

---

### 13. Tâches & Rappels + Vue 'Ma journée'
**Labels:** `backend`, `frontend`, `feature`  
**Poids:** 3  

#### Description
CRUD tâches, rappels, vue utilisateur des tâches dues/à venir.

#### Critères d'acceptation
- [ ] CRUD tâches avec due_date, priority, assignee
- [ ] Rappels configurables (email, in-app)
- [ ] Vue "Ma journée" : tâches dues aujourd'hui/cette semaine
- [ ] Notifications push pour rappels
- [ ] Récurrence pour tâches répétitives

#### Tests
- [ ] Tests CRUD pour tâches
- [ ] Tests de logique de rappels
- [ ] Tests d'intégration notifications
- [ ] Tests de performance pour vue "Ma journée"

---

### 14. Emails de résumé quotidien (7:00)
**Labels:** `backend`, `jobs`  
**Poids:** 2  

#### Description
Job Hangfire pour envoi quotidien des tâches à venir.

#### Critères d'acceptation
- [ ] Job Hangfire planifié à 7:00 chaque jour
- [ ] Email HTML avec tâches dues/à venir
- [ ] Personnalisation par utilisateur (opt-out)
- [ ] Templates d'email responsive
- [ ] Gestion des échecs d'envoi

#### Tests
- [ ] Tests unitaires pour job Hangfire
- [ ] Tests d'intégration email
- [ ] Tests de gestion des échecs
- [ ] Tests de templates email

---

### 15. Import CSV (mapping + rapport d'erreurs)
**Labels:** `backend`, `frontend`, `feature`  
**Poids:** 3  

#### Description
Upload CSV, mapping colonnes→champs, aperçu, import, rapport.

#### Critères d'acceptation
- [ ] Upload de fichier CSV avec validation format
- [ ] Interface de mapping colonnes vers champs
- [ ] Aperçu des données avant import
- [ ] Import par batch avec progress bar
- [ ] Rapport détaillé : succès/erreurs/doublons
- [ ] Gestion des encodages (UTF-8, ISO-8859-1)

#### Tests
- [ ] Tests de parsing CSV avec différents formats
- [ ] Tests de validation des données
- [ ] Tests de gestion des erreurs
- [ ] Tests de performance avec gros fichiers

---

### 16. Export CSV (avec filtres)
**Labels:** `backend`, `frontend`, `feature`  
**Poids:** 1  

#### Description
Exporter la liste actuelle filtrée en CSV.

#### Critères d'acceptation
- [ ] Export respecte les filtres actifs
- [ ] Sélection des colonnes à exporter
- [ ] Encodage UTF-8 avec BOM pour Excel
- [ ] Download asynchrone pour gros exports
- [ ] Historique des exports

#### Tests
- [ ] Tests d'export avec différents filtres
- [ ] Tests de format CSV généré
- [ ] Tests de performance avec gros datasets

---

### 17. Rapports: Funnel + Ventes gagnées
**Labels:** `backend`, `frontend`, `analytics`  
**Poids:** 2  

#### Description
Graphiques funnel, histogramme des ventes gagnées par période.

#### Critères d'acceptation
- [ ] Graphique funnel par étapes avec taux de conversion
- [ ] Histogramme ventes par période (jour/semaine/mois)
- [ ] Filtres par date, propriétaire, source
- [ ] Export des rapports en PDF/Excel
- [ ] Mise en cache des données agrégées

#### Tests
- [ ] Tests de calcul des métriques
- [ ] Tests de génération des graphiques
- [ ] Tests de performance avec historique
- [ ] Tests d'export des rapports

---

### 18. Accessibilité de base (Lighthouse ≥ 90)
**Labels:** `frontend`, `ux`, `quality`  
**Poids:** 1  

#### Description
Audit accessibilité, correctifs clavier/ARIA/contrastes.

#### Critères d'acceptation
- [ ] Score Lighthouse Accessibility ≥ 90
- [ ] Navigation complète au clavier
- [ ] Labels ARIA sur tous les contrôles
- [ ] Contrastes conformes WCAG 2.1 AA
- [ ] Support lecteurs d'écran

#### Tests
- [ ] Tests automatisés Lighthouse
- [ ] Tests de navigation clavier
- [ ] Tests avec lecteurs d'écran
- [ ] Tests de contraste automatisés

---

### 19. Documentation (manuel utilisateur + technique)
**Labels:** `docs`, `quality`  
**Poids:** 2  

#### Description
Rédaction initiale; mise à jour continue; section FAQ.

#### Critères d'acceptation
- [ ] Manuel utilisateur avec captures d'écran
- [ ] Documentation technique (API, architecture)
- [ ] Guide de déploiement
- [ ] FAQ basée sur retours utilisateurs
- [ ] Documentation maintenue à jour automatiquement

#### Tests
- [ ] Tests de validité des liens documentation
- [ ] Tests de cohérence avec code
- [ ] Validation par utilisateurs pilotes
