# Correction du problème de création de tâche

## Problème identifié

L'erreur "User `4b3d8c7b-66f5-4bf1-8e33-1ff692152362` not found or cannot be assigned tasks" se produisait lors de la création de tâches.

### Cause racine

Confusion entre deux types d'ID utilisateur dans le système:

1. **ApplicationUser.Id** (IdentityUserId): Utilisé pour l'authentification JWT
2. **BusinessUser.Id** (DomainUserId): Utilisé pour les assignations de tâches

Le JWT renvoyait l'ApplicationUser.Id dans le claim `user_id`, mais le système de tâches nécessitait le BusinessUser.Id (DomainUserId).

## Solution implémentée

### 1. Backend - Corrections JWT et Auth (✅ Complété)

**Fichier: `api/LeadTracker.Infrastructure/Services/JwtService.cs`**
- Modifié le claim `user_id` pour utiliser `user.DomainUserId` au lieu de `user.Id`
- Ajouté un claim `identity_user_id` pour conserver la référence à l'ApplicationUser.Id

**Fichier: `api/LeadTracker.Infrastructure/Services/AuthService.cs`**
- Modifié `RegisterAsync` pour retourner `domainUser.Id` dans `UserInfo`
- Modifié `LoginAsync` pour retourner `user.DomainUserId.Value` dans `UserInfo`
- Ajouté validation pour s'assurer que `DomainUserId` est défini

### 2. Backend - Nouvel endpoint utilisateurs (✅ Complété)

**Fichier: `api/LeadTracker.Api/Controllers/UsersController.cs`**
- Ajouté endpoint `GET /api/users/simple` pour récupérer les utilisateurs de l'organisation
- Cet endpoint est accessible à tous les utilisateurs authentifiés (pas besoin d'être Admin)
- Retourne une liste simplifiée: id, firstName, lastName, fullName, email

**Fichier: `api/LeadTracker.Core/DTOs/UserManagementDTOs.cs`**
- Ajouté DTO `SimpleUserInfo` pour la liste des utilisateurs

### 3. Frontend - Corrections (✅ Complété)

**Fichier: `web/src/lib/usersApi.ts`** (nouveau)
- Créé API client pour appeler `/api/users/simple`

**Fichier: `web/src/app/tasks/components/TaskFormModal.tsx`**
- Ajouté récupération de la liste des utilisateurs depuis l'API
- Ajouté champ de sélection "Assigner à" dans le formulaire
- Le champ est obligatoire et pré-rempli avec l'utilisateur connecté

**Fichier: `web/src/components/forms/TaskCreationForm.tsx`**
- Déjà mis à jour pour récupérer et utiliser la liste des utilisateurs

## Migration des données existantes

⚠️ **IMPORTANT**: Pour les utilisateurs existants qui se connectent pour la première fois après cette mise à jour:

L'application génère automatiquement l'erreur si `DomainUserId` n'est pas défini lors du login.

Si vous avez des utilisateurs existants dans la base de données qui n'ont pas de `DomainUserId` défini, vous devez exécuter ce script SQL:

```sql
-- Mettre à jour les ApplicationUsers existants pour définir leur DomainUserId
UPDATE "Users" AS au
SET "DomainUserId" = bu."Id"
FROM "BusinessUsers" AS bu
WHERE bu."IdentityUserId" = au."Id"
  AND au."DomainUserId" IS NULL;

-- Vérifier que tous les utilisateurs ont maintenant un DomainUserId
SELECT 
    au."Id" AS "ApplicationUserId",
    au."Email",
    au."DomainUserId",
    bu."Id" AS "BusinessUserId"
FROM "Users" AS au
LEFT JOIN "BusinessUsers" AS bu ON bu."IdentityUserId" = au."Id"
WHERE au."DomainUserId" IS NULL;
```

## Tests

### Prérequis
1. Backend démarré sur `http://localhost:8080`
2. Frontend démarré sur `http://localhost:3000`
3. Base de données PostgreSQL en cours d'exécution
4. Utilisateurs de test créés dans l'organisation

### Étapes de test

1. **Test de connexion**
   - Se connecter avec un utilisateur existant
   - Vérifier qu'aucune erreur ne se produit
   - Vérifier que le token JWT contient le bon `user_id` (DomainUserId)

2. **Test de liste des utilisateurs**
   - Aller sur `/tasks`
   - Cliquer sur "Nouvelle tâche"
   - Vérifier que la liste des utilisateurs se charge correctement
   - Vérifier que l'utilisateur connecté est pré-sélectionné

3. **Test de création de tâche**
   - Remplir le formulaire:
     - Lead: Sélectionner un lead
     - Assigner à: Sélectionner un utilisateur
     - Titre: "Test création tâche"
     - Type: Appel
     - Priorité: Moyenne
     - Date d'échéance: Date future
   - Cliquer sur "Créer"
   - Vérifier que la tâche est créée sans erreur 400
   - Vérifier que la tâche apparaît dans la liste

4. **Test d'assignation à un autre utilisateur**
   - Créer une nouvelle tâche
   - Assigner à un autre utilisateur de l'organisation
   - Vérifier que la création réussit

## Démarrage du système

### Backend
```bash
cd /Users/franckmb/Documents/LeadTracker/api
dotnet run --project LeadTracker.Api
```

### Frontend
```bash
cd /Users/franckmb/Documents/LeadTracker/web
npm run dev
```

## Points à vérifier après les tests

- [ ] Les utilisateurs peuvent se connecter sans erreur
- [ ] La liste des utilisateurs s'affiche dans le formulaire de création de tâche
- [ ] Les tâches peuvent être créées et assignées à n'importe quel utilisateur de l'organisation
- [ ] L'utilisateur connecté peut s'auto-assigner des tâches
- [ ] Les erreurs 400 "User not found" ne se produisent plus

## Fichiers modifiés

### Backend
- `api/LeadTracker.Infrastructure/Services/JwtService.cs`
- `api/LeadTracker.Infrastructure/Services/AuthService.cs`
- `api/LeadTracker.Api/Controllers/UsersController.cs`
- `api/LeadTracker.Core/DTOs/UserManagementDTOs.cs`

### Frontend
- `web/src/lib/usersApi.ts` (nouveau)
- `web/src/app/tasks/components/TaskFormModal.tsx`
- `web/src/components/forms/TaskCreationForm.tsx`

## Notes

- Le JWT contient maintenant `user_id` = DomainUserId et `identity_user_id` = ApplicationUserId
- L'endpoint `/api/users/simple` est accessible à tous les utilisateurs authentifiés
- Le champ "Assigner à" est obligatoire dans le formulaire de création de tâche
- Les utilisateurs existants doivent avoir leur `DomainUserId` défini pour pouvoir se connecter

