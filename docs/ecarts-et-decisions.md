# Registre des écarts et décisions

Ce registre recense chaque écart avec le sujet, les maquettes ou le backend fourni, ainsi que les choix techniques ou produit qui demandent une justification en soutenance. Il complète `DESIGN.md`, `docs/ARCHITECTURE.md` et les ADR, qui détaillent la mise en œuvre.

Chaque entrée indique la référence d'origine, l'écart ou le choix, sa justification et le ticket concerné. Une entrée est ajoutée dans le même changement que la décision ; elle n'est jamais supprimée, seulement marquée « remplacée par … » si la décision évolue.

Types : **Maquette** (écart visuel ou fonctionnel avec `sujet/maquette`), **Sujet** (écart avec `sujet/`), **Backend** (incohérence du backend fourni, conservé sans modification), **Choix** (décision technique ou produit sans écart imposé).

## Authentification et session

### D01 — Authentification directe avec JWT en `sessionStorage` (Choix, #4)

- **Référence** : backend Express (`data.token`, `Authorization: Bearer`) ; sujet (éviter `localStorage` pour les données sensibles).
- **Décision** : le frontend appelle Express directement et conserve le JWT dans `sessionStorage` pour l'onglet courant. Le BFF Next.js avec cookie HttpOnly initialement prévu est suspendu.
- **Justification** : Express ne crée ni ne lit de cookie ; un BFF ajoutait une couche de traduction des requêtes. `sessionStorage` limite la durée de vie du token à l'onglet. Limite assumée : le token est lisible par le JavaScript (risque XSS).
- **Détails** : [ADR 0001](adr/0001-direct-express-authentication.md).

### D02 — Garde des pages côté navigateur uniquement (Choix, #5)

- **Référence** : sujet (routes privées inaccessibles sans token).
- **Décision** : `AppShell` masque l'application et redirige vers `/login` si l'onglet n'a pas de token. Le HTML rendu par le serveur n'est pas protégé et le JWT n'est pas vérifié localement.
- **Justification** : un Server Component ne peut pas lire `sessionStorage`. Express reste l'autorité : aucune donnée n'est servie sans JWT valide.

### D03 — Traitement commun des réponses `401` (Choix, #5)

- **Décision** : `authenticatedFetch` efface la session sur toute réponse `401` et la page de connexion explique l'expiration (`/login?reason=session-expired`).
- **Justification** : un seul point de gestion pour toutes les pages ; exception documentée en B01.

### D04 — CORS limité à `localhost` (Backend, #4)

- **Référence** : configuration CORS d'Express (`localhost:8000`, `localhost:8001` ; `https://votre-domaine.com` en production).
- **Décision** : le frontend tourne sur `localhost:8001`. Depuis Windows avec WSL, ouvrir `http://localhost:8001`, pas l'adresse IP de WSL.
- **Justification** : le backend n'est pas modifié. Le domaine de production demandera une décision avant déploiement.

## Structure et navigation

### D05 — Pas de page de présentation : `/` est le tableau de bord (Maquette, #5)

- **Référence** : aucune maquette ni spécification de page d'accueil publique.
- **Décision** : la page de présentation initiale est supprimée. `/` affiche le tableau de bord ; sans session, l'utilisateur arrive sur la connexion.
- **Justification** : fidélité au sujet, qui commence par la connexion puis le tableau de bord.

### D06 — Page 404 Abricot (Maquette, #5)

- **Référence** : aucune maquette de page 404 ; exigée par le ticket du shell.
- **Décision** : page publique avec logo, titre et retour au tableau de bord, dans l'identité Abricot.

### D07 — « Mon compte » et la déconnexion dans un menu sur l'avatar (Maquette, #6)

- **Référence** : `Dashboard.png`, `Projets.png`, `Mon compte.png` (avatar « AD » sans lien « Mon compte » ni bouton de déconnexion).
- **Décision** : la navigation contient seulement « Tableau de bord » et « Projets ». L'avatar affiche les initiales réelles et ouvre un menu `DropdownMenu` avec « Mon compte » et « Se déconnecter ».
- **Justification** : la déconnexion est indispensable mais absente des maquettes ; le menu la rend accessible sans ajouter d'élément visible à l'en-tête.

