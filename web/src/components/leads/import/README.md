# 🚀 Multi-Source Lead Import Components

Composants UI React pour la création et l'import de leads depuis plusieurs sources.

## 📦 Composants

### 1. CreateLeadModal
Modal principal avec 4 onglets pour les différentes méthodes de création.

**Props:**
```typescript
interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Utilisation:**
```tsx
import { CreateLeadModal } from '@/components/leads/import';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Nouveau lead</Button>
      <CreateLeadModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          setIsOpen(false);
          // Rafraîchir la liste
        }}
      />
    </>
  );
}
```

### 2. ManualCreateForm
Formulaire de création manuelle d'un lead.

**Fonctionnalités:**
- Validation en temps réel
- Champs requis: prénom, nom, email
- Champs optionnels: téléphone, société, poste, valeur estimée, probabilité, source, notes
- Génération automatique du titre si non fourni

### 3. CsvImportForm
Import de leads depuis un fichier CSV.

**Fonctionnalités:**
- Drag & drop de fichier CSV
- Prévisualisation des données (premières lignes)
- Auto-détection du mapping de colonnes
- Validation des données avant import
- Affichage des statistiques (total, valides, erreurs)
- Gestion des doublons (skip automatique)

**Format CSV attendu:**
```csv
Email,Prénom,Nom,Société,Téléphone,Poste
jean.dupont@example.com,Jean,Dupont,Acme Corp,+33612345678,Directeur
```

### 4. GoogleSheetsImportForm
Import de leads depuis Google Sheets.

**Fonctionnalités:**
- Validation de l'URL Google Sheets
- Fetch automatique des données (feuille publique)
- Auto-détection du mapping de colonnes
- Prévisualisation avant import
- Statistiques et validation

**URL attendue:**
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

**Prérequis:**
- La feuille doit être publique ou accessible via le lien
- Format identique au CSV

### 5. ScreenshotImportForm
Import d'un lead depuis une capture d'écran (OCR).

**Fonctionnalités:**
- Drag & drop d'image
- Extraction OCR avec Tesseract.js (client-side)
- Score de confiance par champ et global
- Édition manuelle des données extraites
- Validation avant création
- Affichage du texte brut extrait

**Formats d'images supportés:**
- PNG, JPG, JPEG, GIF, WEBP

**Champs extraits:**
- Prénom / Nom
- Email
- Téléphone
- Société
- Poste
- Site web (si présent)

## 🛠️ Services utilisés

### leadImportApi
Client API pour les endpoints d'import.

**Méthodes:**
- `previewCsv(file, delimiter, skipFirstRow)` - Prévisualiser CSV
- `importCsv(file, mapping)` - Importer CSV
- `previewGoogleSheets(url, mapping)` - Prévisualiser Google Sheets
- `importGoogleSheets(url, mapping)` - Importer Google Sheets
- `batchCreateLeads(leads, skipDuplicates, defaultStageId)` - Création en batch
- `getImportHistory(page, pageSize)` - Historique des imports

### ocrService
Service d'extraction OCR côté client.

**Méthodes:**
- `extractTextFromImage(file, onProgress)` - Extraire le texte
- `extractLeadFromImage(file, onProgress)` - Extraire et parser un lead
- `validateExtractedLead(lead)` - Valider les données extraites

### googleSheetsService
Service de traitement des Google Sheets.

**Méthodes:**
- `isValidGoogleSheetsUrl(url)` - Valider l'URL
- `convertToGoogleSheetsCsvUrl(url)` - Convertir en URL CSV
- `fetchGoogleSheetData(url)` - Récupérer les données
- `parseCsvFile(file)` - Parser un fichier CSV local
- `autoDetectColumnMapping(headers)` - Détecter le mapping automatique

## 🎨 UI/UX Features

### Design
- Interface moderne et intuitive
- Transitions fluides avec Framer Motion
- Icônes Heroicons
- Feedback visuel (loading states, progress bars)
- Validation en temps réel avec messages d'erreur

### Accessibilité
- Labels explicites pour les champs
- Messages d'erreur clairs
- Indicateurs de champs requis
- Support du clavier
- ARIA labels

### Workflow
1. **Upload** - Sélection du fichier/URL/image
2. **Preview** - Validation et aperçu des données
3. **Review** - Correction manuelle si nécessaire
4. **Import** - Création des leads avec feedback

## 🚦 États et Gestion

### États de chargement
- Upload: spinner + message
- OCR: barre de progression (0-100%)
- Import: spinner + message
- Preview: skeleton loaders

### Gestion des erreurs
- Validation côté client avant envoi
- Messages d'erreur explicites
- Toast notifications (succès/erreur)
- Rollback en cas d'échec

### Notifications
```typescript
showToast({
  title: 'Import réussi',
  description: `${result.successCount} leads créés`,
  variant: 'success',
});
```

## 📊 Statistiques d'import

Après un import, les résultats incluent:
- `totalProcessed` - Nombre total de lignes traitées
- `successCount` - Nombre de leads créés
- `errorCount` - Nombre d'erreurs
- `duplicateCount` - Nombre de doublons ignorés
- `skippedCount` - Nombre de lignes sautées
- `errors[]` - Détails des erreurs par ligne

## 🔐 Sécurité

### Validation
- Email format valide
- Probabilité entre 0-100
- Valeurs numériques pour estimatedValue
- Champs requis vérifiés

### Doublons
- Détection par email
- Skip automatique (configurable)
- Compteur dans les résultats

### Taille des fichiers
- CSV: recommandé < 10 MB
- Images: recommandé < 5 MB

## 🧪 Tests

### Tests manuels
1. **Manuel**: Créer un lead avec tous les champs
2. **CSV**: Importer un fichier avec 10+ lignes
3. **Google Sheets**: Importer une feuille publique
4. **Screenshot**: Uploader une carte de visite

### Scénarios d'erreur
- Fichier CSV invalide
- URL Google Sheets privée
- Image illisible (OCR)
- Données manquantes
- Doublons

## 📝 TODO

- [ ] Tests unitaires (Jest + React Testing Library)
- [ ] Tests d'intégration (Playwright)
- [ ] Documentation utilisateur avec screenshots
- [ ] Support Excel (.xlsx)
- [ ] Amélioration de l'OCR (Azure Computer Vision)
- [ ] Historique des imports dans l'UI
- [ ] Export des erreurs en CSV
- [ ] Templates de mapping personnalisés

## 🎯 Métriques de succès

- ✅ 4 méthodes d'import disponibles
- ✅ Validation en temps réel
- ✅ Auto-détection du mapping
- ✅ Gestion des doublons
- ✅ Feedback utilisateur clair
- ✅ Performance client-side (OCR)
- ✅ 0 erreurs de linting

## 📞 Support

Pour toute question ou bug:
1. Vérifier le IMPORT_FEATURE_SUMMARY.md
2. Consulter les logs du backend
3. Tester avec les exemples fournis



