-- Script pour synchroniser __EFMigrationsHistory avec l'état réel de la base
-- Cela permet à dotnet ef de fonctionner correctement pour les futures migrations

-- 1. Vérifier quelles migrations sont déjà enregistrées
SELECT "MigrationId", "ProductVersion" 
FROM "__EFMigrationsHistory" 
ORDER BY "MigrationId";

-- 2. Marquer TOUTES les migrations existantes comme appliquées
-- (seulement si elles ne sont pas déjà dans l'historique)

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
    ('20250906052609_InitialCreate', '8.0.0'),
    ('20250907001901_AddApplicationUserFields', '8.0.0'),
    ('20250907002634_FixTimeZoneLength', '8.0.0'),
    ('20250916002016_RestoreOrganizationDomainUniqueConstraint', '8.0.0'),
    ('20250916003525_RemoveDomainUniqueConstraint', '8.0.0'),
    ('20250924030416_AddUserInvitations', '8.0.0'),
    ('20250924032423_AddSearchAndFilters', '8.0.0'),
    ('20251009035706_AddActivityCommentAttachmentEntities', '8.0.0'),
    ('20251025234320_AddFullTextSearchIndex', '8.0.0'),
    ('20251031001851_AddOrganizationExtendedFields', '8.0.0'),
    ('20251106021412_AddTaskRemindersRecurrenceAndNotifications', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- 3. Vérifier que tout est bien enregistré
SELECT "MigrationId", "ProductVersion" 
FROM "__EFMigrationsHistory" 
ORDER BY "MigrationId";

-- 4. Afficher le nombre total
SELECT COUNT(*) as "Total Migrations" FROM "__EFMigrationsHistory";



