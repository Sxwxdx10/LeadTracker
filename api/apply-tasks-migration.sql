-- Script pour appliquer la migration AddTaskRemindersRecurrenceAndNotifications
-- À exécuter manuellement si dotnet ef database update échoue

-- 1. Gérer les tâches avec AssignedUserId NULL
UPDATE "Tasks" 
SET "AssignedUserId" = (
    SELECT "Id" 
    FROM "BusinessUsers" u 
    WHERE u."OrganizationId" = "Tasks"."OrganizationId" 
    ORDER BY u."CreatedAt" 
    LIMIT 1
)
WHERE "AssignedUserId" IS NULL;

-- 2. Ajouter les colonnes de rappel
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "HasReminder" boolean NOT NULL DEFAULT true;
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "ReminderAt" timestamp with time zone NULL;
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "ReminderMinutesBefore" integer NULL DEFAULT 60;
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "ReminderSent" boolean NOT NULL DEFAULT false;

-- 3. Ajouter les colonnes de récurrence
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "IsRecurring" boolean NOT NULL DEFAULT false;
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "RecurrencePattern" character varying(20) NULL;
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "RecurrenceInterval" integer NULL;
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "RecurrenceEndDate" timestamp with time zone NULL;
ALTER TABLE "Tasks" ADD COLUMN IF NOT EXISTS "ParentTaskId" uuid NULL;

-- 4. Modifier AssignedUserId pour être NOT NULL
ALTER TABLE "Tasks" ALTER COLUMN "AssignedUserId" SET NOT NULL;

-- 5. Créer la table Notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Type" character varying(50) NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Message" character varying(1000) NOT NULL,
    "RelatedTaskId" uuid NULL,
    "RelatedLeadId" uuid NULL,
    "IsRead" boolean NOT NULL DEFAULT false,
    "ReadAt" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" text NULL,
    "UpdatedBy" text NULL,
    "OrganizationId" uuid NOT NULL,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_BusinessUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "BusinessUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Notifications_Leads_RelatedLeadId" FOREIGN KEY ("RelatedLeadId") REFERENCES "Leads" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Notifications_Organizations_OrganizationId" FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Notifications_Tasks_RelatedTaskId" FOREIGN KEY ("RelatedTaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE
);

-- 6. Créer les indexes pour Tasks
CREATE INDEX IF NOT EXISTS "IX_Tasks_ReminderAt" ON "Tasks" ("ReminderAt");
CREATE INDEX IF NOT EXISTS "IX_Tasks_ParentTaskId" ON "Tasks" ("ParentTaskId");
CREATE INDEX IF NOT EXISTS "IX_Tasks_AssignedUserId_DueDate_Status" ON "Tasks" ("AssignedUserId", "DueDate", "Status");

-- 7. Créer les indexes pour Notifications
CREATE INDEX IF NOT EXISTS "IX_Notifications_OrganizationId" ON "Notifications" ("OrganizationId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_RelatedTaskId" ON "Notifications" ("RelatedTaskId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_RelatedLeadId" ON "Notifications" ("RelatedLeadId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_IsRead" ON "Notifications" ("IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notifications_Type" ON "Notifications" ("Type");
CREATE INDEX IF NOT EXISTS "IX_Notifications_CreatedAt" ON "Notifications" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead_CreatedAt" ON "Notifications" ("UserId", "IsRead", "CreatedAt");

-- 8. Ajouter la foreign key ParentTask
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_Tasks_Tasks_ParentTaskId'
    ) THEN
        ALTER TABLE "Tasks" ADD CONSTRAINT "FK_Tasks_Tasks_ParentTaskId" 
        FOREIGN KEY ("ParentTaskId") REFERENCES "Tasks" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- 9. Marquer la migration comme appliquée
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251106021412_AddTaskRemindersRecurrenceAndNotifications', '8.0.0')
ON CONFLICT DO NOTHING;

COMMIT;



