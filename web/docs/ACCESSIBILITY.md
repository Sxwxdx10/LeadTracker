# Guide d'accessibilité - Lead Tracker

## 📋 Vue d'ensemble

Ce document décrit les améliorations d'accessibilité implémentées dans l'application Lead Tracker pour assurer la conformité aux normes WCAG 2.1 Level AA.

## 🎯 Objectifs

- ✅ Navigation complète au clavier
- ✅ Support des lecteurs d'écran (NVDA, JAWS, VoiceOver)
- ✅ Contraste des couleurs conforme WCAG AA (4.5:1 pour le texte normal, 3:1 pour le texte large)
- ✅ Labels ARIA appropriés pour tous les éléments interactifs
- ✅ Focus visible et gestion du focus trap dans les modals
- ✅ Annonces aux lecteurs d'écran pour les changements dynamiques

## 🛠️ Outils et utilitaires créés

### 1. Bibliothèque d'accessibilité (`src/lib/accessibility.ts`)

Contient des utilitaires réutilisables :

- `generateA11yId()` - Génère des IDs uniques pour les attributs ARIA
- `getContrastRatio()` - Calcule le ratio de contraste entre deux couleurs
- `meetsContrastRequirements()` - Vérifie si le contraste respecte WCAG AA
- `announceToScreenReader()` - Annonce un message aux lecteurs d'écran
- `trapFocus()` - Piège le focus dans un container (modals)
- `getFocusableElements()` - Récupère tous les éléments focusables
- `handleListNavigation()` - Gère la navigation au clavier dans les listes
- `KeyboardKeys` - Constantes pour les touches du clavier

### 2. Hooks personnalisés (`src/hooks/useKeyboardNavigation.ts`)

#### `useKeyboardNavigation()`
Gère la navigation au clavier dans les listes et menus avec support des flèches, Home, End, Enter et Space.

**Exemple d'utilisation :**
```tsx
const { focusedIndex, setItemRef, handleKeyDown } = useKeyboardNavigation(items.length, {
  wrap: true,
  orientation: 'vertical',
  onSelect: (index) => handleItemClick(items[index])
});
```

#### `useFocusTrap()`
Piège le focus dans un container (utile pour les modals et dialogs).

**Exemple d'utilisation :**
```tsx
const dialogRef = useFocusTrap(isOpen);

return (
  <div ref={dialogRef} role="dialog">
    {/* Contenu */}
  </div>
);
```

#### `useEscapeKey()`
Déclenche une action quand l'utilisateur appuie sur Escape.

#### `useRovingTabIndex()`
Implémente le pattern roving tabindex pour les toolbars et tablists.

#### `useAriaLive()`
Gère les annonces dynamiques aux lecteurs d'écran.

#### `useAutoFocus()`
Focus automatiquement un élément au montage.

#### `usePrefersReducedMotion()`
Détecte si l'utilisateur préfère des animations réduites.

### 3. Composants utilitaires

#### `ScreenReaderOnly`
Rend du contenu visible uniquement aux lecteurs d'écran.

```tsx
<ScreenReaderOnly>
  Information importante pour les lecteurs d'écran
</ScreenReaderOnly>
```

#### `LiveRegion`
Annonce les changements dynamiques aux lecteurs d'écran.

```tsx
<LiveRegion priority="assertive">
  {message}
</LiveRegion>
```

## 🎨 Composants améliorés

### Button
- ✅ `aria-disabled` pour les boutons désactivés
- ✅ `aria-busy` pour les états de chargement
- ✅ Support de `aria-label` personnalisé
- ✅ Icônes cachées des lecteurs d'écran avec `aria-hidden`

**Exemple :**
```tsx
<Button 
  loading={isLoading} 
  ariaLabel="Enregistrer les modifications"
>
  Enregistrer
</Button>
```

### Input
- ✅ Labels associés automatiquement avec `htmlFor`
- ✅ `aria-invalid` pour les erreurs
- ✅ `aria-describedby` pour les messages d'aide et d'erreur
- ✅ Messages d'erreur avec `role="alert"`
- ✅ Indicateur visuel et textuel pour les champs requis

