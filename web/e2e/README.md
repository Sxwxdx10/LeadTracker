# Tests E2E - LeadTracker Web

## 📋 Vue d'ensemble

Cette suite de tests End-to-End (E2E) utilise **Playwright** pour tester l'application LeadTracker dans un environnement proche de la production. Les tests simulent les interactions réelles des utilisateurs et vérifient que l'application fonctionne correctement de bout en bout.

## 🏗️ Structure des tests

```
e2e/
├── auth/                    # Tests d'authentification
│   ├── login.spec.ts       # Tests de connexion
│   └── register.spec.ts    # Tests d'inscription
├── leads/                   # Tests de gestion des leads
│   └── leads-crud.spec.ts  # Tests CRUD complets
├── kanban/                  # Tests du tableau Kanban
│   └── kanban.spec.ts      # Tests drag & drop, real-time
├── regression/              # Tests de régression
│   └── critical-flows.spec.ts  # Parcours critiques
├── performance/             # Tests de performance
│   └── performance.spec.ts # Core Web Vitals, load times
├── fixtures/                # Données de test
│   └── test-data.ts        # Users, leads, tasks mockées
└── utils/                   # Fonctions utilitaires
    ├── auth-helpers.ts     # Helpers pour l'authentification
    ├── lead-helpers.ts     # Helpers pour les leads
    └── common-helpers.ts   # Helpers communs
```

## 🚀 Installation et configuration

### Prérequis

- Node.js >= 18
- npm >= 8
- Application web en cours d'exécution sur `http://localhost:3000`

### Installation

Playwright est déjà installé dans le projet. Pour installer les navigateurs :

```bash
npx playwright install
```

### Configuration

La configuration se trouve dans `playwright.config.ts`. Points clés :

- **baseURL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Tests parallèles**: Activés par défaut
- **Retry**: 2 fois sur CI, 0 en local
- **Navigateurs**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Traces**: Capturées lors des échecs
- **Screenshots/Vidéos**: Sur échec uniquement

## 🎯 Exécution des tests

### Tous les tests

```bash
npm run test:e2e
```

### Tests spécifiques

```bash
# Tests d'authentification uniquement
npx playwright test e2e/auth

# Tests de leads uniquement
npx playwright test e2e/leads

# Tests Kanban uniquement
npx playwright test e2e/kanban

# Tests de régression uniquement
npx playwright test e2e/regression

# Tests de performance uniquement
npx playwright test e2e/performance

# Un fichier spécifique
npx playwright test e2e/auth/login.spec.ts
```

### Mode UI interactif

```bash
npm run test:e2e:ui
```

### Navigateur spécifique

```bash
# Chrome uniquement
npx playwright test --project=chromium

# Firefox uniquement
npx playwright test --project=firefox

# Safari uniquement
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

### Mode debug

```bash
npx playwright test --debug
```

### Mode headed (voir le navigateur)

```bash
npx playwright test --headed
```

## 📊 Rapports

### Rapport HTML

Après l'exécution des tests, ouvrez le rapport :

```bash
npx playwright show-report
```

### Traces

Pour voir les traces d'un test échoué :

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## 🧪 Types de tests

### 1. Tests d'authentification (`auth/`)

**login.spec.ts** - 15+ tests
- Affichage du formulaire de connexion
- Connexion réussie avec identifiants valides
- Erreurs avec identifiants invalides
- Validation des champs vides
- Validation du format email
- Liens vers register/forgot password
- Toggle de visibilité du mot de passe
- Persistence de session
- Logout

**register.spec.ts** - 12+ tests
- Affichage du formulaire d'inscription
- Inscription réussie
- Validation des champs
- Force du mot de passe
- Email déjà existant
- Auto-génération du domaine d'organisation
- Sécurité (pas de password en URL)

### 2. Tests de leads (`leads/`)

**leads-crud.spec.ts** - 25+ tests
- **Create**: Création avec tous les champs, champs minimaux, validation
- **Read**: Affichage en liste, détails, recherche
- **Update**: Modification, annulation
- **Delete**: Suppression, confirmation
- Filtrage par statut, source, assignation
- Tri par colonnes
- Pagination

### 3. Tests Kanban (`kanban/`)

**kanban.spec.ts** - 15+ tests
- Affichage du tableau
- Colonnes de stages
- Drag & drop entre colonnes
- Filtrage et recherche
- Métriques
- Mises à jour en temps réel (SignalR)
- Accessibilité clavier

### 4. Tests de régression (`regression/`)

**critical-flows.spec.ts** - 10+ tests
- Parcours utilisateur complet (Register → Login → CRUD → Logout)
- Navigation entre toutes les pages
- Persistence des données
- Gestion de session
- Gestion d'erreurs réseau
- Validation des formulaires
- Consistance de l'UI
- Responsiveness mobile

### 5. Tests de performance (`performance/`)

**performance.spec.ts** - 15+ tests
- **Load Times**: Login < 2s, Leads < 3s, Kanban < 3s
- **API Response**: < 1s pour les leads, < 500ms pour la recherche
- **Rendering**: 100 lignes sans lag
- **Memory**: Pas de fuites mémoire
- **Bundle Size**: JS < 500KB
- **Network**: Test avec connexion 3G
- **Core Web Vitals**: LCP < 2.5s, CLS < 0.1

## 🛠️ Utilitaires disponibles

### Auth Helpers

```typescript
import { login, logout, register, expectLoginPage } from './utils/auth-helpers';