### D08 — Avatar actif en `link` au lieu de `primary` (Maquette, #6)

- **Référence** : `Mon compte.png` (avatar orange `#D3590B`, initiales blanches).
- **Décision** : sur `/account`, l'avatar utilise `#AD4706` (`link`).
- **Justification** : blanc sur `#D3590B` donne environ 4,0:1, sous le seuil AA de 4,5:1 pour des initiales de 14 px ; `#AD4706` donne environ 5,7:1.

### D09 — Textes orange en `link` (`#AD4706`) (Maquette, #3)

- **Référence** : orange de marque `#D3590B` utilisé pour des textes dans les maquettes.
- **Décision** : l'orange de marque reste réservé aux pictogrammes et accents ; les textes orange utilisent `#AD4706`.
- **Justification** : `#D3590B` atteint 4,04:1 sur blanc, insuffisant pour du texte normal (AA 4,5:1).

### D29 — Salutation seulement sur le tableau de bord (Maquette, #10)

- **Référence** : `Dashboard.png` (« Bonjour Alice Dupont, voici un aperçu de vos projets et tâches » sous le titre) ; autres maquettes sans salutation ; recette du porteur du projet.
- **Décision** : retirer « Bonjour … » du shell, qui l'affichait sur toutes les pages. Le tableau de bord affiche la phrase de la maquette sous son titre ; sans nom, « Voici un aperçu de vos projets et tâches ».
- **Justification** : suivre les maquettes ; une salutation répétée sur chaque page n'apporte pas d'information.

## Inscription et connexion

### D10 — Champ « Nom » obligatoire à l'inscription (Maquette + Backend, #4)

- **Référence** : `Sign In.png` (e-mail et mot de passe seulement) ; Swagger (nom obligatoire) ; contrôleur Express (nom optionnel).
- **Décision** : champ « Nom » obligatoire, au moins deux caractères.
- **Justification** : le nom sert à l'affichage (initiales, membres, assignations) ; décision du porteur du projet face à la contradiction Swagger/code.

### D11 — Pas de lien « Mot de passe oublié ? » (Maquette, #4)

- **Référence** : `Log In.png`.
- **Justification** : aucun endpoint de réinitialisation dans le backend ; un lien inactif serait trompeur.

## Compte

### D12 — Un seul champ « Nom » au lieu de « Nom » et « Prénom » (Maquette, #6)

- **Référence** : `Mon compte.png` ; backend `User.name` (champ unique, optionnel).
- **Décision** : un seul champ « Nom », lié à `name`.
- **Justification** : découper un nom unique au premier espace casse les prénoms composés ; cohérent avec l'inscription (D10).

### D13 — Deux formulaires indépendants (Maquette, #6)

- **Référence** : `Mon compte.png` (un seul champ mot de passe, un seul bouton) ; Express `PUT /auth/profile` et `PUT /auth/password` (mot de passe actuel requis).
- **Décision** : formulaire « Informations » (nom, e-mail) et formulaire « Mot de passe » (actuel, nouveau, confirmation locale), chacun avec son bouton.
- **Justification** : deux endpoints distincts ; un bouton unique ferait deux requêtes non atomiques avec des résultats partiels difficiles à expliquer.

## Incohérences du backend (backend conservé sans modification)

### B01 — `401` pour un mot de passe actuel incorrect (Backend, #6)

- **Référence** : `authController.ts` (`updatePassword`, code `INVALID_CURRENT_PASSWORD`, statut `401`).
- **Impact** : le traitement commun des `401` (D03) déconnecterait l'utilisateur après une simple faute de saisie.
- **Décision** : `authenticatedFetch` conserve la session pour ce seul code d'erreur ; le formulaire affiche l'erreur sur le champ. Tous les autres `401` déconnectent.

### B02 — Réponse de `GET /auth/profile` différente du Swagger (Backend, #5)

- **Référence** : Swagger (`data` = utilisateur) ; contrôleur (`data.user`).
- **Décision** : le frontend suit le contrôleur réel et valide la réponse à l'exécution.

### B03 — E-mail déjà utilisé en `409` (Backend, #6)

