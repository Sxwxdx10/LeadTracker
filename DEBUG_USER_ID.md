# 🔍 Debug: Problème d'ID utilisateur

## Problème
Erreur 400: "User 4b3d8c7b-66f5-4bf1-8e33-1ff692152362 not found or cannot be assigned tasks"

## Étapes de débogage

### 1. Vérifier l'ID dans localStorage

Ouvrez la console du navigateur et tapez:

```javascript
// Vérifier l'utilisateur stocké
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User ID from localStorage:', user.id);
console.log('User full object:', user);

// Vérifier le token JWT
const token = localStorage.getItem('accessToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT Claims:', payload);
  console.log('user_id claim:', payload.user_id);
  console.log('NameIdentifier claim:', payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
}
```

### 2. Vérifier dans la base de données

Exécutez cette requête SQL dans votre base PostgreSQL:

```sql
-- Vérifier l'utilisateur Steve
SELECT 
    au."Id" as "ApplicationUserId",
    au."Email",
    au."DomainUserId",
    bu."Id" as "BusinessUserId",
    bu."FirstName",
    bu."LastName",
    bu."OrganizationId"
FROM "AspNetUsers" au
LEFT JOIN "BusinessUsers" bu ON au."DomainUserId" = bu."Id"
WHERE au."Email" = 'stevembiele+1@gmail.com';
```

### 3. Solutions possibles

#### Option A: Recréer le BusinessUser manquant

Si le BusinessUser n'existe pas:

```sql
-- Créer le BusinessUser manquant
INSERT INTO "BusinessUsers" ("Id", "FirstName", "LastName", "Email", "IsActive", "OrganizationId", "IdentityUserId", "CreatedAt", "UpdatedAt")
SELECT 
    gen_random_uuid(),
    au."FirstName",
    au."LastName",
    au."Email",
    true,
    au."OrganizationId",
    au."Id",
    NOW(),
    NOW()
FROM "AspNetUsers" au
WHERE au."Email" = 'stevembiele+1@gmail.com'
  AND au."DomainUserId" IS NULL;

-- Mettre à jour ApplicationUser avec le DomainUserId
UPDATE "AspNetUsers" au
SET "DomainUserId" = bu."Id"
FROM "BusinessUsers" bu
WHERE au."Email" = 'stevembiele+1@gmail.com'
  AND bu."Email" = au."Email"
  AND au."DomainUserId" IS NULL;
```

#### Option B: Forcer le bon ID dans le frontend

Modifier le code pour utiliser le claim `user_id` du JWT au lieu du UserInfo.id.

## Cause probable

L'utilisateur Steve s'est enregistré **avant** que le code de création du BusinessUser soit implémenté, donc:
- ✅ ApplicationUser existe
- ❌ BusinessUser n'existe pas ou n'est pas lié
- ❌ Le DomainUserId est null ou incorrect

## Solution recommandée

1. **Vérifier la base de données** avec les requêtes SQL ci-dessus
2. Si le BusinessUser manque, le créer avec le script SQL
3. Se déconnecter et se reconnecter pour obtenir le nouveau token
4. Essayer de créer une tâche