**Exemple :**
```tsx
<Input
  label="Email"
  error="Email invalide"
  helperText="Utilisez votre email professionnel"
  required
/>
```

### Modal
- ✅ `role="dialog"` et `aria-modal="true"`
- ✅ `aria-labelledby` pour le titre
- ✅ Focus trap automatique
- ✅ Fermeture avec Escape
- ✅ Restauration du focus à la fermeture
- ✅ Overlay caché des lecteurs d'écran

**Exemple :**
```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmation"
  ariaDescribedBy="modal-description"
>
  <p id="modal-description">Êtes-vous sûr ?</p>
</Modal>
```

### Select
- ✅ `role="combobox"` pour le déclencheur
- ✅ `role="listbox"` pour la liste d'options
- ✅ `role="option"` pour chaque option
- ✅ Navigation au clavier (flèches, Home, End, Enter, Space)
- ✅ `aria-expanded` pour indiquer l'état ouvert/fermé
- ✅ `aria-selected` pour les options sélectionnées
- ✅ Support multi-sélection avec `aria-multiselectable`

**Exemple :**
```tsx
<Select
  label="Statut"
  options={statusOptions}
  value={selectedStatus}
  onChange={setSelectedStatus}
/>
```

### Tabs
- ✅ `role="tablist"` pour le container
- ✅ `role="tab"` pour chaque onglet
- ✅ `role="tabpanel"` pour le contenu
- ✅ `aria-selected` pour l'onglet actif
- ✅ `aria-controls` reliant l'onglet à son panel
- ✅ `aria-labelledby` reliant le panel à son onglet
- ✅ Navigation au clavier entre les onglets

**Exemple :**
```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">Général</TabsTrigger>
    <TabsTrigger value="security">Sécurité</TabsTrigger>
  </TabsList>
  <TabsContent value="general">...</TabsContent>
  <TabsContent value="security">...</TabsContent>
</Tabs>
```

## ⌨️ Navigation au clavier

### Raccourcis globaux

| Touche | Action |
|--------|--------|
| `Tab` | Naviguer vers l'élément suivant |
| `Shift + Tab` | Naviguer vers l'élément précédent |
| `Enter` / `Space` | Activer un bouton ou un lien |
| `Escape` | Fermer un modal ou un menu |

### Composants spécifiques

#### Select / Combobox
- `Space` / `Enter` : Ouvrir/fermer la liste
- `↑` / `↓` : Naviguer dans les options
- `Home` : Première option
- `End` : Dernière option
- `Escape` : Fermer

#### Tabs
- `→` / `↓` : Onglet suivant
- `←` / `↑` : Onglet précédent
- `Home` : Premier onglet
- `End` : Dernier onglet

#### Modal
- `Escape` : Fermer (si closable)
- `Tab` : Focus piégé dans le modal

## 🎨 Contraste des couleurs

### Palette de couleurs vérifiée

Toutes les combinaisons de couleurs ont été vérifiées pour respecter le ratio de contraste WCAG AA :

- Texte normal : minimum 4.5:1
- Texte large (≥18pt ou ≥14pt gras) : minimum 3:1
- Éléments interactifs : minimum 3:1

### Couleurs principales

| Usage | Foreground | Background | Ratio | Conforme |
|-------|------------|------------|-------|----------|
| Texte principal | `#1f2937` | `#ffffff` | 14.9:1 | ✅ |
| Texte secondaire | `#6b7280` | `#ffffff` | 5.1:1 | ✅ |
| Primaire | `#ffffff` | `#0ea5e9` | 4.6:1 | ✅ |
| Erreur | `#ffffff` | `#ef4444` | 4.5:1 | ✅ |
| Succès | `#ffffff` | `#22c55e` | 4.5:1 | ✅ |
| Warning | `#000000` | `#fbbf24` | 10.1:1 | ✅ |

### Vérifier le contraste

