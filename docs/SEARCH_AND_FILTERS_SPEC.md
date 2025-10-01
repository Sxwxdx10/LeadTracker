# 🔍 Spécifications techniques - Interface de recherche et filtres

## 📋 Vue d'ensemble

Ce document détaille les spécifications techniques pour l'implémentation de l'interface de recherche et filtres avancés dans le frontend Lead Tracker. Le backend est déjà terminé et fournit tous les endpoints nécessaires.

## ✅ Backend terminé

### Endpoints API disponibles
- `POST /api/leads/search` - Recherche avancée avec filtres
- `POST /api/leads/autocomplete` - Suggestions en temps réel
- `POST /api/leads/filter-options` - Options de filtres disponibles
- `POST /api/leads/filters` - Sauvegarder un filtre personnalisé
- `GET /api/leads/filters` - Lister les filtres sauvegardés
- `POST /api/leads/filters/{id}/use` - Utiliser un filtre sauvegardé
- `DELETE /api/leads/filters/{id}` - Supprimer un filtre sauvegardé

### Fonctionnalités backend
- ✅ Recherche full-text optimisée (< 200ms)
- ✅ Filtres combinables (étape, propriétaire, statut, source, dates)
- ✅ Auto-complétion pour tous les champs
- ✅ Sauvegarde des filtres personnalisés
- ✅ Index de base de données optimisés
- ✅ Pagination efficace

## 🎯 Composants frontend à implémenter

### 1. SearchBar.tsx
**Fichier** : `web/src/components/leads/SearchBar.tsx`

#### Fonctionnalités
- Barre de recherche avec debounce (300ms)
- Auto-complétion en temps réel
- Icône de recherche et bouton clear
- Indicateur de chargement
- Suggestions avec highlight des termes recherchés

