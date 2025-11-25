# Guide de démarrage rapide - Internationalisation (i18n)

Temps estimé : 5 minutes

## 1. Configuration initiale

```tsx
// app/layout.tsx
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function RootLayout({ children }) {
  return (
    <LanguageProvider defaultLanguage="fr">
      {children}
    </LanguageProvider>
  );
}
```

## 2. Utiliser dans un composant

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

## 3. Ajouter le sélecteur de langue

```tsx
import { LanguageSelector } from '@/components/LanguageSelector';

function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

## 4. Traductions avec paramètres

```tsx
// Avec paramètres
t('forms.validation.minLength', { min: 8 })
// → "Minimum 8 caractères requis"

// Avec pluralisation
tc('time.minutes_ago', count)
// → "il y a 1 minute" ou "il y a 5 minutes"
```

## 5. Ajouter de nouvelles traductions

**`locales/fr.json`**
```json
{
  "myFeature": {
    "title": "Mon titre"
  }
}
```

**`locales/en.json`**
```json
{
  "myFeature": {
    "title": "My title"
  }
}
```

**Utilisation**
```tsx
t('myFeature.title')
```

## Variantes du sélecteur

```tsx
// Dropdown (défaut)
<LanguageSelector />

// Inline (boutons côte à côte)
<LanguageSelector variant="inline" />

// Compact (petit bouton)
<LanguageSelectorCompact />

// Mobile
<LanguageSelectorMobile />
```

## Clés principales

```tsx
// Commun
t('common.save')          // Enregistrer / Save
t('common.cancel')        // Annuler / Cancel
t('common.delete')        // Supprimer / Delete

// Navigation
t('navigation.home')      // Accueil / Home
t('navigation.leads')     // Prospects / Leads

// Auth
t('auth.login')           // Connexion / Login
t('auth.email')           // Email
t('auth.password')        // Mot de passe / Password

// Validation
t('forms.validation.required')     // Ce champ est requis
t('forms.validation.invalidEmail') // Email invalide
```

## Prochaines étapes

Consultez la [documentation complète](./I18N.md) pour plus de détails et d'exemples.
