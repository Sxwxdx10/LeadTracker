# 🧪 Guide de test - Import UI

Guide rapide pour tester les composants d'import multi-sources.

## 🚀 Démarrage rapide

### 1. Démarrer l'environnement

```bash
# Terminal 1 - Backend
cd api
dotnet run --project LeadTracker.Api

# Terminal 2 - Frontend
cd web
npm run dev
```

### 2. Accéder à l'application

```
http://localhost:3000/leads
```

### 3. Ouvrir le modal

Cliquez sur le bouton **"Nouveau lead"** en haut à droite.

---

## 📋 Scénarios de test

### ✅ Onglet 1: Manuel

**Objectif**: Créer un lead manuellement

**Steps**:
1. Remplir les champs obligatoires:
   - Prénom: `Jean`
   - Nom: `Dupont`
   - Email: `jean.dupont@test.com`

2. Remplir les champs optionnels (au choix):
   - Téléphone: `+33612345678`
   - Société: `Test Corp`
   - Poste: `Directeur`
   - Valeur estimée: `50000`
   - Probabilité: `75`
   - Source: `Test`

3. Cliquer sur **"Créer le lead"**

**Résultat attendu**:
- ✅ Toast de succès
- ✅ Modal se ferme
- ✅ Lead apparaît dans la liste
- ✅ Page se rafraîchit

**Test d'erreur**:
- Laisser l'email vide → Message d'erreur
- Email invalide (`test@`) → Message d'erreur
- Probabilité > 100 → Message d'erreur

---

### ✅ Onglet 2: CSV

**Objectif**: Importer plusieurs leads depuis un CSV

**Fichier de test**: `web/public/examples/sample-leads.csv` (10 leads)

**Steps**:
1. Télécharger ou créer un fichier CSV:
```csv
Email,Prénom,Nom,Société,Téléphone
john@example.com,John,Doe,Acme,+33612345678
jane@example.com,Jane,Smith,Tech,+33687654321
```

2. Drag & drop le fichier ou cliquer pour sélectionner

3. **Vérifier la prévisualisation**:
   - Nombre total de lignes
   - Nombre de lignes valides
   - Tableau avec les premières lignes
   - Indicateurs ✅ (valid) ou ❌ (invalid)

4. Cliquer sur **"Importer X leads"**

**Résultat attendu**:
- ✅ Loading spinner pendant l'import
- ✅ Toast avec compteurs (ex: "8 leads créés (2 doublons ignorés)")
- ✅ Modal se ferme
- ✅ Leads apparaissent dans la liste

**Test d'erreur**:
- Fichier sans en-têtes → Erreur
- Email manquant → Ligne invalide (affichée en rouge)
- Format incorrect → Message d'erreur

**Fonctionnalités à vérifier**:
- Auto-détection du mapping (Email → email, Prénom → firstName, etc.)
- Gestion des doublons (email existant)
- Bouton "Changer de fichier" fonctionne

---

### ✅ Onglet 3: Google Sheets

**Objectif**: Importer depuis une feuille Google Sheets publique

**Prérequis**: Créer une feuille Google Sheets publique

