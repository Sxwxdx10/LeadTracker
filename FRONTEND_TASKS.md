# 🎯 Tâches Frontend - Lead Tracker

## 📋 Vue d'ensemble

Ce document liste toutes les tâches frontend restantes à implémenter pour compléter l'application Lead Tracker. Les tâches sont organisées par priorité et incluent des détails techniques précis.

## ✅ Ce qui est déjà fait

### Pages existantes
- ✅ **Page d'accueil** (`/`) - Dashboard principal
- ✅ **Page de connexion** (`/login`) - Authentification utilisateur
- ✅ **Page d'inscription** (`/register`) - Création de compte
- ✅ **Page des leads** (`/leads`) - Liste des prospects
- ✅ **Page de détail lead** (`/leads/[id]`) - Détails d'un prospect
- ✅ **Page de création lead** (`/leads/new`) - Formulaire de création

### Composants existants
- ✅ **Authentification** : `AuthContext`, `ProtectedRoute`, `UserMenu`
- ✅ **Leads** : `LeadsTable`, `LeadsFilters`
- ✅ **UI** : `Button`, `Input`, `Table`, `Badge`, `Loading`, `Error`, `EmptyState`, `Pagination`, `Tabs`

### Services existants
- ✅ **API** : Configuration Axios, intercepteurs
- ✅ **Auth** : Services de connexion/inscription
- ✅ **Hooks** : `useLeads` pour la gestion des données

---

## 🚨 Tâches critiques (Priorité 1)

### 1. Pages d'authentification manquantes

#### 1.1 Page de mot de passe oublié
**Fichier à créer** : `web/src/app/forgot-password/page.tsx`
- Formulaire avec email
- Validation côté client
- Intégration avec l'API `/api/auth/reset-password`
- Messages de succès/erreur
- Lien vers la page de connexion

#### 1.2 Page de réinitialisation de mot de passe
**Fichier à créer** : `web/src/app/reset-password/page.tsx`
- Formulaire avec token, nouveau mot de passe, confirmation
- Validation des mots de passe (force, correspondance)
- Intégration avec l'API `/api/auth/confirm-reset-password`
- Gestion des tokens expirés
- Redirection vers la page de connexion après succès

#### 1.3 Page de vérification email
**Fichier à créer** : `web/src/app/verify-email/page.tsx`
- Affichage du statut de vérification
- Bouton de renvoi d'email de vérification
- Redirection automatique après vérification

### 2. Gestion des erreurs et états de chargement

#### 2.1 Composant de gestion d'erreurs global
**Fichier à créer** : `web/src/components/ErrorBoundary.tsx`
- Capture des erreurs React
- Affichage d'une page d'erreur utilisateur-friendly
- Bouton de retry
- Logging des erreurs

#### 2.2 Amélioration des états de chargement
**Fichiers à modifier** : Tous les composants existants
- Squelettes de chargement (skeleton loaders)
- Indicateurs de progression pour les actions longues
- Désactivation des boutons pendant les requêtes

### 3. Amélioration de l'expérience utilisateur

#### 3.1 Notifications toast
**Fichier à créer** : `web/src/components/ui/toast.tsx`
**Fichier à créer** : `web/src/hooks/useToast.ts`
- Système de notifications temporaires
- Types : succès, erreur, avertissement, info
- Positionnement configurable
- Auto-dismiss avec timer

#### 3.2 Modales de confirmation
**Fichier à créer** : `web/src/components/ui/modal.tsx`
**Fichier à créer** : `web/src/hooks/useModal.ts`
- Modales réutilisables
- Confirmation de suppression
- Formulaires dans des modales
- Gestion des touches (Escape, Enter)

---

## 🔧 Tâches importantes (Priorité 2)

### 4. Pages de gestion des utilisateurs

#### 4.1 Page de profil utilisateur
**Fichier à créer** : `web/src/app/profile/page.tsx`
- Affichage des informations personnelles
- Modification du profil
- Changement de mot de passe
- Paramètres de notification

#### 4.2 Page de gestion des utilisateurs (Admin)
**Fichier à créer** : `web/src/app/users/page.tsx`
- Liste des utilisateurs de l'organisation
- Invitation de nouveaux utilisateurs
- Gestion des rôles
- Activation/désactivation des comptes

### 5. Pages de configuration

#### 5.1 Page des paramètres de l'organisation
**Fichier à créer** : `web/src/app/settings/organization/page.tsx`
- Informations de l'organisation
- Gestion du domaine
- Paramètres de facturation
- Gestion des intégrations

#### 5.2 Page de gestion des étapes
**Fichier à créer** : `web/src/app/settings/stages/page.tsx`
- CRUD des étapes du pipeline
- Réorganisation par drag & drop
- Personnalisation des couleurs
- Configuration des règles de transition

### 6. Amélioration des pages existantes

#### 6.1 Amélioration de la page des leads
**Fichier à modifier** : `web/src/app/leads/page.tsx`
- Filtres avancés (date, propriétaire, source)
- Recherche en temps réel
- Tri par colonnes
- Export CSV
- Vue Kanban (optionnelle)

