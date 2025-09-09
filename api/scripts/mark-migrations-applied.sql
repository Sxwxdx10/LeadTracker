-- Script pour marquer les migrations comme appliquées
-- Ce script doit être exécuté quand les tables existent déjà mais les migrations ne sont pas enregistrées

-- Insérer les migrations dans l'historique
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
    ('20241201000001_InitialCreate', '8.0.0'),
    ('20241201000002_AddIdentityTables', '8.0.0'),
    ('20241201000003_AddOrganizations', '8.0.0'),
    ('20241201000004_AddLeads', '8.0.0'),
    ('20241201000005_AddStages', '8.0.0'),
    ('20241201000006_AddTasks', '8.0.0'),
    ('20241201000007_AddBusinessUsers', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Vérifier que les migrations ont été marquées
SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