**Steps**:
1. **Créer une Google Sheet** (si pas encore fait):
   - Aller sur [Google Sheets](https://sheets.google.com)
   - Créer une nouvelle feuille
   - Ajouter les en-têtes et données (même format que CSV)
   - Cliquer sur **Partager** → **Toute personne disposant du lien**
   - Copier l'URL

2. **Dans l'application**:
   - Coller l'URL dans le champ
   - Cliquer sur **"Prévisualiser"**

3. **Vérifier la prévisualisation** (identique au CSV)

4. Cliquer sur **"Importer X leads"**

**Résultat attendu**:
- ✅ Fetch automatique des données
- ✅ Preview affiché
- ✅ Import réussi avec compteurs
- ✅ Toast de succès

**Test d'erreur**:
- URL invalide → Message d'erreur
- Feuille privée → Erreur réseau
- Format incorrect → Validation échouée

**URL de test** (exemple):
```
https://docs.google.com/spreadsheets/d/VOTRE_ID/edit
```

---

### ✅ Onglet 4: Screenshot (OCR)

**Objectif**: Extraire un lead depuis une image

**Fichier de test**: Carte de visite ou screenshot avec texte

**Steps**:
1. **Préparer une image** (carte de visite ou screenshot):
   - Texte lisible
   - Bon contraste
   - Format: PNG, JPG, JPEG, GIF, WEBP

2. **Dans l'application**:
   - Drag & drop l'image ou cliquer pour sélectionner
   - Attendre l'extraction OCR (barre de progression 0-100%)

3. **Review des données extraites**:
   - Vérifier le score de confiance global (%)
   - Vérifier les champs extraits avec leur confiance individuelle
   - Corriger manuellement si nécessaire
   - Consulter le texte brut extrait (en bas)

4. Cliquer sur **"Créer le lead"**

**Résultat attendu**:
- ✅ Barre de progression animée
- ✅ Extraction automatique des champs
- ✅ Score de confiance affiché
- ✅ Possibilité d'éditer les champs
- ✅ Warning si confiance < 50%
- ✅ Validation avant création
- ✅ Lead créé avec succès

**Test d'erreur**:
- Image illisible → Confiance très basse
- Pas d'email détecté → Message d'erreur
- Champs manquants → Validation échouée

**Champs extraits**:
- Prénom / Nom
- Email
- Téléphone
- Société
- Poste
- Site web (si présent)

**Exemple d'image de test**:
Créer une image avec:
```
JOHN DOE
CEO
Acme Corporation
john.doe@acme.com
+33 6 12 34 56 78
www.acme.com
```

---

## 🐛 Troubleshooting

### Modal ne s'ouvre pas
- Vérifier la console (F12) pour erreurs
- Vérifier que le backend est démarré
- Vérifier l'authentification

### CSV ne parse pas
- Vérifier le délimiteur (virgule)
- Vérifier l'encodage (UTF-8)
- Vérifier la première ligne (en-têtes)

### Google Sheets erreur CORS
- Vérifier que la feuille est publique
- Vérifier l'URL (format correct)
- Essayer dans un autre navigateur

### OCR ne détecte rien
- Améliorer la qualité de l'image
- Augmenter le contraste
- Utiliser une image plus grande
- Vérifier le texte brut extrait

### Import échoue
- Vérifier la console backend
- Vérifier les logs API
- Vérifier la connexion à la base de données
- Vérifier que l'utilisateur est authentifié

---

## ✅ Checklist de test

### Fonctionnel
- [ ] Modal s'ouvre et se ferme
- [ ] 4 onglets accessibles
- [ ] Formulaire manuel avec validation
- [ ] Upload CSV drag & drop
- [ ] Preview CSV avec statistiques
- [ ] Import CSV réussi
- [ ] URL Google Sheets validée
- [ ] Import Google Sheets réussi
- [ ] Upload image drag & drop
- [ ] OCR extraction avec progress
- [ ] Review et édition des champs extraits
- [ ] Création depuis screenshot

### UX
- [ ] Loading states affichés
- [ ] Toast notifications fonctionnent
- [ ] Messages d'erreur clairs
- [ ] Transitions fluides
- [ ] Boutons désactivés si nécessaire
- [ ] Instructions claires

### Validation
- [ ] Champs requis vérifiés
- [ ] Format email validé
- [ ] Valeurs numériques validées
- [ ] Doublons détectés
- [ ] Erreurs affichées par ligne

### Performance
- [ ] Upload rapide (< 1s)
- [ ] OCR en temps réel (< 10s)
- [ ] Preview instantané
- [ ] Import batch efficace
- [ ] Pas de freeze de l'UI

---

## 📊 Résultats attendus

### Manuel
```
✅ Lead créé avec succès
1 lead créé
```

### CSV (10 lignes)
```
✅ Import réussi
8 leads créés (2 doublons ignorés)
```

### Google Sheets (10 lignes)
```
✅ Import réussi
10 leads créés
```

### Screenshot
```
✅ Lead créé avec succès
Confiance: 85%
1 lead créé
```

---

## 🎯 Tests avancés

### Test de charge
- Importer un CSV avec 100+ lignes
- Vérifier le temps de traitement
- Vérifier les compteurs

### Test de doublons
1. Créer un lead manuellement
2. Importer un CSV avec le même email
3. Vérifier qu'il est ignoré (compteur duplicateCount)

### Test de validation
- CSV avec lignes invalides
- Vérifier que seules les lignes valides sont importées
- Vérifier les messages d'erreur détaillés

### Test de concurrence
- Ouvrir 2 onglets
- Importer depuis les 2
- Vérifier qu'il n'y a pas de conflit

---

## 📝 Rapport de bug

Si vous trouvez un bug, noter:
1. **Étape** reproduisant le bug
2. **Résultat attendu** vs **Résultat obtenu**
3. **Console** (F12) - Messages d'erreur
4. **Navigateur** et version
5. **Fichier de test** utilisé (si applicable)

---

## ✅ Tests réussis = Prêt pour production

Une fois tous les tests passés:
- ✅ Déployer sur staging
- ✅ Tests E2E automatisés
- ✅ Demo client
- ✅ Documentation utilisateur
- ✅ Déploiement production

---

**Happy Testing! 🚀**



