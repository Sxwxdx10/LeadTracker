# 🚀 Guide - Import Multi-Sources UI

## ✅ Status

**Backend**: ✅ Complete  
**Frontend Services**: ✅ Complete  
**UI Components**: ✅ Complete  
**Serveur dev**: ✅ En cours (port 3000)

---

## 🧪 Comment tester

### 1. Accéder à l'app
```
http://localhost:3000/leads
```

### 2. Ouvrir le modal
Cliquer sur **"Nouveau lead"** (bouton en haut à droite)

### 3. Tester les 4 onglets

#### 👤 Manuel (30s)
- Remplir: Prénom, Nom, Email
- Cliquer "Créer le lead"

#### 📄 CSV (1min)
- Drag & drop: `web/public/examples/sample-leads.csv`
- Vérifier preview
- Cliquer "Importer X leads"

#### 📊 Google Sheets (2min)
- Créer une feuille publique
- Coller l'URL
- Prévisualiser → Importer

#### 📷 Screenshot (2min)
- Uploader une image avec du texte
- Attendre l'OCR
- Créer le lead

---

## 📁 Composants créés

```
web/src/components/leads/import/
├── CreateLeadModal.tsx         ← Modal avec 4 onglets
├── ManualCreateForm.tsx        ← Formulaire manuel
├── CsvImportForm.tsx           ← Import CSV
├── GoogleSheetsImportForm.tsx  ← Import Google Sheets
├── ScreenshotImportForm.tsx    ← Import OCR
├── index.ts                    ← Exports
└── README.md                   ← Doc technique
```

---

## 📚 Documentation

- **IMPORT_FEATURE_SUMMARY.md** - Vue d'ensemble complète (backend + frontend)
- **web/TESTING_IMPORT_UI.md** - Guide de test détaillé
- **web/src/components/leads/import/README.md** - Doc des composants

---

## 🐛 Troubleshooting

### Backend pas démarré
```bash
cd api
dotnet run --project LeadTracker.Api
```

### Port 3000 occupé
```bash
lsof -ti:3000 | xargs kill -9
cd web && npm run dev
```

### Console du navigateur (F12)
- Tab Console: erreurs JS
- Tab Network: appels API

---

**Prêt à tester ! Ouvrir http://localhost:3000/leads 🎉**