// Login
await login(page, email, password);

// Login as admin
await loginAsAdmin(page);

// Register
await register(page, userData);

// Logout
await logout(page);

// Verify on login page
await expectLoginPage(page);
```

### Lead Helpers

```typescript
import { 
  createLead, 
  editLead, 
  deleteLead, 
  searchLead,
  verifyLeadExists 
} from './utils/lead-helpers';

// Create lead
await createLead(page, leadData);

// Edit lead
await editLead(page, leadName, updates);

// Delete lead
await deleteLead(page, leadName);

// Search
await searchLead(page, searchTerm);

// Verify
await verifyLeadExists(page, leadName);
```

### Common Helpers

```typescript
import { 
  waitForPageLoad, 
  expectToastMessage, 
  fillForm,
  retryAction 
} from './utils/common-helpers';

// Wait for page load
await waitForPageLoad(page);

// Check for toast
await expectToastMessage(page, 'Success!');

// Fill form
await fillForm(page, { firstName: 'John', lastName: 'Doe' });

// Retry action
await retryAction(() => page.click('button'), 3, 1000);
```

## 📋 Données de test

Les données de test sont centralisées dans `fixtures/test-data.ts` :

```typescript
import { testUsers, testLeads, testTasks } from './fixtures/test-data';

// Users
testUsers.admin
testUsers.user
testUsers.newUser

// Leads
testLeads.valid
testLeads.minimal
testLeads.complete

// Tasks
testTasks.valid
testTasks.urgent
```

## ✅ Bonnes pratiques

### 1. Isolation des tests
Chaque test doit être indépendant et ne pas dépendre d'autres tests.

```typescript
test.beforeEach(async ({ page }) => {
  await login(page);
  // Setup clean state
});
```

### 2. Utiliser des selecteurs stables
Préférer les attributs `data-testid` aux classes CSS :

```typescript
// ✅ Bon
await page.click('[data-testid="submit-button"]');

// ❌ Éviter
await page.click('.btn.btn-primary.mt-4');
```

### 3. Attendre le chargement
Toujours attendre que la page soit prête :

```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="content"]');
```

### 4. Gérer les timeouts
Augmenter les timeouts pour les opérations longues :

```typescript
await expect(page.locator('.result')).toBeVisible({ timeout: 10000 });
```

### 5. Cleanup
Nettoyer les données de test après exécution si nécessaire.

## 🐛 Debugging

### Voir le navigateur pendant les tests

```bash
npx playwright test --headed --project=chromium
```

### Mode debug pas à pas

```bash
npx playwright test --debug e2e/auth/login.spec.ts
```

### Capturer des screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

### Console logs

```typescript
page.on('console', msg => console.log(msg.text()));
```

### Pause l'exécution

```typescript
await page.pause();
```

## 🔧 CI/CD Integration

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### GitLab CI

```yaml
e2e-tests:
  stage: test
  script:
    - npm ci
    - npx playwright install --with-deps
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
```

## 📈 Métriques de couverture

- **Authentification**: 15+ scénarios
- **Leads CRUD**: 25+ scénarios
- **Kanban**: 15+ scénarios
- **Régression**: 10+ parcours critiques
- **Performance**: 15+ métriques
- **Total**: 80+ tests E2E

## 🚧 Tests à ajouter

- [ ] Tests pour les tâches (tasks)
- [ ] Tests pour les rapports/analytics
- [ ] Tests pour les paramètres utilisateur
- [ ] Tests pour l'export/import de données
- [ ] Tests pour les notifications en temps réel
- [ ] Tests d'accessibilité (a11y)
- [ ] Tests de sécurité (XSS, CSRF)

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)

## 🤝 Contribution

Lors de l'ajout de nouveaux tests :

1. Suivre la structure de dossiers existante
2. Utiliser les helpers et fixtures
3. Documenter les nouveaux scénarios
4. Vérifier que les tests passent en local
5. S'assurer de l'isolation des tests
6. Ajouter des commentaires pour les cas complexes

---

**Note**: Ces tests E2E nécessitent que l'application soit en cours d'exécution. Pour les tests unitaires, voir `src/__tests__/README.md`.