#### Props
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
```

#### État
```typescript
interface SearchState {
  query: string;
  suggestions: AutocompleteSuggestion[];
  isLoading: boolean;
  showSuggestions: boolean;
}
```

### 2. AdvancedFilters.tsx
**Fichier** : `web/src/components/leads/AdvancedFilters.tsx`

#### Fonctionnalités
- Panneau de filtres collapsible
- Filtres par étape (multi-select avec couleurs)
- Filtres par propriétaire (multi-select avec avatars)
- Filtres par statut (checkboxes)
- Filtres par source (multi-select)
- Filtres par dates (date picker range)
- Boutons : Appliquer, Réinitialiser, Sauvegarder

#### Props
```typescript
interface AdvancedFiltersProps {
  filters: LeadSearchRequest;
  onFiltersChange: (filters: LeadSearchRequest) => void;
  onApply: () => void;
  onReset: () => void;
  onSave: (name: string, description?: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}
```

### 3. FilterChips.tsx
**Fichier** : `web/src/components/leads/FilterChips.tsx`

#### Fonctionnalités
- Affichage des filtres actifs sous forme de chips
- Bouton de suppression individuel pour chaque filtre
- Bouton "Tout effacer"
- Compteur du nombre de filtres actifs
- Couleurs différentes par type de filtre

#### Props
```typescript
interface FilterChipsProps {
  filters: LeadSearchRequest;
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
}
```

### 4. SavedFilters.tsx
**Fichier** : `web/src/components/leads/SavedFilters.tsx`

#### Fonctionnalités
- Liste des filtres sauvegardés
- Bouton pour appliquer un filtre
- Bouton pour supprimer un filtre
- Indicateur de filtres partagés
- Compteur d'utilisation

#### Props
```typescript
interface SavedFiltersProps {
  filters: SavedSearchFilter[];
  onApplyFilter: (filter: SavedSearchFilter) => void;
  onDeleteFilter: (filterId: string) => void;
  onSaveCurrent: (name: string, description?: string) => void;
}
```

## 🪝 Hooks personnalisés

### 1. useSearch.ts
**Fichier** : `web/src/hooks/useSearch.ts`

#### Fonctionnalités
- Gestion de l'état de recherche
- Debounce automatique
- Auto-complétion
- Gestion des erreurs
- Cache des suggestions

```typescript
interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  suggestions: AutocompleteSuggestion[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}
```

### 2. useFilters.ts
**Fichier** : `web/src/hooks/useFilters.ts`

#### Fonctionnalités
- Gestion de l'état des filtres
- Synchronisation avec l'URL
- Validation des filtres
- Persistance locale
- Gestion des filtres sauvegardés

```typescript
interface UseFiltersReturn {
  filters: LeadSearchRequest;
  setFilters: (filters: LeadSearchRequest) => void;
  addFilter: (type: string, value: any) => void;
  removeFilter: (type: string, value?: any) => void;
  clearFilters: () => void;
  savedFilters: SavedSearchFilter[];
  saveFilter: (name: string, description?: string) => Promise<void>;
  deleteFilter: (filterId: string) => Promise<void>;
  applySavedFilter: (filter: SavedSearchFilter) => void;
}
```

### 3. useAutocomplete.ts
**Fichier** : `web/src/hooks/useAutocomplete.ts`

#### Fonctionnalités
- Auto-complétion pour différents types de champs
- Cache des résultats
- Gestion du debounce
- Gestion des erreurs

```typescript
interface UseAutocompleteReturn {
  suggestions: AutocompleteSuggestion[];
  isLoading: boolean;
  error: string | null;
  getSuggestions: (query: string, type: string) => Promise<void>;
  clearSuggestions: () => void;
}
```

## 📱 Interface utilisateur

### Layout de la page des leads
```
┌─────────────────────────────────────────────────────────┐
│ [🔍 Recherche...] [Filtres ▼] [Sauvegardés ▼] [Export] │
├─────────────────────────────────────────────────────────┤
│ [Filtre actif] [Autre filtre] [×] [Tout effacer]       │
├─────────────────────────────────────────────────────────┤
│ [Colonnes] [Tri] [Vue] [Actions]                        │
├─────────────────────────────────────────────────────────┤
│ [Tableau des leads avec pagination]                     │
└─────────────────────────────────────────────────────────┘
```

### Panneau de filtres
```
┌─────────────────────────────────────┐
│ Filtres avancés                [×]  │
├─────────────────────────────────────┤
│ Étape: [□ Qualifié] [□ Prospect]    │
│ Propriétaire: [John Doe] [Jane...]  │
│ Statut: [□ Ouvert] [□ Fermé]        │
│ Source: [Site web] [Référence]      │
│ Dates: [Du] [Au] [Dernière activité]│
│                                     │
│ [Appliquer] [Réinitialiser] [Sauvegarder] │
└─────────────────────────────────────┘
```

## 🔧 Intégration avec l'API

### Types TypeScript
```typescript
// Types pour la recherche
interface LeadSearchRequest {
  searchQuery?: string;
  stageIds?: string[];
  ownerIds?: string[];
  tags?: string[];
  createdFrom?: string;
  createdTo?: string;
  lastActivityFrom?: string;
  lastActivityTo?: string;
  statuses?: string[];
  sources?: string[];
  priorities?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page: number;
  pageSize: number;
  includeInactive?: boolean;
}

interface LeadSearchResponse {
  leads: LeadSearchResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  executionTimeMs: number;
  filterOptions?: SearchFilterOptions;
}

// Types pour l'auto-complétion
interface AutocompleteRequest {
  query: string;
  type: string;
  limit: number;
}

interface AutocompleteSuggestion {
  value: string;
  label: string;
  description?: string;
  category?: string;
  count: number;
}
```

### Services API
```typescript
// Service de recherche
class SearchService {
  static async searchLeads(request: LeadSearchRequest): Promise<LeadSearchResponse>
  static async getAutocompleteSuggestions(request: AutocompleteRequest): Promise<AutocompleteResponse>
  static async getFilterOptions(baseRequest?: LeadSearchRequest): Promise<SearchFilterOptions>
  static async saveFilter(request: SaveSearchFilterRequest): Promise<SavedSearchFilter>
  static async getSavedFilters(): Promise<SavedSearchFilter[]>
  static async updateFilterUsage(filterId: string): Promise<void>
  static async deleteSavedFilter(filterId: string): Promise<void>
}
```

## 🎨 Design et UX

### Couleurs et thème
- **Recherche** : Bleu primaire (#3B82F6)
- **Filtres actifs** : Vert (#10B981)
- **Suggestions** : Gris clair (#F3F4F6)
- **Erreurs** : Rouge (#EF4444)
- **Succès** : Vert (#10B981)

### Animations
- Fade in/out pour les suggestions
- Slide down pour le panneau de filtres
- Pulse pour les indicateurs de chargement
- Hover effects sur les chips de filtres

### Responsive
- Mobile : Filtres en modal fullscreen
- Tablet : Panneau de filtres collapsible
- Desktop : Panneau de filtres fixe

## 🧪 Tests à implémenter

### Tests unitaires
- Composants de recherche et filtres
- Hooks personnalisés
- Services API
- Utilitaires de validation

### Tests d'intégration
- Intégration avec l'API
- Gestion des états de chargement
- Gestion des erreurs
- Persistance des filtres

### Tests E2E
- Workflow complet de recherche
- Sauvegarde et application de filtres
- Auto-complétion
- Responsive design

## 📊 Métriques de performance

### Objectifs
- **Temps de réponse** : < 200ms pour la recherche
- **Auto-complétion** : < 100ms pour les suggestions
- **Rendu** : < 16ms pour 60fps
- **Bundle size** : < 50KB pour les composants de recherche

### Monitoring
- Temps de réponse des requêtes API
- Taux d'utilisation des filtres sauvegardés
- Performance de l'auto-complétion
- Erreurs de recherche

## 🚀 Plan d'implémentation

### Phase 1 : Composants de base
1. SearchBar avec auto-complétion
2. FilterChips pour les filtres actifs
3. Hooks useSearch et useAutocomplete

### Phase 2 : Filtres avancés
1. AdvancedFilters avec tous les types de filtres
2. Hook useFilters avec gestion d'état
3. Intégration avec l'URL

### Phase 3 : Filtres sauvegardés
1. SavedFilters pour la gestion des filtres
2. Persistance en base de données
3. Interface de sauvegarde

### Phase 4 : Optimisations
1. Performance et cache
2. Tests complets
3. Documentation utilisateur

## 📝 Notes techniques

### Dépendances
- React Query pour le cache et la synchronisation
- React Hook Form pour les formulaires
- Zod pour la validation
- Lucide React pour les icônes
- Tailwind CSS pour le styling

### Considérations
- Gestion des erreurs réseau
- Fallback pour les données manquantes
- Accessibilité (ARIA, navigation clavier)
- Internationalisation future
- Performance avec de gros datasets

---

**Status** : Backend terminé ✅ - Frontend à implémenter
**Priorité** : Haute
**Estimation** : 2-3 semaines de développement
