# Test Data Management Guidelines

## Problème Identifié

Les tests échouaient avec l'erreur :
```
23503: insert or update on table "BusinessUsers" violates foreign key constraint "FK_BusinessUsers_Organizations_OrganizationId"
```

## Cause Racine

Les tests créaient des `BusinessUsers` avec des `OrganizationId` qui référençaient des organisations n'existant pas encore en base de données.

## Solutions Implémentées

### 1. Ordre de Sauvegarde Correct

**❌ Incorrect :**
```csharp
await _context.Organizations.AddAsync(organization);
await _context.BusinessUsers.AddAsync(user);
await _context.SaveChangesAsync(); // Erreur : Organization pas encore sauvegardée
```

**✅ Correct :**
```csharp
await _context.Organizations.AddAsync(organization);
await _context.SaveChangesAsync(); // Sauvegarder l'organization d'abord

await _context.BusinessUsers.AddAsync(user);
await _context.SaveChangesAsync();
```

### 2. Méthodes Utilitaires

Utiliser les méthodes `EnsureOrganizationExists` pour s'assurer que les organisations existent :

```csharp
// Asynchrone
var org = await seeder.EnsureOrganizationExistsAsync(context, orgId, "Test Org", "test.com");

// Synchrone
var org = seeder.EnsureOrganizationExists(context, orgId, "Test Org", "test.com");
```

### 3. Nettoyage des Tests

L'ordre de nettoyage doit respecter les contraintes de clé étrangère :

```csharp
// Ordre correct (dépendants d'abord, parents ensuite)
await context.UserRoles.ExecuteDeleteAsync();
await context.Tasks.ExecuteDeleteAsync();
await context.Leads.ExecuteDeleteAsync();
await context.Stages.ExecuteDeleteAsync();
await context.BusinessUsers.ExecuteDeleteAsync();
await context.Users.ExecuteDeleteAsync();
await context.Organizations.ExecuteDeleteAsync();
```

## Bonnes Pratiques

### 1. Création de Données de Test

1. **Toujours créer les entités parentes en premier**
2. **Sauvegarder les parents avant de créer les dépendants**
3. **Utiliser des IDs uniques pour éviter les conflits entre tests**

### 2. Tests de Contraintes d'Intégrité

Pour les tests qui vérifient les contraintes FK, créer intentionnellement des références invalides :

```csharp
var lead = new Lead
{
    Id = Guid.NewGuid(),
    Title = "Test Lead",
    OrganizationId = Guid.NewGuid(), // ID inexistant - test de contrainte
    StageId = Guid.NewGuid(), // ID inexistant - test de contrainte
    AssignedUserId = Guid.NewGuid() // ID inexistant - test de contrainte
};
```

### 3. Isolation des Tests

- Utiliser des domaines/emails uniques par test
- Nettoyer les données après chaque test
- Éviter les dépendances entre tests

## Fichiers Modifiés

- `TestDataSeeder.cs` : Ajout des méthodes utilitaires et amélioration du nettoyage
- `PostgreSqlIntegrityConstraintTests.cs` : Correction de l'ordre de sauvegarde
- `DockerComposeIntegrityConstraintTests.cs` : Correction de l'ordre de sauvegarde
- `DockerComposePerformanceTests.cs` : Correction de l'ordre de sauvegarde

## Vérification

Après ces corrections, les tests devraient passer sans erreur de contrainte de clé étrangère.
