---
title: "Développez un SaaS de gestion de tâches"
source: "https://openclassrooms.com/fr/paths/2631/projects/3965/8373-option-b---mission-(cas-fictif)---developpez-un-saas-de-gestion-de-taches"
author:
published:
created: 2026-09-22
description:
tags:
  - "clippings"
---
## Option B - Mission (cas fictif) - Développez un SaaS de gestion de tâches

#### Comment allez-vous procéder?

Cette mission suit un scénario de projet professionnel.  
Vous pouvez suivre les étapes pour vous aider à réaliser vos livrables.

Avant de démarrer, nous vous conseillons de:

- lire toute la mission et ses documents liés;
- prendre des notes sur ce que vous avez compris;
- consulter les étapes pour vous guider;
- préparer une liste de questions pour votre première session de mentorat.

#### Prêt à mener la mission?

Vous êtes engagés en tant que développeur front-end chez Abricot.co, une startup qui crée un outil SaaS de gestion de projet innovant pour optimiser les flux de travail des freelances.

![](https://user.oc-static.com/upload/2025/09/27/17589644086276_Screenshot%202025-09-27%20at%2011.13.10.png)

La première itération de la plateforme est en cours de développement, le back-end est prêt, les maquettes aussi, et vous êtes chargé de développer l’interface.

Au standup meeting de ce matin, Karim, le CTO vous brief sur votre mission et vous confie:

- [ce document de spécifications fonctionnelles](https://course.oc-static.com/paths/2631+DA+Full-stack/DA+Full-stack+P7+-+Spe%CC%81cifications+Fonctionnelles+_+Application+de+Gestion+de+Projet+Collaboratif+\(SaaS\).pdf), décrivant tous les détails de fonctionnement de l’application ainsi que les contraintes techniques;
- [le code du back-end déjà développé](https://github.com/OpenClassrooms-Student-Center/dev-react-P10);
- [les maquettes de l’application](https://www.figma.com/design/4dE90dtmpQNUS05IGd9HxT/Abricot?node-id=0-1&p=f&t=bMvwdRP0k1voe2l4-0).

Vous avez toutes les informations nécessaires pour démarrer votre développement. Lisez attentivement le document de spécifications fonctionnelles et c’est parti.

Cette mission est entièrement guidée.  
Vous pouvez suivre les étapes ci-dessous.

### Étapes

### Étape 1 - Familiarisez-vous avec les maquettes et le backend

#### Résultat attendu

- Le backend qui tourne avec tous les outils associés

#### Recommandations

- Lisez attentivement le fichier README du projet backend.
- Vous pouvez exécuter le script permettant de peupler la base de données.
- Vous pouvez visualiser la base de données directement avec Prisma Studio.
- L’API est documentée avec Swagger: testez les différentes routes pour comprendre ce qui est attendu dans le projet.

#### Ressources

- [La base de code du backend](https://github.com/OpenClassrooms-Student-Center/dev-react-P10)

### Étape 2 - Créez le front-end avec React et Next

#### Résultat attendu

- Un projet front-end initialisé pour démarrer votre développement.

#### Recommandations

- Configurez votre environnement de développement (ESLint, Prettier)
- Vous êtes libre de choisir la librairie CSS que vous souhaitez utiliser
- Vous pouvez commencer à déclarer les principales variables de couleurs, de typographie, etc. dès maintenant.

#### Points de vigilance

- Dans ce projet, vous avez le choix entre utiliser React en JS ou bien Typescript. Pensez à choisir la configuration de projet correspondante dès le début. Une fois votre choix fait, il sera plus compliqué de tout configurer à partir d’une base de code existante (même si ce n’est pas impossible).

#### Ressources

- [La documentation de NextJS pour créer un projet en TypeScript](https://nextjs.org/docs/pages/api-reference/config/typescript).

### Étape 3 - Architecture et routing

#### Résultat attendu

- La navigation de base et le layout principal

#### Recommandations

- Créez le système de routing avec les pages de votre application.
- Implémentez le layout global avec la navigation.
- Mettez en place la structure des dossiers selon les bonnes pratiques.

#### Points de vigilance

- Il existe plusieurs systèmes de routing avec NextJS, faites simple et restez sur la technologie qui est recommandée.
- Ne passez pas trop de temps à réfléchir à l’organisation de fichiers parfaite.

#### Ressources

- [La documentation de NextJS sur le routing](https://nextjs.org/docs/pages/building-your-application/routing)

### Étape 4 - Mettez en place l’authentification

#### Résultat attendu

- Les pages d’authentification intégrées et fonctionnelles pour se connecter et s’inscrire.

#### Recommandations

- Basez-vous sur le backend pour faire vos requêtes.
- Vous pouvez utiliser les comptes utilisateurs qui figurent dans le script de seed de la base de données.
- Vous pouvez par exemple commencer par créer la page de profil utilisateur comme première route connectée.

#### Points de vigilance

- Les routes où l’utilisateur doit être authentifié ne doivent pas être accessibles sans token.
- Sécurisez le stockage des tokens (évitez le localStorage pour les données sensibles).
- Attention à gérer correctement les cas d'erreur (mauvais identifiants, compte inexistant).

#### Ressources

- [Comment mettre en place de l’authentification avec NextJS](https://nextjs.org/docs/pages/guides/authentication)

### Étape 5 - Intégrez les maquettes

#### Résultat attendu

- L’ensemble de l’interface intégrée, excepté la génération de tâches automatique et la page d’authentification.

#### Recommandations

- Vous pouvez procéder étape par étape pour cette intégration.
- Vous pouvez par exemple commencer par intégrer la gestion des projets.
- Puis vous pouvez intégrer la gestion des tâches.
- Et ensuite, intégrez les différents tableaux de bord, les filtres, et les vues.
- N’hésitez pas à utiliser des librairies externes de composants, par exemple pour les modales, ou pour implémenter des toasts de notification.

#### Points de vigilance

- Assurez-vous de pouvoir justifier l’utilisation de chaque librairie externe.
- **Implémentez la logique métier avant de vous concentrer sur le design** pour éviter de vous perdre dans les détails visuels.

#### Ressources

- [Les maquettes de l’application](https://www.figma.com/design/4dE90dtmpQNUS05IGd9HxT/Abricot?node-id=0-1&p=f&t=bMvwdRP0k1voe2l4-0)
- [Le document de spécifications fonctionnelles](https://course.oc-static.com/paths/2631+DA+Full-stack/DA+Full-stack+P7+-+Spe%CC%81cifications+Fonctionnelles+_+Application+de+Gestion+de+Projet+Collaboratif+\(SaaS\).pdf)

### Optionnel - Allez plus loin sur ce projet

Si vous souhaitez aller plus loin sur ce projet, voici quelques pistes à mettre en œuvre. Pensez à prioriser et ne vous lancer dans ces tâches seulement s’il vous reste du temps pour finaliser votre formation.

- Vous pourriez mettre en place une authentification OAuth, mais pour cela, il faudrait mettre les mains dans le backend.
- Mettre en œuvre des tests end-to-end: une application comportant des tests sera toujours plus fiable et professionnelle.
- Déployez le site sur un hébergeur afin de pouvoir y accéder de n’importe où, et notamment le montrer aux recruteurs.
- Vous pouvez pousser l’interface plus loin:
- en implémentant un système de drag and drop sur la vue Kanban,
	- vous pourriez aussi implémenter un autocomplete sur la sélection de contributeurs
- Ce projet peut également être l’occasion de mettre en place des librairies de composants, de state management afin de les mettre en pratique. Vous pourriez par exemple utiliser Redux, Zustand, React Query, Tailwind, etc.

### Vérifiez votre travail et faites le point avec votre mentor

Pour vérifier que vous n’avez rien oublié dans la réalisation de votre exercice, téléchargez et complétez [la fiche d’autoévaluation](https://course.oc-static.com/paths/2631+DA+Full-stack/DA+Full-Stack+P7+-+Option+B+Sce%CC%81nario+-+Fiche+d'auto-e%CC%81valuation.pdf).

Parlez-en avec votre mentor durant votre dernière session de mentorat.

[Avez-vous une suggestion pour nous?](https://openclassrooms.tfaforms.net/4984649?tfa_19=10066994&tfa_13=2631&tfa_15=3965&tfa_17=8373)