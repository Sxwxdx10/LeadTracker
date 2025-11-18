# Corrections complètes - Problèmes de tâches

## 📅 Date : 8 novembre 2025

## 🐛 Problèmes identifiés et corrigés

### 1. ❌ Erreur 400 "User not found" lors de la création de tâches

**Symptôme** : Erreur "User 4b3d8c7b-66f5-4bf1-8e33-1ff692152362 not found or cannot be assigned tasks"

**Cause** : Confusion entre deux types d'ID utilisateur :
- `ApplicationUser.Id` (IdentityUserId) - utilisé pour l'authentification
- `BusinessUser.Id` (DomainUserId) - utilisé pour les assignations de tâches

**Solution** :
- ✅ Modifié `JwtService.cs` pour utiliser `DomainUserId` dans le claim `user_id`
- ✅ Modifié `AuthService.cs` pour retourner le `DomainUserId` dans `UserInfo`
- ✅ Ajouté endpoint `GET /api/users/simple` pour récupérer les utilisateurs
- ✅ Créé `web/src/lib/usersApi.ts` pour appeler l'API
- ✅ Mis à jour `TaskFormModal.tsx` pour charger et afficher les utilisateurs

**Fichiers modifiés** :
- `api/LeadTracker.Infrastructure/Services/JwtService.cs`
- `api/LeadTracker.Infrastructure/Services/AuthService.cs`
- `api/LeadTracker.Api/Controllers/UsersController.cs`
- `api/LeadTracker.Core/DTOs/UserManagementDTOs.cs`
- `web/src/lib/usersApi.ts` (nouveau)
- `web/src/app/tasks/components/TaskFormModal.tsx`

---

### 2. ❌ Erreur 405 "Method Not Allowed" lors de la complétion de tâches (page /tasks)

**Symptôme** : Requête PATCH vers `/api/tasks/{id}/complete` échoue avec erreur 405

**Cause** : Le frontend envoyait **PATCH** mais le backend attend **POST**

**Solution** :
- ✅ Changé `apiClient.patch()` en `apiClient.post()` dans `tasksApi.ts`

**Fichiers modifiés** :
- `web/src/lib/tasksApi.ts`

---

### 3. ❌ Erreur 400 lors de la complétion de tâches (page du lead)

**Symptôme** : Requête PUT vers `/api/tasks/{id}` échoue avec erreur 400

**Cause** : Le composant `TaskList` utilisait l'endpoint de mise à jour général (PUT) au lieu de l'endpoint de complétion (POST /complete)

**Solution** :
- ✅ Modifié `handleTaskComplete` dans `TaskList.tsx` pour utiliser `tasksApi.completeTask()`
- ✅ Amélioré `handleUpdateTask` dans `leads/[id]/page.tsx` pour gérer le rafraîchissement

**Fichiers modifiés** :
- `web/src/components/lead/TaskList.tsx`
- `web/src/app/leads/[id]/page.tsx`

---

### 4. ❌ Vues "À venir" et "Terminées" non représentatives des données

