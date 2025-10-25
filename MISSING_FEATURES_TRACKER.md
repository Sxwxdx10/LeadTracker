# 📋 Tracker des Fonctionnalités Manquantes

## 🎯 Objectif
Implémenter les endpoints manquants pour Activities, Comments et Attachments

## 📊 État d'avancement

### 1. Activities
- [x] Entité `Activity.cs`
- [x] Interface `IActivityService.cs`
- [x] Implémentation `ActivityService.cs`
- [x] Contrôleur `ActivitiesController.cs`
- [x] DTOs nécessaires
- [x] Migration de base de données
- [ ] Tests unitaires
- [ ] Tests d'intégration

### 2. Comments
- [x] Entité `Comment.cs`
- [x] Interface `ICommentService.cs`
- [x] Implémentation `CommentService.cs`
- [x] Contrôleur `CommentsController.cs`
- [x] DTOs nécessaires
- [x] Migration de base de données
- [ ] Tests unitaires
- [ ] Tests d'intégration

### 3. Attachments
- [x] Entité `Attachment.cs`
- [x] Interface `IAttachmentService.cs`
- [x] Implémentation `AttachmentService.cs`
- [x] Contrôleur `AttachmentsController.cs`
- [x] DTOs nécessaires
- [x] Migration de base de données
- [ ] Tests unitaires
- [ ] Tests d'intégration

## 🔗 Relations entre entités

### Activity
- Liée à un Lead (LeadId)
- Créée par un User (UserId)
- Type d'activité (enum: Call, Email, Meeting, Note, etc.)
- Date/heure de l'activité
- Description
- Statut (Planned, Completed, Cancelled)

### Comment
- Peut être liée à un Lead (LeadId) ou une Task (TaskId)
- Créée par un User (UserId)
- Contenu du commentaire
- Date de création/modification
- Possibilité de répondre à un autre commentaire (ParentCommentId)

### Attachment
- Peut être liée à un Lead, Task, Comment ou Activity
- Uploadée par un User (UserId)
- Nom du fichier
- Type MIME
- Taille du fichier
- URL/chemin de stockage
- Date d'upload

## 📝 Notes d'implémentation
- Utiliser les patterns existants du projet (Repository pattern via EF Core)
- Respecter la structure des contrôleurs existants
- Implémenter les validateurs FluentValidation si nécessaire
- Ajouter les logs appropriés
- Suivre les conventions de nommage du projet

## 🚀 Ordre d'implémentation
1. Entités (Core)
2. Interfaces de services (Core)
3. Implémentations de services (Infrastructure)
4. DTOs (Core)
5. Contrôleurs (Api)
6. Migrations (Infrastructure)
7. Configuration dans Program.cs
8. Tests

