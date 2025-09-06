# Guide de Migration GitHub → GitLab

## 🔧 Configuration préalable

### 1. Obtenir un token GitLab
1. Allez sur https://depot.dinf.usherbrooke.ca/-/profile/personal_access_tokens
2. Créez un nouveau token avec les scopes :
   - `api` (accès complet à l'API)
   - `read_api` (lecture de l'API)
3. Copiez le token généré

### 2. Configurer l'environnement
```bash
export GITLAB_TOKEN="votre_token_ici"
```

## 🚀 Migration automatique

### Étape 1 : Créer les milestones
```bash
./scripts/create_milestones_gitlab.sh
```

### Étape 2 : Importer les issues
```bash
python3 scripts/import_issues_gitlab.py
```

## 📋 Migration manuelle

### Créer les milestones manuellement

1. **Jalon A - Septembre 2025**
   - Titre: `Jalon A - Septembre 2025`
   - Description: `Setup + base API/DB/UI - 4 semaines (80h)`
   - Date d'échéance: `2025-09-30`

2. **Jalon B - Octobre 2025**
   - Titre: `Jalon B - Octobre 2025`
   - Description: `Features principales + analytics - 4 semaines (80h)`
   - Date d'échéance: `2025-10-31`

3. **Jalon C - Novembre 2025**
   - Titre: `Jalon C - Novembre 2025`
   - Description: `Stabilité + DevOps + qualité - 4 semaines (80h)`
   - Date d'échéance: `2025-11-30`

4. **Jalon Final - Décembre 2025**
   - Titre: `Jalon Final - Décembre 2025`
   - Description: `Polish + présentation - 1 semaine (30h)`
   - Date d'échéance: `2025-12-12`

### Créer les labels

Labels à créer sur GitLab :
- `infra`, `setup`, `backend`, `frontend`, `data`, `auth`, `security`
- `api`, `ui`, `feature`, `docs`, `jobs`, `analytics`
- `observability`, `ci`, `ux`, `quality`, `testing`
- `deployment`, `technical`, `performance`, `audit`
- `monitoring`, `presentation`
- `weight-1`, `weight-2`, `weight-3`, `weight-4`, `weight-5`

### Importer les issues

Utilisez le fichier `scripts/BACKLOG_SEED_FIXED.csv` comme référence pour créer les 19 issues principales.

## 🔍 Vérification

Après migration, vérifiez que :
- ✅ 4 milestones sont créés
- ✅ 19+ issues sont créées
- ✅ Labels sont assignés correctement
- ✅ Issues sont assignées aux bons milestones
- ✅ Critères d'acceptation et tests sont présents

## 🆘 Dépannage

### Erreur de token
```bash
export GITLAB_TOKEN="votre_nouveau_token"
```

### Erreur de connexion
Vérifiez que l'URL du projet est correcte dans les scripts.

### Erreur de permissions
Assurez-vous que votre token a les bonnes permissions sur le projet.
