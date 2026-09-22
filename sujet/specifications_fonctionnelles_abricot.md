# Spécifications Fonctionnelles - Abricot.co

SaaS de Gestion de Projet Collaboratif

## 1. Fonctionnalités

L'application doit inclure les fonctionnalités suivantes :

### 1. Authentification et Gestion des Utilisateurs

- Inscription/Connexion : Les utilisateurs doivent pouvoir s'inscrire et se connecter en utilisant une adresse e-mail et un mot de passe.
- Gestion de Profil : Les utilisateurs peuvent modifier leur nom, leur adresse e-mail et leur mot de passe.
- Rôles Utilisateur : Tous les utilisateurs auront le même rôle, mais les informations et actions auxquelles ils auront accès vont changer selon le projet :
  - S’ils sont administrateur du projet, ils pourront l’éditer, supprimer, créer et supprimer des nouvelles tâches.
  - S’ils sont contributeur, ils pourront seulement créer de nouvelles tâches ou les supprimer.
  - S’ils sont ni contributeurs, ni administrateur, ils ne pourront pas accéder au projet.

### 2. Gestion des Projets

- Création de Projet : Les utilisateurs peuvent créer de nouveaux projets, en spécifiant un nom, une description et des contributeurs. Ils seront alors administrateurs des projets qu’ils auront créés.
- Visualisation des Projets : Vue d'ensemble des projets auxquels l'utilisateur est associé en tant que propriétaire ou contributeur.
- Modification/Suppression de Projet : Les administrateurs de projet peuvent modifier les détails du projet et le supprimer, ou bien ajouter / retirer des contributeurs.

### 3. Gestion des Tâches

- Création de Tâche : Création de tâches au sein d'un projet, avec un titre, une description, une date d'échéance et un statut.
- Assignation de Tâche : Attribution de tâches à un ou plusieurs utilisateurs.
- Statut de Tâche : Suivi du statut des tâches (À faire, En cours, Terminée).
- Commentaires de Tâche : Les utilisateurs peuvent ajouter des commentaires aux tâches pour la collaboration.

### 4. Tableau de Bord et Vues

- Tableau de Bord Personnel - 3 vues :
  - Vue liste des tâches assignées à l'utilisateur, les plus urgents d’abord ;
  - Vue kanban des tâches du mois par statut (À faire, En cours, Terminée).
  - Vue liste des projets dans lesquels l’utilisateur a des tâches assignées, les plus urgents d’abord.
- Vue Liste : Liste détaillée de toutes les tâches d'un projet.
- Optionnel : Recherche et Filtrage : Possibilité de rechercher et de filtrer les projets et les tâches par différents critères (assigné à, date d'échéance, statut, etc.).

## 2. Contraintes Techniques

Le développement de l'application doit respecter les contraintes techniques suivantes :

| Catégorie de Contrainte | Détail |
|---|---|
| Framework Frontend | Next.js avec React pour le développement de l'interface utilisateur. |
| Accessibilité (WCAG) | L'interface utilisateur doit être conçue en respectant les principes d'accessibilité WCAG 2.1 (niveau AA au minimum). |
| Gestion de Version | Utilisation de Git avec une plateforme de dépôt de code (GitHub, GitLab). |
| Design Responsive | L'interface doit être entièrement responsive et adaptée à différents appareils (ordinateurs de bureau, tablettes, mobiles). |
| Code de qualité | Le code est correctement écrit, les fonctions nommées de manière explicite et des commentaires permettent de comprendre le code quand c’est nécessaire. |
| Libraries externes | Vous êtes libre d’utiliser les libraries de votre choix, que ce soit pour les composants, pour la gestion du state, la gestion des requêtes etc.<br>Mais le choix de chaque librairie présente dans le fichier package.json devra être justifié en soutenance. |