**Symptôme** : 
- Statistiques incorrectes (ex: 0 tâches terminées alors qu'il y en a)
- Filtres "Aujourd'hui", "À venir", "Terminées" ne montrent pas les bonnes tâches
- Tâches du passé affichées dans "Aujourd'hui"

**Cause** : Incohérences dans la logique de calcul des propriétés `IsToday`, `IsOverdue` entre backend et frontend

**Solution** :

**Backend** :
- ✅ Amélioré `IsToday` pour une plage de dates plus précise (00:00 à 23:59 du jour)
- ✅ Amélioré `IsOverdue` pour exclure les tâches annulées

**Frontend** :
- ✅ Recalculé les statistiques avec une logique cohérente dans `useTasks.ts`
- ✅ Amélioré les filtres dans `TasksList.tsx` avec calculs locaux pour éviter les incohérences de fuseau horaire

**Fichiers modifiés** :
- `api/LeadTracker.Core/Entities/Task.cs`
- `web/src/hooks/useTasks.ts`
- `web/src/app/tasks/components/TasksList.tsx`

---

## 🔧 Corrections de configuration

### Importation d'API client
**Fichier** : `web/src/lib/usersApi.ts`
- ✅ Changé `import apiClient from '@/lib/apiClient'` en `import apiClient from '@/lib/api'`
- ✅ Changé `/users/simple` en `/api/users/simple`

---

## 🚀 Pour tester

1. **Backend démarré** ✅ sur http://localhost:8080
2. **Frontend démarré** ✅ sur http://localhost:3000

### Étapes de test :

1. **Effacer le cache du navigateur** :
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Se reconnecter** :
   - Email : `stevembiele+1@gmail.com`
   - Mot de passe : `Test123!`
   - Organisation : `steve-org`

3. **Tester la création de tâche** :
   - Aller sur `/tasks`
   - Cliquer sur "+ Nouvelle tâche"
   - Le champ "Assigner à" devrait montrer les utilisateurs
   - Créer une tâche → devrait fonctionner sans erreur 400

4. **Tester la complétion de tâche** :
   - Sur la page `/tasks` : Cliquer sur le checkbox d'une tâche → devrait la marquer comme terminée
   - Sur la page d'un lead : Cliquer sur le bouton de complétion → devrait fonctionner

5. **Vérifier les filtres** :
   - Onglet "Aujourd'hui" : Affiche les tâches dues aujourd'hui et non complétées
   - Onglet "À venir" : Affiche les tâches futures (pas aujourd'hui, pas en retard)
   - Onglet "Terminées" : Affiche toutes les tâches complétées
   - Onglet "En retard" : Affiche les tâches en retard

6. **Vérifier les statistiques** :
   - "Total" : Nombre total de tâches
   - "Terminées" : Devrait refléter le vrai nombre de tâches terminées
   - "En cours" : Tâches à venir (pas aujourd'hui, pas en retard)
   - "En retard" : Tâches dont la date est passée
   - "Aujourd'hui" : Tâches dues aujourd'hui

---

## ✅ État actuel

- ✅ Backend running sur port 8080
- ✅ Frontend running sur port 3000
- ✅ Base de données PostgreSQL configurée correctement
- ✅ Utilisateurs avec DomainUserId correctement définis
- ✅ Toutes les corrections appliquées

---

## 📝 Prochaines étapes recommandées

1. **Tester toutes les fonctionnalités** de création/modification/complétion de tâches
2. **Vérifier que les filtres** fonctionnent correctement
3. **Vérifier que les statistiques** sont précises
4. **Si tout fonctionne**, commiter les changements

---

## 🔍 Déboggage

Si vous rencontrez toujours des problèmes :

**Vérifier le token JWT** :
1. Ouvrir DevTools → Application → Local Storage
2. Copier la valeur de `accessToken`
3. Aller sur https://jwt.io
4. Coller le token
5. Vérifier que le claim `user_id` contient le bon DomainUserId : `5bbce04d-5764-48da-9a43-030ecf473723`

**Vérifier les logs backend** :
```bash
tail -f /Users/franckmb/Documents/LeadTracker/api/LeadTracker.Api/logs/leadtracker-*.txt
```

**Vérifier la console frontend** :
- Ouvrir DevTools → Console
- Rechercher les erreurs en rouge

---

## 📊 Résumé des changements

| Problème | Fichiers modifiés | Status |
|----------|------------------|--------|
| ID utilisateur incorrect | 4 fichiers backend, 2 fichiers frontend | ✅ Résolu |
| Méthode HTTP incorrecte (PATCH→POST) | 1 fichier frontend | ✅ Résolu |
| Complétion de tâche dans page lead | 2 fichiers frontend | ✅ Résolu |
| Filtres et stats incorrects | 3 fichiers (1 backend, 2 frontend) | ✅ Résolu |

**Total** : 12 fichiers modifiés pour corriger 4 problèmes majeurs




