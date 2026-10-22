# Contexte métier Abricot

## Produit

Abricot est un SaaS de gestion collaborative de projets et de tâches destiné principalement aux freelances.

## Glossaire

### Utilisateur

Personne inscrite pouvant créer des projets et participer aux projets auxquels elle est associée.

### Projet

Espace de collaboration contenant un nom, une description, des membres et des tâches.

### Propriétaire

Utilisateur ayant créé un projet. Le backend lui réserve notamment la suppression du projet.

### Administrateur

Membre autorisé à modifier les informations d'un projet et à gérer ses contributeurs, mais pas à supprimer le projet. L'interface ne crée pas de membres `ADMIN` et ne propose pas de gestion des rôles ; ses ajouts sont toujours des contributeurs. Dans les parcours de l'interface, l'administrateur est donc le propriétaire. Un membre `ADMIN` préexistant peut modifier le projet sans pouvoir le supprimer.

### Contributeur

Membre autorisé à consulter un projet et à gérer ses tâches dans les limites imposées par le backend.

Une personne retirée des membres perd l'accès au projet, mais conserve ses assignations de tâches dans le backend fourni. L'édition d'une tâche doit filtrer les assignés qui ne sont plus membres.

### Tâche

Travail rattaché à un projet, décrit par un titre, une description, un statut, une échéance éventuelle, une priorité disponible dans le backend et un ou plusieurs assignés.

### Assigné

Utilisateur responsable d'une tâche. Une tâche peut avoir plusieurs assignés.

### Statut de tâche

État d'avancement d'une tâche. L'interface obligatoire utilise « À faire », « En cours » et « Terminée ». Tout statut backend supplémentaire doit être signalé avant d'être exposé.

### Commentaire

Message ajouté à une tâche par un membre autorisé pour collaborer dans son contexte.

### Dashboard

Vue personnelle comprenant :

1. les tâches assignées sous forme de liste ;
2. les tâches du mois sous forme de Kanban par statut ;
3. les projets comportant des tâches assignées à l'utilisateur.

### Interface IA

Prévisualisation non fonctionnelle de la génération automatique de tâches. Elle est intégrée visuellement, mais son action finale reste désactivée et annoncée comme bientôt disponible.

## Vocabulaire à éviter

- Ne pas employer « workspace » à la place de « projet » dans l'interface.
- Ne pas confondre propriétaire, administrateur et contributeur.
- Ne pas présenter l'interface IA comme une génération fonctionnelle.