#### 6.2 Amélioration de la page de détail lead
**Fichier à modifier** : `web/src/app/leads/[id]/page.tsx`
- Historique des activités
- Timeline des interactions
- Pièces jointes
- Notes et commentaires
- Tâches associées

---

## 🎨 Tâches d'amélioration (Priorité 3)

### 7. Composants UI supplémentaires

#### 7.1 Composants de formulaire
**Fichiers à créer** :
- `web/src/components/ui/select.tsx` - Sélecteurs dropdown
- `web/src/components/ui/textarea.tsx` - Zones de texte
- `web/src/components/ui/checkbox.tsx` - Cases à cocher
- `web/src/components/ui/radio.tsx` - Boutons radio
- `web/src/components/ui/datepicker.tsx` - Sélecteur de date
- `web/src/components/ui/file-upload.tsx` - Upload de fichiers

#### 7.2 Composants de navigation
**Fichiers à créer** :
- `web/src/components/ui/breadcrumb.tsx` - Fil d'Ariane
- `web/src/components/ui/sidebar.tsx` - Barre latérale
- `web/src/components/ui/navbar.tsx` - Barre de navigation
- `web/src/components/ui/tabs.tsx` - Onglets (améliorer l'existant)

### 8. Pages de rapports et analytics

#### 8.1 Dashboard des rapports
**Fichier à créer** : `web/src/app/reports/page.tsx`
- Graphiques de conversion
- Métriques de performance
- Filtres par période
- Export des rapports

#### 8.2 Page de statistiques avancées
**Fichier à créer** : `web/src/app/analytics/page.tsx`
- Funnel de conversion
- Analyse des sources
- Performance par utilisateur
- Tendances temporelles

### 9. Fonctionnalités avancées

#### 9.1 Import/Export de données
**Fichier à créer** : `web/src/app/import/page.tsx`
- Upload de fichiers CSV
- Mapping des colonnes
- Aperçu des données
- Rapport d'import

**Fichier à créer** : `web/src/app/export/page.tsx`
- Configuration de l'export
- Sélection des colonnes
- Filtres d'export
- Téléchargement

#### 9.2 Gestion des tâches
**Fichier à créer** : `web/src/app/tasks/page.tsx`
- Vue "Ma journée"
- Liste des tâches
- Création/modification de tâches
- Rappels et notifications

---

## 🛠️ Tâches techniques (Priorité 4)

### 10. Optimisation et performance

#### 10.1 Lazy loading et code splitting
- Implémentation du lazy loading pour les pages
- Code splitting par route
- Optimisation des bundles

#### 10.2 Gestion du cache
**Fichier à créer** : `web/src/hooks/useCache.ts`
- Cache des requêtes API
- Invalidation intelligente
- Synchronisation des données

### 11. Accessibilité et internationalisation

#### 11.1 Amélioration de l'accessibilité
- Tests avec lecteurs d'écran
- Navigation au clavier
- Contraste des couleurs
- Labels ARIA

#### 11.2 Support multilingue
**Fichiers à créer** :
- `web/src/locales/fr.json`
- `web/src/locales/en.json`
- `web/src/hooks/useTranslation.ts`
- `web/src/components/LanguageSelector.tsx`

### 12. Tests et qualité

#### 12.1 Tests unitaires
**Fichiers à créer** :
- Tests pour tous les composants
- Tests pour les hooks personnalisés
- Tests pour les services API

#### 12.2 Tests d'intégration
**Fichiers à créer** :
- Tests E2E avec Playwright
- Tests de régression
- Tests de performance

---

## 📝 Notes techniques importantes

### Structure des composants
```
web/src/components/
├── ui/           # Composants UI réutilisables
├── auth/         # Composants d'authentification
├── leads/        # Composants spécifiques aux leads
├── forms/        # Composants de formulaire
├── layout/       # Composants de mise en page
└── common/       # Composants communs
```

### Conventions de nommage
- **Composants** : PascalCase (`UserProfile.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useAuth.ts`)
- **Types** : PascalCase (`UserProfileProps`)
- **Constantes** : UPPER_SNAKE_CASE (`API_BASE_URL`)

### Technologies à utiliser
- **Framework** : Next.js 14 avec App Router
- **Styling** : Tailwind CSS
- **State Management** : React Query + Context API
- **Forms** : React Hook Form + Zod
- **Icons** : Lucide React
- **Testing** : Jest + React Testing Library

### API Endpoints disponibles
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/reset-password` - Demande de reset
- `POST /api/auth/confirm-reset-password` - Confirmation reset
- `GET /api/leads` - Liste des leads
- `GET /api/leads/stats` - Statistiques des leads
- `GET /api/stages` - Étapes du pipeline

---

## 🎯 Prochaines étapes recommandées

1. **Commencer par les tâches critiques** (Priorité 1)
2. **Implémenter les pages d'authentification manquantes**
3. **Améliorer la gestion des erreurs et états de chargement**
4. **Ajouter les notifications toast et modales**
5. **Continuer avec les tâches importantes** (Priorité 2)


