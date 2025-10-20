# Tests Unitaires - LeadTracker Web

## 📋 Vue d'ensemble

Cette suite de tests unitaires couvre les composants UI, hooks personnalisés, services API et contextes de l'application LeadTracker.

## 🏗️ Infrastructure de tests

### Outils utilisés

- **Jest**: Framework de tests
- **React Testing Library**: Pour tester les composants React
- **@testing-library/user-event**: Pour simuler les interactions utilisateur
- **Axios mocking**: Pour mocker les appels API

### Structure des tests

```
src/__tests__/
├── components/
│   └── ui/           # Tests des composants UI (Button, Input, Modal, etc.)
├── contexts/         # Tests des contextes React (AuthContext, etc.)
├── hooks/            # Tests des hooks personnalisés (useModal, useLoadingState, etc.)
├── lib/              # Tests des services (api.ts, auth.ts, etc.)
├── mocks/            # Données mockées pour les tests
└── utils/            # Utilitaires de test (test-utils.tsx)
```

## 🚀 Commandes disponibles

### Exécuter tous les tests
```bash
npm test
```

### Exécuter les tests avec couverture
```bash
npm test -- --coverage
```

### Exécuter les tests en mode watch
```bash
npm test:watch
```

### Exécuter les tests en mode CI
```bash
npm test:ci
```

## 📊 Résultats actuels

- **Total de tests**: 116
- **Tests qui passent**: 110
- **Tests ignorés**: 3 (AuthContext error handling - nécessitent refactoring)
- **Tests en échec**: 3 (en développement)

### Couverture de code

#### Composants UI testés
- ✅ **Button**: 100% de couverture
- ✅ **Input**: 100% de couverture
- ✅ **Modal**: 100% de couverture

#### Hooks testés
- ✅ **useModal**: 77% de couverture
- ✅ **useLoadingState**: 100% de couverture
- ✅ **useButtonLoadingStates**: 100% de couverture
- ✅ **useLoadingWithTimeout**: 100% de couverture

#### Services API testés
- ✅ **leadsApi**: 54% de couverture
  - getLeads ✅
  - getLead ✅
  - createLead ✅
  - updateLead ✅
  - deleteLead ✅
  - getLeadStats ✅

- ✅ **stagesApi**: Couvert
  - getStages ✅
  - getStage ✅

- ✅ **authApi**: 79% de couverture
  - login ✅
  - register ✅
  - refreshToken ✅
  - requestPasswordReset ✅
  - confirmPasswordReset ✅
  - logout ✅

- ✅ **tokenUtils**: 100% de couverture
  - saveTokens ✅
  - getAccessToken ✅
  - getRefreshToken ✅
  - getUser ✅
  - getOrganization ✅
  - isTokenExpired ✅
  - clearTokens ✅

#### Contextes testés
- ✅ **AuthContext**: 53% de couverture
  - useAuth hook ✅
  - Initial state ✅
  - login ✅
  - register ✅
  - logout ✅
  - Session restoration ✅

## 🔧 Configuration

### jest.config.js

Le fichier de configuration Jest est configuré pour :
- Utiliser jsdom comme environnement de test
- Mapper les alias TypeScript (`@/`)
- Ignorer les fichiers de mocks et utilitaires
- Générer des rapports de couverture
- Seuils de couverture : 70% (branches, functions, lines, statements)

### jest.setup.js

Le fichier de setup configure :
- Mocks pour Next.js (router, navigation)
- Mocks pour next-auth
- Mocks pour window.matchMedia
- Mocks pour IntersectionObserver et ResizeObserver

## 📝 Écrire de nouveaux tests

### Exemple de test de composant

```typescript
import { render, screen } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<MyComponent onClick={handleClick} />)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Exemple de test de hook

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(null)
  })

  it('should update state', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.setValue('new value')
    })
    
    expect(result.current.value).toBe('new value')
  })
})
```

### Exemple de test d'API

```typescript
import axios from 'axios'
import { myApi } from '@/lib/myApi'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('myApi', () => {
  it('should fetch data', async () => {
    const mockData = { id: 1, name: 'Test' }
    mockedAxios.get.mockResolvedValue({ data: mockData })
    
    const result = await myApi.getData()
    
    expect(result).toEqual(mockData)
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/data')
  })
})
```

## 🐛 Problèmes connus

### Tests ignorés (skipped)

1. **AuthContext error handling**: 3 tests sont ignorés car le mode démo interfère avec la gestion des erreurs. Ces tests nécessitent un refactoring pour désactiver correctement le mode démo.

### À améliorer

- Augmenter la couverture globale (actuellement ~8%)
- Ajouter des tests pour les composants Kanban
- Ajouter des tests pour les composants de formulaire
- Tester les hooks useKanban, useLeads, useTasks
- Ajouter des tests E2E avec Playwright

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contribution

Lors de l'ajout de nouveaux tests :
1. Suivre la structure de dossiers existante
2. Utiliser les utilitaires de test (`test-utils.tsx`)
3. Mocker les dépendances externes
4. Viser une couverture de 80%+ pour le nouveau code
5. Documenter les cas limites (edge cases)

