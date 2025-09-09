# Lead Tracker - Frontend

Interface utilisateur moderne pour la gestion de leads multi-tenant construite avec Next.js 14 et React 18.

## 🚀 Fonctionnalités implémentées

### ✅ Issue #7 - UI Liste Leads + Détail - **TERMINÉ**

#### Liste des leads
- **Tableau paginé** avec tri par colonnes (nom, email, valeur, date, etc.)
- **Filtres avancés** : recherche texte, étape du pipeline, statut
- **Pagination** avec métadonnées (total, pages, navigation)
- **Actions rapides** : voir, modifier, supprimer
- **Statistiques en temps réel** : total leads, qualifiés, valeur, taux de conversion

#### Page de détail
- **Vue complète du lead** avec informations de contact et commerciales
- **Onglets organisés** : Détails, Notes, Tâches (en développement)
- **Interface responsive** optimisée mobile-first
- **Actions contextuelles** : modifier, supprimer, retour

#### Création de leads
- **Formulaire complet** avec validation
- **Champs organisés** par sections (base, entreprise, commercial, notes)
- **Validation en temps réel** avec messages d'erreur
- **Support du format canadien** pour les numéros de téléphone

## 🛠 Stack technique

### Framework et outils principaux
- **Next.js 14** - Framework React avec App Router
- **React 18** - Bibliothèque UI avec hooks modernes
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire

### Gestion d'état et données
- **TanStack Query (React Query)** - Cache et synchronisation des données
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation des schémas
- **Axios** - Client HTTP

### Composants UI
- **Headless UI** - Composants accessibles
- **Heroicons** - Icônes SVG
- **React Hot Toast** - Notifications
- **Framer Motion** - Animations

### Développement et tests
- **ESLint** - Linting du code
- **Prettier** - Formatage du code
- **Jest** - Framework de tests
- **Playwright** - Tests end-to-end

## 📁 Structure du projet

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── leads/             # Pages des leads
│   │   ├── page.tsx       # Liste des leads
│   │   ├── new/page.tsx   # Création d'un lead
│   │   ├── [id]/page.tsx  # Détail d'un lead
│   │   └── layout.tsx     # Layout des leads
│   ├── layout.tsx         # Layout principal
│   └── page.tsx          # Page d'accueil
├── components/
│   ├── leads/            # Composants spécifiques aux leads
│   │   ├── LeadsTable.tsx
│   │   └── LeadsFilters.tsx
│   ├── ui/               # Composants UI réutilisables
│   │   ├── button.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   ├── pagination.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── empty-state.tsx
│   └── providers.tsx     # Providers React Query et Toaster
├── hooks/
│   └── useLeads.ts       # Hooks React Query pour les leads
├── lib/
│   ├── api.ts           # Configuration API et services
│   └── utils.ts         # Utilitaires
└── types/
    └── lead.ts          # Types TypeScript
```

## 🎨 Design System

### Couleurs
- **Brand** : Palette bleue pour les éléments de marque
- **Sémantiques** : Success (vert), Warning (jaune), Error (rouge)
- **Pipeline** : Couleurs spécifiques pour chaque étape

### Composants
- **Design cohérent** avec variants et tailles standardisées
- **Accessibilité** intégrée (focus, keyboard navigation)
- **Responsive** mobile-first
- **Loading states** et gestion d'erreurs

## 🚀 Démarrage

### Prérequis
- Node.js 18+
- npm 8+

### Installation et démarrage
```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Build de production
npm run build
npm start
```

### Scripts disponibles
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linting
npm run lint:fix     # Correction automatique du linting
npm run type-check   # Vérification des types
npm run test         # Tests unitaires
npm run test:e2e     # Tests end-to-end
npm run format       # Formatage du code
```

## 🔌 API Integration

### Configuration
- **Base URL** : `http://localhost:5000` (configurable via env)
- **Authentication** : JWT Bearer token (à implémenter)
- **Tenant Context** : Headers `X-Org-Id` automatiques

### Services API
- **Leads** : CRUD complet avec pagination, tri, filtres
- **Stages** : Récupération des étapes du pipeline
- **Stats** : Statistiques en temps réel

### Gestion d'erreurs
- **Retry automatique** pour les requêtes échouées
- **Toast notifications** pour les succès/erreurs
- **Fallback UI** pour les états d'erreur

## 📱 Responsive Design

### Breakpoints Tailwind
- **Mobile** : < 640px
- **Tablet** : 640px - 1024px
- **Desktop** : > 1024px

### Adaptations
- **Navigation** : Menu hamburger sur mobile
- **Tableaux** : Scroll horizontal avec colonnes prioritaires
- **Formulaires** : Colonnes adaptatives
- **Modales** : Plein écran sur mobile

## 🧪 Tests (À implémenter)

### Tests unitaires
- Composants React avec Testing Library
- Hooks personnalisés
- Utilitaires et helpers

### Tests d'intégration
- Flux utilisateur complets
- Intégration API
- Gestion d'états

### Tests E2E
- Scénarios utilisateur critiques
- Tests cross-browser
- Tests de performance

## 🔮 Prochaines étapes

### Issue #8 - Recherche & Filtres avancés
- Recherche full-text
- Filtres combinables
- Sauvegarde des filtres dans l'URL
- Auto-complétion

### Fonctionnalités additionnelles
- **Authentication** : Login/logout, gestion des sessions
- **Édition inline** : Modification rapide des champs
- **Drag & Drop** : Réorganisation des leads
- **Export/Import** : CSV, Excel
- **Notifications temps réel** : WebSocket
- **Dark mode** : Thème sombre
- **Offline support** : PWA

## 📊 Performance

### Optimisations implémentées
- **Code splitting** automatique avec Next.js
- **Image optimization** avec Next.js Image
- **Lazy loading** des composants lourds
- **Memoization** avec React.memo et useMemo
- **Query caching** avec React Query

### Métriques cibles
- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1
- **Time to Interactive** : < 3s

---

*Développé avec ❤️ pour Lead Tracker*