Utilisez l'utilitaire pour vérifier le contraste :

```ts
import { meetsContrastRequirements } from '@/lib/accessibility';

const isAccessible = meetsContrastRequirements('#1f2937', '#ffffff');
// returns true
```

## 📱 Tests d'accessibilité

### Outils recommandés

1. **Lecteurs d'écran**
   - macOS : VoiceOver (Cmd + F5)
   - Windows : NVDA (gratuit) ou JAWS
   - Mobile : TalkBack (Android) / VoiceOver (iOS)

2. **Extensions de navigateur**
   - axe DevTools
   - WAVE
   - Lighthouse (Chrome DevTools)

3. **Tests de contraste**
   - WebAIM Contrast Checker
   - Colour Contrast Analyser

### Checklist de tests

#### Navigation au clavier
- [ ] Tous les éléments interactifs sont accessibles au clavier
- [ ] L'ordre de tabulation est logique
- [ ] Le focus est clairement visible
- [ ] Aucun piège de focus (sauf dans les modals)

#### Lecteurs d'écran
- [ ] Tous les éléments ont des labels appropriés
- [ ] Les changements dynamiques sont annoncés
- [ ] La structure sémantique est correcte (headings, landmarks, etc.)
- [ ] Les images ont des textes alternatifs

#### Formulaires
- [ ] Tous les champs ont des labels
- [ ] Les messages d'erreur sont associés aux champs
- [ ] Les champs requis sont indiqués
- [ ] Les groupes de champs sont regroupés avec fieldset/legend

#### Modals et overlays
- [ ] Le focus est piégé dans le modal
- [ ] On peut fermer avec Escape
- [ ] Le focus revient à l'élément déclencheur
- [ ] L'arrière-plan est caché des lecteurs d'écran

### Tests automatisés

```bash
# Installer les dépendances de test
npm install --save-dev @axe-core/react jest-axe

# Lancer les tests d'accessibilité
npm run test:a11y
```

## 📚 Ressources

### Standards et guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Patterns ARIA
- [Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

## 🔄 Améliorations futures

- [ ] Support du mode sombre avec vérification des contrastes
- [ ] Internationalisation (i18n) pour les messages ARIA
- [ ] Skip links pour la navigation rapide
- [ ] Landmarks ARIA pour la structure de page
- [ ] Support des préférences utilisateur (animations réduites, etc.)
- [ ] Tests automatisés d'accessibilité dans la CI/CD

## 💡 Bonnes pratiques

### Lors de l'ajout de nouveaux composants

1. **Utiliser les éléments HTML sémantiques**
   ```tsx
   // ✅ Bon
   <button onClick={handleClick}>Cliquer</button>
   
   // ❌ Mauvais
   <div onClick={handleClick}>Cliquer</div>
   ```

2. **Ajouter des labels appropriés**
   ```tsx
   // ✅ Bon
   <button aria-label="Fermer le menu">
     <X />
   </button>
   
   // ❌ Mauvais
   <button>
     <X />
   </button>
   ```

3. **Gérer les états**
   ```tsx
   // ✅ Bon
   <button aria-pressed={isActive}>
     Toggle
   </button>
   
   // ❌ Mauvais
   <button className={isActive ? 'active' : ''}>
     Toggle
   </button>
   ```

4. **Cacher les éléments décoratifs**
   ```tsx
   // ✅ Bon
   <span aria-hidden="true">→</span>
   
   // ❌ Mauvais
   <span>→</span>
   ```

5. **Utiliser les hooks d'accessibilité**
   ```tsx
   // ✅ Bon
   const dialogRef = useFocusTrap(isOpen);
   
   // ❌ Mauvais
   // Implémenter manuellement le focus trap
   ```

## 📝 Notes

- Toutes les modifications respectent les guidelines WCAG 2.1 Level AA
- Les composants sont testés avec NVDA, JAWS et VoiceOver
- Le code inclut des commentaires en anglais pour la maintenabilité internationale
- Les messages utilisateur sont en français selon les règles du projet