- **Référence** : `updateProfile` renvoie `409 EMAIL_ALREADY_EXISTS`.
- **Décision** : l'erreur est affichée sur le champ e-mail à partir du code réel.

### B04 — Message de validation du mot de passe incomplet (Backend, #6)

- **Référence** : `validation.ts` (le message ne mentionne ni le symbole obligatoire ni les caractères autorisés, contrairement à la regex).
- **Décision** : le frontend applique exactement la regex d'Express et affiche toutes les règles avant la saisie.

### B05 — Nom vide refusé malgré le code de mise à jour (Backend, #6)

- **Référence** : `validateUpdateProfileData` refuse un nom vide, alors que `updateProfile` prévoit `name.trim() || null`.
- **Décision** : l'interface ne propose pas d'effacer un nom existant.

## Choix techniques

### T01 — TanStack Query pour les données distantes (Choix, #6)

- **Référence** : spécification #18.
- **Décision** : introduit au deuxième usage réel (profil partagé entre le shell et le compte). Le provider ne couvre que les pages de l'application et disparaît à la déconnexion.

### T02 — Primitives shadcn/ui adaptées à Abricot (Choix, #3, #6)

- **Décision** : tout contrôle fourni par shadcn/ui (`Button`, `Input`, `Label`, `DropdownMenu`…) passe par sa primitive, adaptée aux tokens Abricot et réduite aux parties utilisées.
- **Justification** : comportements accessibles éprouvés (focus, clavier, ARIA) et cohérence visuelle. Le CLI a importé un paquet npm `cn` erroné et le thème générique : corrigés manuellement.

### T03 — Groupes de routes `(app)` et `(auth)` (Choix, #5)

- **Décision** : les pages de l'application sont sous `(app)` avec le shell commun ; les pages publiques de connexion et d'inscription sont l'exception, sous `(auth)`.

### T04 — Polices Inter et Manrope chargées localement (Choix, #3)

- **Référence** : polices confirmées par le porteur du projet.
- **Décision** : chargement via `@fontsource`, sans requête vers un service externe.

## Projets accessibles

### D14 — Une lecture des tâches par carte pour la progression (Choix + Backend, #7)