## ✅ Validation
- [x] Tous les endpoints sont créés et compilent correctement
- [x] **ERREUR 405 CORRIGÉE** - Le POST /api/tasks fonctionne maintenant !
- [x] Les relations entre entités sont configurées dans le DbContext
- [x] Les migrations sont créées (migration: `AddActivityCommentAttachmentEntities`)
- [ ] Les migrations sont appliquées à la base de données (à faire au démarrage de l'app)
- [ ] Les tests unitaires sont écrits
- [ ] Les tests d'intégration sont écrits
- [x] La documentation Swagger est à jour (via annotations des contrôleurs)

## 🔧 Problème Résolu
**ERREUR 405 "Method Not Allowed" sur POST /api/tasks** ✅ CORRIGÉ
- Le TasksController n'avait que les méthodes GET
- Ajouté : DTOs complets (CreateTaskDto, UpdateTaskDto, etc.)
- Ajouté : ITaskService + TaskService avec toutes les méthodes CRUD
- Ajouté : POST, PUT, DELETE dans TasksController
- Enregistré : TaskService dans Program.cs

Le frontend peut maintenant créer des tâches sans erreur 405 !

## 📝 Notes de déploiement
- La migration `AddActivityCommentAttachmentEntities` a été créée avec succès
- Pour appliquer la migration, démarrer l'application avec Docker ou exécuter:
  ```bash
  cd api
  dotnet ef database update --project LeadTracker.Infrastructure --startup-project LeadTracker.Api
  ```
- Les services ont été enregistrés dans `Program.cs`
- Un wrapper `FileUploadDto` a été créé pour éviter les dépendances ASP.NET Core dans la couche Core

## 🔧 Fichiers créés
### Entities (LeadTracker.Core/Entities)
- `Activity.cs` - Entité pour gérer les activités (appels, emails, meetings, notes)
- `Comment.cs` - Entité pour les commentaires sur leads/tasks/activities
- `Attachment.cs` - Entité pour les pièces jointes

### DTOs (LeadTracker.Core/DTOs)
- `TaskDTOs.cs` - **AJOUTÉ** - DTOs pour Create/Update/Response/Query de tasks
- `ActivityDTOs.cs` - DTOs pour Create/Update/Response/Query d'activities
- `CommentDTOs.cs` - DTOs pour Create/Update/Response/Query de comments
- `AttachmentDTOs.cs` - DTOs pour Create/Update/Response/Query d'attachments

### Interfaces (LeadTracker.Core/Services)
- `ITaskService.cs` - **AJOUTÉ** - Interface du service Task
- `IActivityService.cs` - Interface du service Activity
- `ICommentService.cs` - Interface du service Comment
- `IAttachmentService.cs` - Interface du service Attachment

### Implémentations (LeadTracker.Infrastructure/Services)
- `TaskService.cs` - **AJOUTÉ** - Implémentation complète CRUD pour tasks
- `ActivityService.cs` - Implémentation complète avec CRUD et filtres tenant
- `CommentService.cs` - Implémentation avec support des commentaires threadés
- `AttachmentService.cs` - Implémentation avec gestion d'upload de fichiers

### Contrôleurs (LeadTracker.Api/Controllers)
- `TasksController.cs` - **AMÉLIORÉ** - 8 endpoints REST pour tasks (POST ajouté !)
- `ActivitiesController.cs` - 8 endpoints REST pour activities
- `CommentsController.cs` - 8 endpoints REST pour comments
- `AttachmentsController.cs` - 10 endpoints REST pour attachments (avec upload/download)

### Base de données
- Configuration des nouvelles entités dans `LeadTrackerDbContext.cs`
- Filtres multi-tenant appliqués pour Activities, Comments et Attachments
- Migration EF Core créée: `AddActivityCommentAttachmentEntities`

## 🌐 Endpoints disponibles
### Tasks ✅ AJOUTÉ POUR CORRIGER L'ERREUR 405
- `GET /api/tasks` - Liste paginée avec filtres
- `GET /api/tasks/{id}` - Détails d'une task
- `POST /api/tasks` - **Créer une task (CORRIGÉ !)**
- `PUT /api/tasks/{id}` - Mettre à jour une task
- `DELETE /api/tasks/{id}` - Supprimer une task
- `GET /api/tasks/lead/{leadId}` - Tasks d'un lead
- `GET /api/tasks/my-tasks` - Tasks de l'utilisateur courant
- `POST /api/tasks/{id}/complete` - Marquer comme complétée

### Activities
- `GET /api/activities` - Liste paginée avec filtres
- `GET /api/activities/{id}` - Détails d'une activity
- `POST /api/activities` - Créer une activity
- `PUT /api/activities/{id}` - Mettre à jour une activity
- `DELETE /api/activities/{id}` - Supprimer une activity
- `GET /api/activities/lead/{leadId}` - Activities d'un lead
- `GET /api/activities/my-activities` - Activities de l'utilisateur courant
- `POST /api/activities/{id}/complete` - Marquer comme complétée

### Comments
- `GET /api/comments` - Liste paginée avec filtres
- `GET /api/comments/{id}` - Détails d'un comment
- `POST /api/comments` - Créer un comment
- `PUT /api/comments/{id}` - Mettre à jour un comment
- `DELETE /api/comments/{id}` - Supprimer un comment
- `GET /api/comments/lead/{leadId}` - Comments d'un lead
- `GET /api/comments/task/{taskId}` - Comments d'une task
- `GET /api/comments/activity/{activityId}` - Comments d'une activity

### Attachments
- `GET /api/attachments` - Liste paginée avec filtres
- `GET /api/attachments/{id}` - Détails d'un attachment
- `POST /api/attachments` - Upload un fichier (multipart/form-data)
- `PUT /api/attachments/{id}` - Mettre à jour les métadonnées
- `DELETE /api/attachments/{id}` - Supprimer un attachment
- `GET /api/attachments/{id}/download` - Télécharger le fichier
- `GET /api/attachments/lead/{leadId}` - Attachments d'un lead
- `GET /api/attachments/task/{taskId}` - Attachments d'une task
- `GET /api/attachments/activity/{activityId}` - Attachments d'une activity
- `GET /api/attachments/comment/{commentId}` - Attachments d'un comment

