# Guide de démarrage rapide - Accessibilité

Temps estimé : 5 minutes

## 1. Utiliser les composants accessibles

Tous les composants UI ont été améliorés pour l'accessibilité. Utilisez-les comme d'habitude, mais avec quelques props supplémentaires :

```tsx
// Button accessible
<Button 
  loading={isLoading}
  ariaLabel="Enregistrer le document"
>
  Enregistrer
</Button>

// Input accessible avec validation
<Input
  label="Email"
  type="email"
  error={errors.email}
  helperText="Format: exemple@domaine.com"
  required
/>

// Modal accessible avec focus trap
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirmation"
>
  <p>Êtes-vous sûr de vouloir continuer ?</p>
</Modal>

// Select accessible avec navigation clavier
<Select
  label="Statut"
  options={statusOptions}
  value={status}
  onChange={setStatus}
/>
```

## 2. Navigation au clavier

Tous les composants supportent maintenant la navigation au clavier :

| Composant | Touches |
|-----------|---------|
| Tous | `Tab` / `Shift+Tab` pour naviguer |
| Boutons | `Enter` ou `Space` pour activer |
| Select | `↑↓` pour naviguer, `Enter` pour sélectionner |
| Tabs | `←→` pour changer d'onglet |
| Modal | `Escape` pour fermer |

## 3. Utiliser les hooks d'accessibilité

```tsx
import { 
  useKeyboardNavigation, 
  useFocusTrap,
  useEscapeKey 
} from '@/hooks/useKeyboardNavigation';

function MyComponent() {
  // Navigation au clavier dans une liste
  const { focusedIndex, setItemRef } = useKeyboardNavigation(items.length);
  
  // Piège de focus pour un modal
  const dialogRef = useFocusTrap(isOpen);
  
  // Fermer avec Escape
  useEscapeKey(() => setIsOpen(false));
  
  return (
    <div ref={dialogRef}>
      {/* Contenu */}
    </div>
  );
}
```

## 4. Cacher du contenu aux lecteurs d'écran

```tsx
import { ScreenReaderOnly, LiveRegion } from '@/components/ui/ScreenReaderOnly';

// Texte visible uniquement aux lecteurs d'écran
<ScreenReaderOnly>
  Instructions détaillées pour les utilisateurs de lecteurs d'écran
</ScreenReaderOnly>

// Annonce dynamique
<LiveRegion priority="assertive">
  {successMessage}
</LiveRegion>

// Cacher des icônes décoratives
<span aria-hidden="true">★</span>
```

## 5. Vérifier les contrastes

```typescript
import { logContrastResults } from '@/lib/contrast-checker';

// Dans la console du navigateur
logContrastResults();
```

## Checklist rapide

Avant de commiter du code, vérifiez :

### Pour chaque composant interactif
- [ ] Accessible au clavier
- [ ] Label ARIA approprié
- [ ] Focus visible
- [ ] Erreurs annoncées avec `role="alert"`

### Pour les formulaires
- [ ] Tous les champs ont un `label`
- [ ] Messages d'erreur liés avec `aria-describedby`
- [ ] Champs requis indiqués visuellement et avec ARIA

### Pour les modals/dialogs
- [ ] `role="dialog"` et `aria-modal="true"`
- [ ] Titre lié avec `aria-labelledby`
- [ ] Focus trap actif
- [ ] Fermeture avec `Escape`

### Pour les listes/menus
- [ ] Navigation avec flèches
- [ ] Rôles ARIA appropriés
- [ ] État sélectionné indiqué

## Tests rapides

### 1. Test au clavier (1 min)
```bash
1. Débranchez votre souris
2. Naviguez avec Tab
3. Activez avec Enter/Space
4. Vérifiez que tout fonctionne
```

### 2. Test de contraste (30 sec)
```bash
# Ouvrez la console
import { logContrastResults } from '@/lib/contrast-checker';
logContrastResults();
# Vérifiez qu'il n'y a pas d'erreurs
```

### 3. Test lecteur d'écran (2 min)
```bash
# macOS
Cmd + F5 (VoiceOver)

# Windows
Téléchargez NVDA (gratuit)

# Testez :
- Les labels sont lus
- Les erreurs sont annoncées
- La navigation est logique
```

## Patterns courants

### Formulaire accessible complet

```tsx
function ContactForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        helperText="Nous ne partagerons jamais votre email"
        required
      />
      
      <Button 
        type="submit"
        loading={isSubmitting}
        loadingText="Envoi en cours..."
      >
        Envoyer
      </Button>
    </form>
  );
}
```

### Liste avec navigation clavier

```tsx
function ItemList({ items }) {
  const { focusedIndex, setItemRef, handleKeyDown } = 
    useKeyboardNavigation(items.length, {
      onSelect: (index) => handleSelect(items[index])
    });

  return (
    <ul role="listbox">
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={setItemRef(index)}
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={index === focusedIndex ? 0 : -1}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### Modal accessible

```tsx
function ConfirmModal({ isOpen, onClose, onConfirm }) {
  const dialogRef = useFocusTrap(isOpen);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmer la suppression"
      ariaDescribedBy="confirm-description"
    >
      <p id="confirm-description">
        Cette action est irréversible. Êtes-vous sûr ?
      </p>
      
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Supprimer
        </Button>
      </div>
    </Modal>
  );
}
```

## Ressources

### Documentation complète
- [Guide complet d'accessibilité](./ACCESSIBILITY.md)
- [Changelog des modifications](../ACCESSIBILITY_CHANGELOG.md)

### Standards
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Patterns](https://www.w3.org/WAI/ARIA/apg/)

### Outils
- [axe DevTools](https://www.deque.com/axe/devtools/) - Extension navigateur
- [WAVE](https://wave.webaim.org/) - Évaluateur d'accessibilité
- [NVDA](https://www.nvaccess.org/) - Lecteur d'écran gratuit

## Besoin d'aide ?

### Questions fréquentes

**Q : Mon composant n'est pas accessible au clavier**
```typescript
// Assurez-vous qu'il a un tabIndex et des handlers
<div 
  tabIndex={0}
  role="button"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

**Q : Comment annoncer un message de succès ?**
```typescript
import { announceToScreenReader } from '@/lib/accessibility';

// Après une action réussie
announceToScreenReader('Document enregistré avec succès', 'polite');
```

**Q : Comment vérifier si mon contraste est bon ?**
```typescript
import { meetsContrastRequirements } from '@/lib/accessibility';

const isAccessible = meetsContrastRequirements('#1f2937', '#ffffff');
console.log(isAccessible); // true ou false
```

## Bonnes pratiques rapides

### À faire
- Utiliser des éléments HTML sémantiques (`<button>`, `<input>`, etc.)
- Ajouter des labels à tous les champs de formulaire
- Tester au clavier régulièrement
- Cacher les icônes décoratives avec `aria-hidden="true"`

### À éviter
- Utiliser `<div>` avec `onClick` au lieu de `<button>`
- Oublier les labels sur les formulaires
- Supprimer les outlines de focus
- Oublier de gérer le focus dans les modals

## Prochaine étape

Une fois à l'aise avec ces bases, consultez le [guide complet](./ACCESSIBILITY.md) pour :
- Implémenter des patterns avancés
- Comprendre les détails techniques
- Découvrir tous les hooks disponibles
- Apprendre les meilleures pratiques

---

**Rappel** : L'accessibilité n'est pas une fonctionnalité, c'est une exigence. Chaque utilisateur mérite une expérience de qualité.