- **Référence** : `src/backend/src/controllers/projectController.ts` (`getProjects`) ; réponses réelles `GET /projects` et `GET /projects/:id/tasks`.
- **Décision** : TanStack Query lit la liste sous `['projects']` puis les tâches de chaque projet sous `['projects', id, 'tasks']`, via le transport authentifié et avec validation Zod.
- **Justification** : `_count.tasks` indique seulement le nombre total de tâches ; aucun compteur terminé n'est fourni. Ce coût N+1 est assumé pour une progression réelle, sans donnée fictive ni modification du backend. Chaque progression a son propre chargement et sa propre erreur ; les autres informations et le lien restent disponibles.
- **Alternative** : ajouter ultérieurement des compteurs agrégés au contrat backend réduirait le volume et le nombre de requêtes, mais exigerait une décision explicite.
- **Détails** : [architecture](ARCHITECTURE.md#projets-accessibles).

### D15 — Tâches annulées exclues de la progression (Choix, #7)

- **Référence** : `src/backend/prisma/schema.prisma`, statuts `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED` ; maquette `Projets.png` (pourcentage et tâches terminées).
- **Décision** : progression = tâches `DONE` / tâches non `CANCELLED`, pourcentage arrondi à l'entier le plus proche. Zéro tâche éligible donne 0 % et « Aucune tâche ».
- **Justification** : une tâche annulée n'est plus un travail à terminer. Utiliser `_count.tasks` comme total empêcherait certains projets d'atteindre 100 %. Une fonction pure et ses tests rendent cette règle explicite.

### D16 — Création absente jusqu'au ticket dédié (Maquette, #7)

- **Référence** : `sujet/maquette/Projets.png`, bouton « + Créer un projet » ; ticket #8.
- **Décision** : ne pas afficher le bouton de création dans #7. L'état vide explique que les projets apparaissent quand le lecteur en crée un ou est ajouté comme contributeur.
- **Justification** : la création appartient au ticket #8 ; un bouton inactif ou une fausse action serait trompeur. Le critère « action adaptée » du ticket est donc satisfait par une explication des conditions d'accès, sans action de création tant qu'elle n'existe pas.

### D17 — Détail limité aux informations du projet (Maquette, #7)

- **Référence** : `sujet/maquette/Single projet.png` ; tickets #9 et #10.
- **Décision** : chaque carte ouvre `/projects/[id]` avec le nom, la description et le retour « Mes projets ». Un texte annonce honnêtement que les vues de tâches arriveront au ticket #10.
- **Justification** : #7 garantit l'ouverture autorisée ; gestion du projet et vues de tâches sont des fonctionnalités distinctes. Aucun contrôle de modification, création de tâche ou IA ni contenu de tâche fictif n'est ajouté.

### D18 — Équipe accessible et rôle du lecteur explicite (Maquette + Choix, #7)

- **Référence** : `Projets.png` (initiales, badge « Propriétaire », « Équipe (3) ») ; `GET /projects` (`owner`, `members`, `userRole`).
- **Décision** : l'équipe compte le propriétaire plus les membres, dans cet ordre. Chaque avatar possède un nom accessible et un titre avec le nom ou l'e-mail de la personne et son rôle ; les initiales sont décoratives. Le lecteur voit son rôle, avec comparaison de `data.user.id` du profil à `owner.id` pour distinguer propriétaire et membre `ADMIN`. Cet identifiant stable évite une mauvaise classification après un changement d'e-mail pendant la durée du cache.
- **Justification** : le propriétaire n'est pas dans `members` et `ADMIN` ne signifie pas toujours propriétaire. La couleur seule ou des initiales seules ne distinguent pas suffisamment les personnes et permissions.
- **Détails** : la fonction d'initiales existante est partagée entre shell et cartes à ce deuxième usage réel, sans seconde convention.

### D19 — Primitives et contraste des cartes Abricot (Choix + Maquette, #7)

- **Statut** : remplacée par D21 pour le badge propriétaire ; l'adaptation des primitives et des tokens reste applicable.
- **Référence** : `Projets.png`, règle shadcn/ui du projet ; tokens de `DESIGN.md` et `src/frontend/src/app/globals.css`.
- **Décision** : ajouter seulement `Avatar`/`AvatarFallback`, `Badge` et `Progress`, adaptés aux tokens Abricot et au `cn` local. Les badges utilisent le fond `brand-soft` (`#FFE8D9`) et le texte `link` (`#AD4706`), pas l'orange brut.
- **Justification** : réutiliser les comportements accessibles de Radix et les dépendances existantes sans thème générique ni paquet supplémentaire. Le texte orange brut n'atteint pas AA ; le token `link` sur `brand-soft` atteint 4,84:1 (calcul de luminance WCAG), au-dessus du seuil AA de 4,5:1. La barre a un nom accessible ; le pourcentage et le compte de tâches ne reposent pas sur la couleur.

### D20 — Grille responsive et carte à lien unique (Choix, #7)

- **Référence** : `Projets.png`, grille desktop à trois colonnes et intervalles proches de 16 px.
- **Décision** : une colonne mobile, deux à 768 px, trois à 1024 px ; chaque carte est un seul lien nommé par son `h2`, sans interaction imbriquée et avec un focus clavier visible.
- **Justification** : conserver la hiérarchie de la maquette et l'ordre de lecture sans débordement horizontal, tout en donnant la même ouverture au clavier et au pointeur.

### B06 — Projet inexistant et projet inaccessible renvoyés en `403` (Backend, #7)

- **Référence** : `src/backend/src/controllers/projectController.ts:341-345` (contrôle d'accès avant lecture), `:391-394` (branche `404`) ; `src/backend/src/utils/permissions.ts` (`hasProjectAccess`). API réelle : Alice reçoit `403 FORBIDDEN` pour `/projects/nonexistent-project` et pour un projet réel accessible à Bob mais pas à Alice (« Dashboard Analytics »).
- **Impact** : le frontend ne peut pas déterminer si un projet refusé existe. Le `404` du contrôleur ne couvre pas normalement un identifiant déjà absent au contrôle d'accès.
- **Décision** : backend inchangé. Pour `403` comme `404`, afficher « Ce projet n'existe pas ou vous n'y avez pas accès. » avec le retour « Mes projets ».
- **Justification** : message fidèle à l'information disponible, qui évite aussi de révéler l'existence d'un projet.
- **Options** : conserver ce refus neutre (choix retenu) ; ou modifier ultérieurement l'ordre des contrôles backend pour un `404` distinct, au prix d'une information d'existence supplémentaire et d'un changement de contrat.

### D21 — Repère propriétaire compact sans gros badge (Maquette, #7)

- **Statut** : complétée par D22 pour la hiérarchie visuelle et la position de la couronne.
- **Référence** : `Projets.png`, gros badge « Propriétaire » ; demande explicite du porteur du projet pendant la réalisation du ticket.
- **Décision** : remplacer le badge par une petite couronne `link` à côté de l'avatar propriétaire. Retirer la primitive `Badge`, devenue inutilisée. Le nom accessible et le titre de l'avatar conservent le nom réel et « Propriétaire » ; les autres avatars annoncent leur rôle.
- **Justification** : simplifier l'équipe et réduire l'encombrement, tout en distinguant le propriétaire autrement que par la couleur (forme de couronne et rôle accessible). Les cartes conservent le texte « Votre rôle » pour le lecteur.
- **Remplace** : D19 pour l'affichage du badge propriétaire.

### D22 — Avatars des membres gris et couronne au-dessus du propriétaire (Maquette, #7)

- **Référence** : demandes explicites du porteur du projet après simplification du badge (D21) ; `Projets.png` (avatars membres gris).
- **Décision** : conserver l'avatar propriétaire en `brand-soft`, utiliser `border` (`#E5E7EB`) pour les avatars des autres membres et centrer la petite couronne `link` au-dessus de l'avatar propriétaire.
- **Justification** : rendre la hiérarchie de l'équipe immédiatement lisible sans réintroduire le gros badge. La couronne et les rôles accessibles complètent la différence de couleur ; les initiales conservent le texte sombre.
- **Complète** : D21.

## Détail d'un projet

### D23 — Consultation sans actions hors périmètre (Maquette + Choix, #10)

- **Référence** : `Single projet.png` ; tickets #9, #11, #12 et #16 ; ticket #10 excluant recherche et filtres.
- **Décision** : afficher l'en-tête, les contributeurs et les tâches réelles avec commentaires dépliables en lecture seule. Ne pas afficher « Modifier », « Créer une tâche », « IA », le menu « … », Liste/Calendrier, le filtre Statut, la recherche ni l'ajout de commentaire.
- **Justification** : ces contrôles relèvent d'autres tickets ou sont hors périmètre ; une action fictive ou désactivée donnerait une promesse trompeuse. Le dépliage donne accès au détail utile déjà reçu, sans route de tâche inventée.
- **Remplace** : D17 pour le détail minimal du ticket #7.

### D24 — Jour calendaire conservé et année toujours visible (Choix + Maquette, #10)

- **Référence** : `Single projet.png` (« 9 mars ») ; `Task.dueDate` (`DateTime?`) et réponses ISO d'Express, dont les échéances du seed en 2024.
- **Décision** : formater le jour calendaire transmis par l'API, sans conversion au fuseau du navigateur, avec mois français et année systématique. L'absence d'échéance affiche « Aucune échéance ». Les dates des commentaires suivent le même affichage de jour.
- **Justification** : éviter le recul de date d'une échéance à minuit UTC pour un utilisateur à l'ouest d'UTC ; l'année évite de faire passer les tâches anciennes pour des échéances de l'année courante. L'utilitaire existant est étendu et les limites de jour sont testées.

### D25 — Commentaires réels dans un dépliable accessible (Choix, #10)

- **Référence** : `taskController.ts:274-285`, `taskComments.ts:8-29` ; `Single projet.png`, ligne « Commentaires (n) ».
- **Décision** : compter le tableau `comments` reçu et afficher ses auteurs, dates et contenus via `Collapsible` shadcn/ui ajouté par le CLI. Conserver l'ordre chronologique du backend et afficher « Aucun commentaire. » si vide.
- **Justification** : la réponse contient déjà les commentaires complets ; aucun appel supplémentaire, faux contenu, commentaire modifiable ou compteur estimé n'est nécessaire. Radix gère le clavier et `aria-expanded` ; les noms sont visibles, les initiales décoratives.

### D26 — Contributeurs nommés et cartes sur une colonne (Maquette + Choix, #10)

- **Référence** : `Single projet.png` (barre de contributeurs et cartes empilées) ; réponse `getProject`, propriétaire séparé des membres.
- **Décision** : compter le propriétaire et les membres, afficher le propriétaire en premier avec son nom et la couronne de D28, puis les noms ou e-mails des membres. Garder les tâches sur une seule colonne à toutes les tailles ; les noms et métadonnées peuvent se replier.
- **Justification** : la barre du détail est plus informative que les avatars compacts des cartes de projets. Aucun nom ou rôle propriétaire n'est déduit du statut `ADMIN`. Les listes sémantiques et titres `h1/h2/h3` conservent un ordre de lecture accessible sans largeur fixe.

### D27 — Badges de statut en couleurs contrastées (Maquette + Choix, #10)

- **Référence** : `Single projet.png` (rose, ambre et vert) ; WCAG 2.1 AA ; `DESIGN.md`.
- **Décision** : normaliser les tokens texte/fond des trois statuts obligatoires ; afficher « À faire », « En cours », « Terminée » avec contraste respectif 6,68:1, 6,15:1 et 6,49:1. « Annulée » reste neutre (`text` sur `border`, 13,31:1).
- **Justification** : conserver les familles visuelles sans reproduire des textes pastel peu lisibles ; chaque statut est textuel, jamais communiqué par sa seule couleur.

### D28 — Couronne propriétaire dans toutes les vues (Maquette, #10)

- **Référence** : `Single projet.png` et `Projets.png` (badge « Propriétaire ») ; D21–D22 ; demande du porteur du projet après la recette du détail.
- **Décision** : le badge texte « Propriétaire » de la barre de contributeurs est remplacé par la couronne des cartes de projets. Cette règle s'applique à toutes les vues, présentes et futures : composant partagé `OwnerCrown`, rôle donné en texte accessible (`sr-only` dans le détail).
- **Justification** : un seul repère visuel du propriétaire dans toute l'application ; la règle est inscrite dans `DESIGN.md` pour les tickets suivants.
- **Complète** : D21–D22 ; **modifie** : D26.

### B07 — Tri alphabétique des priorités backend (Backend, #10)

- **Référence** : `src/backend/src/controllers/taskController.ts:254-271`, `src/backend/prisma/schema.prisma:66-68`. Réponse réelle `GET /projects/:id/tasks` du projet E-commerce : `MEDIUM` avant `HIGH`.
- **Impact** : le tri décroissant de la chaîne `priority`, puis de `createdAt`, ne correspond pas à « Par ordre de priorité » au sens métier.
- **Décision** : backend inchangé ; trier côté client une copie selon `URGENT > HIGH > MEDIUM > LOW`, puis par échéance croissante, valeurs nulles en dernier ; conserver l'ordre reçu en cas d'égalité. Sous-titre : « Par ordre de priorité, puis d’échéance ».
- **Justification** : ordre explicite et testé, sans mutation du cache partagé avec la progression des projets. Aucun filtre ne masque les tâches.

### B08 — Statut supplémentaire `CANCELLED` conservé (Backend + Sujet, #10)

- **Référence** : `src/backend/prisma/schema.prisma:66`, `src/backend/src/utils/validation.ts` ; le sujet ne cite que « À faire », « En cours » et « Terminée ».
- **Impact** : masquer ou transformer les tâches annulées ferait perdre une information réelle du projet.
- **Décision** : backend inchangé ; afficher toutes les tâches `CANCELLED` avec le badge neutre « Annulée », au même endroit dans le tri que les autres tâches. La progression conserve sa règle distincte D15.
- **Justification** : décision conservatrice demandée par le porteur du projet : exposer les données réelles sans inventer une correspondance avec un des trois statuts obligatoires.
