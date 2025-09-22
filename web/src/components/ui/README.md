# Guide des États de Chargement - Lead Tracker

Ce guide présente les améliorations apportées aux états de chargement dans l'application Lead Tracker, incluant les squelettes de chargement, les indicateurs de progression, et les boutons avec états de chargement.

## 🎯 Composants Disponibles

### 1. Squelettes de Chargement (`skeleton.tsx`)

Les squelettes de chargement offrent une expérience utilisateur fluide pendant le chargement des données.

#### Composants de base

```tsx
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

// Squelette simple
<Skeleton className="h-4 w-full" />

// Texte avec plusieurs lignes
<SkeletonText lines={3} />
```

#### Composants spécialisés

```tsx
import { 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonStats,
  SkeletonProfile,
  SkeletonList 
} from '@/components/ui/skeleton';

// Carte de chargement
<SkeletonCard />

// Tableau de chargement
<SkeletonTable rows={5} columns={4} />

// Statistiques de chargement
<SkeletonStats />

// Profil utilisateur
<SkeletonProfile />

// Liste avec avatars
<SkeletonList items={5} showAvatar />
```

### 2. Indicateurs de Progression (`progress.tsx`)

#### Barre de progression linéaire

```tsx
import { Progress } from '@/components/ui/progress';

<Progress 
  value={75} 
  showValue 
  variant="success"
  animated 
/>
```

#### Progression circulaire

```tsx
import { CircularProgress } from '@/components/ui/progress';

<CircularProgress 
  value={60} 
  showValue 
  size={80}
  variant="default" 
/>
```

#### Hook de progression

```tsx
import { useProgress } from '@/components/ui/progress';

const { progress, isLoading, startProgress, updateProgress, completeProgress } = useProgress();

const handleLongTask = async () => {
  startProgress();
  // Simulation d'une tâche avec progression
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 200));
    updateProgress(i);
  }
  completeProgress();
};
```

### 3. Boutons avec États de Chargement (`button.tsx`)

Le composant Button a été amélioré pour supporter les états de chargement.

```tsx
import { Button } from '@/components/ui/button';

<Button
  loading={isSubmitting}
  loadingText="Sauvegarde..."
  loadingSpinnerSize="sm"
  disabled={isSubmitting}
>
  Sauvegarder
</Button>
```

### 4. Overlays de Chargement (`loading-overlay.tsx`)

#### Overlay modal

```tsx
import { LoadingOverlay, useLoadingOverlay } from '@/components/ui/loading-overlay';

const overlay = useLoadingOverlay();

// Afficher l'overlay
overlay.show('Traitement en cours...', true); // true pour afficher la progression

// Mettre à jour la progression
overlay.updateProgress(50);

// Masquer l'overlay
overlay.hide();

// Composant
<LoadingOverlay
  isVisible={overlay.isVisible}
  message={overlay.message}
  progress={overlay.progress}
  showProgress={overlay.progress !== undefined}
/>
```

#### Chargement inline

```tsx
import { InlineLoading, LoadingCard } from '@/components/ui/loading-overlay';

// Chargement simple
<InlineLoading 
  isVisible={isLoading}
  message="Chargement..."
  size="md"
/>

// Carte de chargement
<LoadingCard 
  isVisible={isLoading}
  message="Synchronisation"
  description="Veuillez patienter..."
/>
```

### 5. Hooks Utilitaires (`useLoadingState.ts`)

#### Hook de base pour les états de chargement

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

const { isLoading, error, execute, reset } = useLoadingState({
  onSuccess: () => console.log('Succès !'),
  onError: (error) => console.error('Erreur:', error),
});

const handleSubmit = async () => {
  const result = await execute(async () => {
    // Votre logique asynchrone
    const response = await api.saveData(data);
    return response;
  });
  
  if (result) {
    // Traitement du succès
  }
};
```

#### Hook pour états de chargement multiples

```tsx
import { useButtonLoadingStates } from '@/hooks/useLoadingState';

