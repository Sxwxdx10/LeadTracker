-- Script pour créer les rôles nécessaires dans la base de données
-- Ce script doit être exécuté avant de pouvoir utiliser l'API d'authentification

-- Créer les rôles s'ils n'existent pas déjà
INSERT INTO "Roles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Admin', 'ADMIN', gen_random_uuid()::text),
    ('00000000-0000-0000-0000-000000000002', 'User', 'USER', gen_random_uuid()::text),
    ('00000000-0000-0000-0000-000000000003', 'Manager', 'MANAGER', gen_random_uuid()::text)
ON CONFLICT ("Id") DO NOTHING;

-- Vérifier que les rôles ont été créés
SELECT "Id", "Name", "NormalizedName" FROM "Roles" ORDER BY "Name";