const { isLoading, executeWithLoading } = useButtonLoadingStates();

const handleSave = () => executeWithLoading('save', saveData);
const handleDelete = () => executeWithLoading('delete', deleteData);

// Dans le JSX
<Button loading={isLoading('save')}>Sauvegarder</Button>
<Button loading={isLoading('delete')}>Supprimer</Button>
```

## 🔧 Exemples d'Implémentation

### Dans un composant de tableau

```tsx
import { SkeletonTable } from '@/components/ui/skeleton';
import { useLeads } from '@/hooks/useLeads';

function LeadsTable() {
  const { data, isLoading } = useLeads();
  
  if (isLoading) {
    return <SkeletonTable rows={5} columns={6} />;
  }
  
  return (
    // Votre tableau normal
  );
}
```

### Dans un formulaire

```tsx
import { Button } from '@/components/ui/button';
import { useLoadingState } from '@/hooks/useLoadingState';

function ContactForm() {
  const { isLoading, execute } = useLoadingState();
  
  const handleSubmit = async (data) => {
    await execute(() => api.saveContact(data));
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Vos champs */}
      <Button 
        type="submit"
        loading={isLoading}
        loadingText="Sauvegarde..."
      >
        Sauvegarder
      </Button>
    </form>
  );
}
```

### Pour une action avec progression

```tsx
import { useProgress } from '@/components/ui/progress';
import { Progress } from '@/components/ui/progress';

function FileUpload() {
  const { progress, isLoading, startProgress, updateProgress, completeProgress } = useProgress();
  
  const handleUpload = async (file) => {
    startProgress();
    
    // Simulation d'upload avec progression
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        updateProgress(percentComplete);
      }
    };
    
    xhr.onload = () => completeProgress();
    xhr.send(formData);
  };
  
  return (
    <div>
      {isLoading && (
        <Progress 
          value={progress} 
          showValue 
          animated 
          className="mb-4" 
        />
      )}
      {/* Votre interface d'upload */}
    </div>
  );
}
```

## 🎨 Personnalisation

### Variants des composants

Les composants supportent différents variants pour s'adapter à votre design :

```tsx
// Progress variants
<Progress variant="success" />
<Progress variant="warning" />
<Progress variant="error" />

// Button loading states
<Button variant="destructive" loading={isLoading} />
<Button variant="outline" loading={isLoading} />
```

### Classes CSS personnalisées

Tous les composants acceptent des classes CSS personnalisées :

```tsx
<Skeleton className="rounded-full" />
<Progress className="h-3" />
<LoadingOverlay className="backdrop-blur-sm" />
```

## 📱 Responsive Design

Les composants sont conçus pour être responsives :

```tsx
<SkeletonStats className="grid-cols-1 md:grid-cols-3" />
<SkeletonTable className="hidden md:block" />
```

## ♿ Accessibilité

Les composants incluent des attributs d'accessibilité appropriés :

- `aria-label` pour les spinners de chargement
- `role="progressbar"` pour les barres de progression
- Support de la navigation clavier
- Contrastes de couleurs conformes aux standards WCAG

## 🚀 Bonnes Pratiques

1. **Utilisez les squelettes** pour les chargements de données
2. **Désactivez les boutons** pendant les requêtes
3. **Affichez la progression** pour les tâches longues
4. **Fournissez des messages** informatifs
5. **Gérez les erreurs** gracieusement
6. **Testez l'accessibilité** avec les lecteurs d'écran

## 🔍 Débogage

Pour déboguer les états de chargement, vous pouvez utiliser :

```tsx
// Logs automatiques dans useLoadingState
const { isLoading, error } = useLoadingState({
  onSuccess: () => console.log('✅ Opération réussie'),
  onError: (error) => console.error('❌ Erreur:', error),
});

// État des boutons multiples
const { loadingStates } = useButtonLoadingStates();
console.log('États de chargement:', loadingStates);
```
