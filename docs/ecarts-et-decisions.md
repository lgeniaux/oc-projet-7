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

### D30 — Curseur main sur tous les contrôles cliquables (Choix, #10)

- **Référence** : recette du porteur du projet (dépliage des commentaires, menu de l'avatar) ; Tailwind 4 garde le curseur par défaut sur les boutons.
- **Décision** : une règle de base dans `globals.css` applique `cursor: pointer` à `button` et `[role="button"]` actifs.
- **Justification** : retour visuel attendu par la souris, sans répéter une classe sur chaque composant ; les états désactivés gardent leur curseur dédié.

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

- **Statut** : remplacée par D31 au ticket #8.

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
- **Statut** : complétée par D38 au ticket #9 pour « Modifier », par D43 et D48 au ticket #11 pour « Créer une tâche » et le menu « … », puis par D50–D53 au ticket #12 pour la lecture et l'ajout de commentaires ; les autres actions restent hors périmètre.
- **Décision** : afficher l'en-tête, les contributeurs et les tâches réelles avec commentaires dépliables en lecture seule. Ne pas afficher « Modifier », « Créer une tâche », « IA », le menu « … », Liste/Calendrier, le filtre Statut, la recherche ni l'ajout de commentaire.
- **Justification** : ces contrôles relèvent d'autres tickets ou sont hors périmètre ; une action fictive ou désactivée donnerait une promesse trompeuse. Le dépliage donne accès au détail utile déjà reçu, sans route de tâche inventée.
- **Remplace** : D17 pour le détail minimal du ticket #7.

### D24 — Jour calendaire conservé et année toujours visible (Choix + Maquette, #10)

- **Référence** : `Single projet.png` (« 9 mars ») ; `Task.dueDate` (`DateTime?`) et réponses ISO d'Express, dont les échéances du seed en 2024.
- **Décision** : formater le jour calendaire transmis par l'API, sans conversion au fuseau du navigateur, avec mois français et année systématique. L'absence d'échéance affiche « Aucune échéance ». Les dates des commentaires suivent le même affichage de jour.
- **Justification** : éviter le recul de date d'une échéance à minuit UTC pour un utilisateur à l'ouest d'UTC ; l'année évite de faire passer les tâches anciennes pour des échéances de l'année courante. L'utilitaire existant est étendu et les limites de jour sont testées.

### D25 — Commentaires réels dans un dépliable accessible (Choix, #10)

- **Référence** : `taskController.ts:274-285`, `taskComments.ts:8-29` ; `Single projet.png`, ligne « Commentaires (n) ».
- **Statut** : complétée par D50–D53 au ticket #12 pour l'extraction et l'ajout ; le contrat de lecture reste inchangé.
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

## Création d'un projet

### D31 — Création depuis la liste et modale accessible (Maquette + Choix, #8)

- **Statut** : remplacée en partie par D59 au ticket #14 : le dashboard propose aussi la création ; le reste de la décision s'applique.
- **Référence** : `Projets.png`, `Dashboard.png`, `Modale création projet.png` ; périmètre explicite du ticket.
- **Décision** : ajouter le bouton avec plus décoratif uniquement sur `/projects`, même si le dashboard possède également ce bouton dans sa maquette. Il reste disponible dans les états vide, chargement et erreur. La modale utilise `Dialog` shadcn/ui adapté à Abricot, avec fermeture X nommée en français, focus contenu, Échap, retour du focus et défilement interne responsive.
- **Justification** : le parcours de liste permet immédiatement la création sans étendre le ticket au dashboard. Radix fournit les comportements clavier plutôt qu'un contrôle artisanal. Les primitives inutilisées du générateur et son import erroné `cn` sont retirés ; aucun paquet supplémentaire n'est conservé.
- **Remplace** : D16.

### D32 — Description facultative et limites réelles (Maquette + Backend, #8)

- **Référence** : `Modale création projet.png` marque titre et description obligatoires ; `src/backend/src/utils/validation.ts:194-215`.
- **Décision** : seul « Titre » porte un astérisque. Il contient entre 2 et 100 caractères après suppression des espaces de début et de fin ; la description est facultative et limitée à 500 caractères après la même normalisation. Une description vide est omise à la création et envoyée avec `""` à la modification (B14). `Textarea` shadcn/ui remplace le champ court de la maquette et permet une saisie multiligne.
- **Justification** : ne pas imposer de contrainte métier absente d'Express ; rendre les limites visibles avant envoi et conserver une description lisible.

### D33 — Recherche simple et liste de contributeurs (Maquette + Choix, #8)

- **Référence** : dropdown de `Modale création projet.png` ; ticket #8 excluant une autocomplétion complexe ; `projectController.ts:717-770`.
- **Décision** : champ de recherche par e-mail ou nom, délai de 300 ms, minimum deux caractères, clé `['users', 'search', query]`, cache frais 30 secondes, signal d'annulation et réponses validées par Zod. Liste de dix résultats maximum avec boutons « Ajouter » ; sélections avec boutons « Retirer ». Exclure le profil courant par identifiant et les personnes déjà choisies ; attendre le profil avant la recherche. Les résultats antérieurs ne restent pas affichés lors d'une nouvelle recherche ou d'une erreur.
- **Justification** : conserver un parcours clavier simple sans combobox ni dépendance supplémentaire, tout en présentant aide, chargement, vide, erreur avec relance et compteur annoncé poliment. L'API inclut le lecteur dans les résultats : appel réel `query=alice` authentifié comme Alice.

### D34 — Aucun choix de rôle à la création (Backend + Choix, #8)

- **Référence** : `projectController.ts:113-118,160-165` ; spécifications fonctionnelles §2 ; décision D39 au ticket #9.
- **Décision** : Express définit le propriétaire à partir du JWT ; tous les membres choisis sont des contributeurs. L'interface l'explique, sans sélecteur `ADMIN`.
- **Justification** : le corps de création n'accepte pas de rôle et impose `CONTRIBUTOR`. Ne pas proposer une permission impossible à enregistrer. D39 confirme l'absence de gestion des rôles dans l'administration du projet.

### D35 — Validation explicite à la soumission (Maquette + Choix, #8)

- **Référence** : bouton grisé à vide de `Modale création projet.png` ; exigences WCAG du sujet.
- **Décision** : « Ajouter un projet » reste actif avant validation ; il est désactivé uniquement pendant l'envoi. Les champs sont également désactivés pendant l'envoi. Les erreurs sont françaises, annoncées et reliées aux champs ; le premier champ invalide reçoit le focus.
- **Justification** : un bouton désactivé à vide n'explique pas les champs attendus aux utilisateurs clavier ou de lecteur d'écran. Les règles locales correspondent au contrat réel, Express restant l'autorité.

### D36 — Convention de mutation existante conservée (Choix, #8)

- **Référence** : ticket #8 (« mutation et invalidation TanStack Query ») ; `modules/account/profile-form.tsx` et architecture des formulaires.
- **Décision** : conserver `handleSubmit` RHF → `authenticatedFetch` → validation Zod → `invalidateQueries({ queryKey: ['projects'] })`, avec erreurs locales et `isSubmitting`, sans ajouter `useMutation`.
- **Justification** : une seule convention de soumission dans le projet ; TanStack Query conserve son rôle de lecture partagée et d'invalidation, sans doubler l'état RHF. Les erreurs `400` reconnues sont reliées au titre, à la description ou au sélecteur ; les erreurs génériques gardent le formulaire.

### D37 — Confirmation sur la page et avertissement de membres (Choix, #8)

- **Référence** : critères #8 (succès visible, liste actualisée sans rechargement) ; absence de toast dans le socle.
- **Décision** : vider le formulaire, fermer la modale, rendre le focus au déclencheur et afficher « Projet « X » créé. » dans une région `role="status"`. Comparer les e-mails sélectionnés aux membres retournés et lister les absents sans annuler le succès. Une fermeture volontaire pendant l'envoi ne l'annule pas ; son état puis son résultat restent visibles sur la page et une nouvelle ouverture attend la fin de l'envoi.
- **Justification** : confirmation persistante sans dépendance de toast, absence de fausse réussite d'association et absence de seconde création involontaire. L'invalidation de `['projects']` actualise la liste ; une panne de relecture ne transforme pas la création réussie en échec.

### B09 — Contributeurs inconnus ou non créés ignorés silencieusement (Backend, #8)

- **Référence** : `src/backend/src/controllers/projectController.ts:142-173` (sélection des e-mails existants, rôle imposé, erreurs de création de membres ignorées).
- **Impact** : `201` ne garantit pas l'association de toutes les personnes demandées ; un e-mail inconnu est ignoré sans erreur. Une disparition ou modification du compte entre recherche et création reste possible.
- **Décision** : backend inchangé. Envoyer uniquement les e-mails choisis dans les résultats réels, puis vérifier les membres retournés et afficher les e-mails manquants dans un avertissement non bloquant.
- **Justification** : neutraliser l'erreur de saisie libre sans prétendre garantir l'atomicité qu'Express n'offre pas. Ni nouvelle tentative automatique, ni nouvelle création du projet.

### B10 — Absence de `userRole` dans la réponse de création (Backend, #8)

- **Référence** : `projectController.ts:175-209` ; schéma de lecture existant `modules/projects/project-query.ts`.
- **Impact** : le schéma de lecture d'un projet exige `userRole`, mais `POST /projects` ne le renvoie pas.
- **Décision** : dériver un schéma de création du schéma existant en omettant seulement `userRole` ; invalider les lectures au lieu d'inventer ce champ dans la réponse.
- **Justification** : suivre le contrat réel sans modifier le backend ni assouplir les réponses de lecture.

## Administration d'un projet

### D38 — Actions visibles selon les permissions réelles (Choix, #9)

- **Référence** : `Single projet.png`, lien « Modifier » ; permissions Express ; décision du porteur du projet.
- **Décision** : afficher « Modifier » au propriétaire et aux membres `ADMIN`. Réserver « Supprimer le projet » au propriétaire. Les contributeurs et les profils en chargement ou indisponibles ne voient aucune de ces actions. Les actions sont masquées, jamais désactivées faute de permission.
- **Justification** : `userRole: ADMIN` ne distingue pas le propriétaire d'un membre administrateur. `getProjectViewerRole` compare les identifiants et centralise la règle pour les cartes et le détail. Express reste l'autorité lors de chaque écriture.
- **Complète** : D23.

### D39 — Ajouts limités au rôle contributeur (Sujet + Choix, #9)

- **Référence** : spécifications, administrateurs des projets qu'ils ont créés ; décision du porteur du projet.
- **Décision** : ne proposer ni attribution ni modification de rôle. Chaque ajout envoie seulement `{ email }` ; Express applique `CONTRIBUTOR`. L'interface ne crée aucun membre `ADMIN`.
- **Justification** : dans les parcours de l'interface, l'administrateur est le propriétaire. Un membre `ADMIN` préexistant conserve son droit de modification, sans droit de suppression (B11).
- **Complète** : D34.

### D40 — Champs partagés, contrôleurs distincts (Choix, #9)

- **Référence** : `Modale création projet.png`, `Modale modifier projet.png` ; règle d'extraction au deuxième usage.
- **Décision** : partager le schéma `ProjectFields`, ses champs et leur accessibilité dans `ProjectFormFields`. Réutiliser `ContributorPicker` avec une description explicite, `ownerId` et des identifiants `useId`. Le lecteur sélectionné reste visible avec « Vous », sans bouton de retrait. Création et modification gardent leurs propres contrôleurs.
- **Justification** : partager les contraintes et la présentation sans ajouter de formulaire à modes ni mêler des séquences réseau différentes.

### D41 — Enregistrement non atomique et erreurs par personne (Backend + Choix, #9)

- **Référence** : routes séparées `PUT /projects/:id`, `POST /projects/:id/contributors` et `DELETE /projects/:id/contributors/:userId`.
- **Décision** : comparer les membres par identifiant, en protégeant le propriétaire et le lecteur. Enregistrer les champs modifiés, puis les ajouts et enfin les retraits, un par un. Un refus des champs arrête la séquence ; un `403` sur un membre arrête les écritures restantes. Après une écriture, invalider le préfixe `['projects']`. Une erreur partielle garde la modale ouverte et nomme les personnes concernées ; si les champs sont enregistrés, le message le précise.
- **Justification** : Express ne propose pas d'opération atomique. Aucun rollback n'est simulé. La sélection et sa référence repartent des membres relus ; le lecteur peut sélectionner de nouveau les changements échoués. Une relecture échouée permet encore une nouvelle tentative sûre, car `409 USER_ALREADY_MEMBER` vaut succès et retirer un non-membre renvoie `200`.

### D42 — Suppression confirmée dans la modale de modification (Choix, #9)

- **Référence** : `Single projet.png` sans bouton de suppression ; règle de confirmation destructive ; décision du porteur du projet.
- **Décision** : placer une zone séparée après le formulaire, réservée au propriétaire, avec un bouton `outline`. `AlertDialog` shadcn/ui annonce la perte des tâches et commentaires et donne le focus initial à « Annuler ». Pendant la suppression, les deux actions et la fermeture sont bloquées. Après succès, démonter le détail, les tâches et les modales avant d'annuler et de retirer leur cache, retirer le projet de la liste, marquer cette liste périmée sans relecture puis remplacer la route par `/projects`.
- **Justification** : éviter une relecture du projet supprimé et un faux état « Projet inaccessible ». Les annonces utilisent `role="status"` ou `role="alert"`, sans toast, paramètre d'URL ni token de couleur destructif.

### B11 — Suppression réservée au propriétaire (Backend + Sujet, #9)

- **Référence** : spécifications, suppression par les administrateurs ; `permissions.ts`, `canDeleteProject` fondé sur `isProjectOwner`.
- **Impact** : un membre `ADMIN` préexistant peut modifier le projet mais ne peut pas le supprimer.
- **Décision** : backend inchangé ; respecter cette distinction dans l'interface. Aucun membre `ADMIN` n'est créé par l'interface (D39), donc l'administrateur y est en pratique le propriétaire.

### B12 — Assignations conservées après retrait d'un membre (Backend, #9)

- **Référence** : relations Prisma `ProjectMember` et `TaskAssignee` indépendantes ; retrait par `deleteMany`.
- **Impact** : la personne retirée perd l'accès au projet mais reste assignée aux tâches existantes.
- **Décision** : backend inchangé ; ne pas ajouter de nettoyage ni de requêtes d'assignation. Le ticket #11 doit filtrer les assignés qui ne sont plus membres lors de l'édition d'une tâche.

### B13 — Propriétaire accepté comme membre et retrait silencieux (Backend, #9)

- **Référence** : `projectController.ts`, ajout par e-mail sans exclusion du propriétaire et retrait par `deleteMany`.
- **Impact** : l'API peut créer une ligne membre pour le propriétaire ; certains retraits sans ligne correspondante réussissent silencieusement. Un administrateur qui se retire perd son accès.
- **Décision** : backend inchangé ; exclure le propriétaire des résultats et protéger les identifiants du propriétaire et du lecteur dans le calcul des changements. Ne jamais proposer leur retrait.

### B14 — Effacement de description et réponse PUT (Backend, #9)

- **Référence** : validation de `PUT /projects/:id`, contrôleur de mise à jour.
- **Impact** : `description: ""` efface la description, mais `null` provoque une erreur `500`. La réponse de mise à jour n'inclut pas `userRole`.
- **Décision** : envoyer une chaîne vide pour effacer et ne pas remplacer le cache par cette réponse incomplète. Invalider les lectures pour retrouver le contrat complet.

## Gestion des tâches

### D43 — « Créer une tâche » dans la section Tâches (Maquette, #11)

- **Référence** : `Single projet.png` (bouton sombre « Créer une tâche » dans l'en-tête du projet, à côté de « IA ») ; `Modale création de tâche.png`.
- **Décision** : placer le bouton sombre avec un plus décoratif dans l'en-tête de la section « Tâches », à droite du titre (pleine largeur sur mobile). Il reste disponible pendant le chargement, l'erreur et l'état vide de la liste. Le bouton « IA » reste absent (interface IA hors ticket).
- **Justification** : l'action est rattachée à la liste qu'elle modifie et ne dépend pas de la future interface IA ; l'en-tête du projet garde « Modifier » seul.
- **Complète** : D23 pour « Créer une tâche ».

### D44 — Description et échéance obligatoires, jour calendaire conservé (Maquette + Backend, #11)

- **Référence** : `Modale création de tâche.png` (Titre*, Description*, Échéance*) ; `src/backend/src/utils/validation.ts` (`validateCreateTaskData`, `validateUpdateTaskData`) : titre de 2 à 200 caractères, description facultative de 1000 caractères maximum, échéance facultative ; `taskController.ts` (`new Date(dueDate)`).
- **Décision** : titre de 2 à 200 caractères et description de 1 à 1000 caractères après suppression des espaces de début et de fin ; échéance obligatoire. Ces règles s'appliquent aussi à la modification : une tâche existante sans description ou sans échéance doit en recevoir une pour être enregistrée. L'échéance utilise `Input` en `type="date"` ; la valeur `AAAA-MM-JJ` est envoyée à minuit UTC (`toCalendarDateTime`), relue par `formatFrenchCalendarDate` sans conversion de fuseau.
- **Justification** : suivre les astérisques des maquettes, plus strictes que le backend, sans dépasser ses limites. Le contrôle natif est accessible au clavier sans dépendance de calendrier. Minuit UTC garde le même jour dans tous les fuseaux (D24) ; les limites d'année sont testées.

### D45 — Priorité exposée dans les formulaires (Maquette + Backend, #11)

- **Référence** : `Task.priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`, défaut `MEDIUM`) ; maquettes de tâche sans champ priorité ; tri B07.
- **Décision** : ajouter « Priorité » sous « Assigné à », en pastilles radio « Basse », « Moyenne », « Haute », « Urgente », avec « Moyenne » par défaut.
- **Justification** : la liste est triée par priorité ; sans ce champ, toute tâche créée serait « Moyenne » sans moyen de la changer. Décision du porteur du projet.

### D46 — Statut en pastilles radio et tâches annulées (Maquette + Sujet, #11)

- **Référence** : pastilles « À faire », « En cours », « Terminée » des maquettes ; B08 (`CANCELLED`).
- **Décision** : le statut est un groupe radio shadcn/ui (`RadioGroup`) présenté en pastilles aux couleurs des badges, avec une coche et une bordure sur l'option choisie. La création propose les trois statuts du sujet, « À faire » par défaut. La modification propose aussi « Annulée » seulement si la tâche l'est déjà : la valeur est conservée et peut être remplacée par un des trois statuts du sujet.
- **Justification** : un groupe radio annonce le choix unique et se parcourt aux flèches ; la coche évite de reposer sur la couleur. Aucune annulation n'est introduite par l'interface, mais une donnée réelle n'est ni masquée ni transformée silencieusement.

### D47 — Assignés choisis dans un menu à cases (Maquette + Choix, #11)

- **Référence** : liste déroulante « Choisir un ou plusieurs collaborateurs » et « 2 collaborateurs » des maquettes ; `validateProjectMembers` (propriétaire et membres).
- **Décision** : `DropdownMenu` shadcn/ui avec `DropdownMenuCheckboxItem`, qui reste ouvert pour cocher plusieurs personnes. Les options sont le propriétaire puis les membres du projet lus dans le cache du détail (nom et e-mail). Le déclencheur, nommé « Assigné à » suivi de la sélection, affiche les noms choisis au lieu d'un simple nombre.
- **Justification** : primitive existante, accessible au clavier (flèches, Espace, Échap), sans dépendance de combobox. Seules les personnes acceptées par Express sont proposées ; les noms sont plus informatifs qu'un compteur.

### D48 — Menu « … » de la carte et suppression confirmée (Maquette + Choix, #11)

- **Référence** : bouton « … » des cartes de `Single projet.png` ; règle de confirmation destructive ; D42.
- **Décision** : le bouton « … », nommé « Actions de la tâche « titre » », ouvre un menu « Modifier » / « Supprimer ». « Supprimer » ouvre un `AlertDialog` (« Supprimer cette tâche ? », focus initial sur « Annuler », actions bloquées pendant l'envoi). Après succès, la tâche est retirée du cache puis les vues sont invalidées ; « Tâche « titre » supprimée. » est annoncé dans la section et le focus passe sur son titre « Tâches ». Une réponse `404` est traitée comme une tâche déjà supprimée. Après modification, le focus revient sur « … » et « Tâche modifiée. » est annoncé.
- **Justification** : suivre la maquette sans multiplier les boutons par carte ; ne jamais laisser le focus sur un élément retiré du document.

### D49 — Champs modifiés seulement et invalidations des vues de tâches (Choix, #11)

- **Référence** : convention D36 ; clés `['projects', id, 'tasks']`, `['projects']` et `['dashboard']`.
- **Décision** : conserver `handleSubmit` → `authenticatedFetch` → Zod, sans `useMutation`. La modification compare le formulaire à la tâche et envoie dans `PUT /projects/:id/tasks/:taskId` seulement les champs changés. Après chaque écriture, invalider les tâches du projet, la liste des projets (compteur de tâches, sans relecture si elle n'est pas affichée) et le préfixe `['dashboard']`. Les erreurs `400` sont reliées aux champs (titre, description, échéance, priorité, statut, assignés) ; `403`, `404` et les pannes donnent un message français et conservent les saisies. X, Échap et le clic extérieur ne ferment pas une modale pendant l'envoi.
- **Justification** : éviter d'écraser une modification concurrente des autres champs ; actualiser la liste, la progression et le tableau de bord sans rechargement.

### B15 — Statut ignoré à la création (Backend, #11)

- **Référence** : `src/backend/src/controllers/taskController.ts` (`createTask` lit `title`, `description`, `priority`, `dueDate`, `assigneeIds`, jamais `status`) ; `Task.status` vaut `TODO` par défaut.
- **Impact** : le statut choisi dans la modale de création ne peut pas être enregistré par `POST /projects/:id/tasks`.
- **Décision** : backend inchangé. Envoyer le `POST`, puis un `PUT` du seul `status` s'il diffère de « À faire ». Si ce `PUT` échoue, la tâche existe en « À faire » : la modale se ferme et un message `role="alert"` le dit et invite à modifier la tâche. Aucun rollback ni nouvelle tentative automatique.
- **Justification** : décision du porteur du projet ; un renvoi de la création dupliquerait la tâche.

### B16 — Tâches gérées par tous les membres (Backend + Sujet, #11)

- **Référence** : spécifications fonctionnelles §1 (le contributeur peut seulement créer ou supprimer des tâches) ; `src/backend/src/utils/permissions.ts` (`canCreateTasks` et `canModifyTasks` reposent sur `hasProjectAccess`).
- **Impact** : Express autorise tout membre (propriétaire, `ADMIN`, `CONTRIBUTOR`) à créer, modifier et supprimer une tâche.
- **Décision** : backend inchangé ; suivre son contrat. « Créer une tâche » et le menu « … » sont visibles par tout lecteur du projet ; un `403` éventuel est annoncé.
- **Justification** : décision du porteur du projet de suivre le contrat réel ; Express reste l'autorité de chaque écriture.

### B17 — Assignations remplacées en bloc et anciens membres (Backend, #11)

- **Référence** : `src/backend/src/utils/taskAssignments.ts` (`updateTaskAssignments` supprime puis recrée toutes les assignations ; `validateProjectMembers`) ; `taskController.ts` (`INVALID_ASSIGNEES` en `400`, sans détail par champ) ; B12.
- **Impact** : `assigneeIds` remplace toute la liste (`[]` retire tout le monde). Une liste contenant une personne retirée du projet est refusée en bloc.
- **Décision** : envoyer `assigneeIds` seulement si la sélection a changé, toujours filtrée aux membres actuels. À l'édition, les assignés qui ne sont plus membres sont absents du choix et cités sous le champ : « Leur assignation sera retirée à l'enregistrement. » `INVALID_ASSIGNEES` est affiché sur le champ « Assigné à » et relit le détail du projet pour mettre à jour la liste des membres.
- **Justification** : respecter la règle « aucune assignation hors du projet » tout en expliquant la disparition d'une assignation conservée par Express.

## Collaboration par commentaires

### D50 — Commentaires extraits sans nouvelle lecture (Choix, #12)

- **Référence** : `Single projet.png`, ligne « Commentaires (n) » ; `src/backend/src/utils/taskComments.ts:8-29` ; D25.
- **Décision** : déplacer le dépliable dans `modules/tasks/task-comments.tsx`, avec `projectId` et la tâche reçue par la carte. Le compteur reste `task.comments.length` ; conserver l'ordre chronologique du backend, l'auteur ou son e-mail, la date française, le texte et l'état vide. Ne pas appeler la route de lecture de commentaires séparée.
- **Justification** : les commentaires complets sont déjà inclus dans la requête partagée des tâches. L'extraction permet d'ajouter le formulaire sans charger le composant de liste ni créer une seconde source de données.
- **Complète** : D23 et D25.

### D51 — Formulaire intégré et validation réelle (Maquette + Choix, #12)

- **Référence** : spécifications fonctionnelles §3 (ajout pour collaborer), maquette `Single projet.png` sans formulaire détaillé ; `src/backend/src/utils/validation.ts:463-487`.
- **Décision** : ajouter dans le dépliable un formulaire sobre avec les primitives existantes `Label`, `Textarea` et `Button`. Le contenu est obligatoire et contient de 1 à 2 000 caractères après suppression des espaces de début et de fin. React Hook Form et Zod valident la saisie ; l'aide est visible, l'erreur française est reliée au champ et annoncée. Aucun raccourci Ctrl/Cmd+Entrée n'est ajouté.
- **Justification** : respecter le contrat réel et rendre le champ multiligne utilisable au clavier, sans système de chat ni contrôle personnalisé. Le bouton reste actif avant validation afin d'expliquer une saisie vide, puis il est désactivé avec le champ pendant l'envoi.

### D52 — Publication validée et invalidation partagée (Choix, #12)

- **Référence** : `src/backend/src/controllers/commentController.ts:24-98` ; convention RHF et transport authentifié du projet.
- **Décision** : envoyer `{ content }` à `POST /projects/:id/tasks/:taskId/comments`, puis vérifier `success: true` et `data.comment` avec Zod, en réutilisant le contrat de commentaire de la lecture des tâches. Les champs supplémentaires du POST (`task`, identifiants de rattachement, date de mise à jour) ne sont pas consommés. Après succès, vider le champ, annoncer « Commentaire publié. » et invalider `['projects', projectId, 'tasks']` ainsi que le préfixe `['dashboard']`.
- **Justification** : la relecture actualise commentaire et compteur depuis la même source, sans insertion optimiste ni compteur estimé. Le commentaire ne change ni le nombre de tâches ni la progression du projet. Une erreur garde la saisie et est annoncée, même si le dépliable a été refermé pendant l'envoi ; le transport gère seul les `401`. Aucune mutation TanStack Query ni nouvelle convention de soumission n'est introduite.

### D53 — Membres autorisés, lecture et ajout seulement (Choix, #12)

- **Référence** : périmètre du ticket #12 ; `src/backend/src/controllers/commentController.ts:50-68` et `src/backend/src/utils/permissions.ts:10-35`.
- **Décision** : proposer l'ajout au propriétaire et aux membres qui consultent la tâche, sans restriction aux assignés et sans contrôle de rôle supplémentaire. Express vérifie à chaque publication l'accès au projet et l'appartenance de la tâche. Modification et suppression de commentaires restent hors périmètre.
- **Justification** : l'ajout est une fonction de collaboration pour les membres du projet. Les routes backend de modification et de suppression ne créent pas d'obligation produit supplémentaire ; aucun menu d'action fictif n'est ajouté. Les tests E2E utilisent un projet et une tâche jetables, supprimés au nettoyage, pour ne pas modifier le seed.

## Tâches assignées du tableau de bord

### D54 — Liste personnelle sans contrôles hors périmètre (Maquette + Choix, #13)

- **Statut** : remplacée par D59 au ticket #14 pour les onglets et « Créer un projet » ; la recherche reste absente (fonction optionnelle du sujet).
- **Référence** : `sujet/maquette/Dashboard.png` ; spécifications §4 ; tickets #14 et #15.
- **Décision** : remplacer le texte d'attente du dashboard par « Mes tâches assignées ». Ne pas ajouter les onglets Liste/Kanban, la recherche ou « Créer un projet » sur cette page. Le parcours de création existant reste sur `/projects`.
- **Justification** : livrer la liste réelle demandée sans faux contrôle ni extension aux autres vues prévues par les tickets suivants.

### D55 — Lecture authentifiée et cache dashboard dédié (Choix, #13)

- **Référence** : `src/backend/src/index.ts:65`, `src/backend/src/routes/dashboardRoutes.ts:11-15`, `dashboardController.ts:50-57,102` ; convention de `project-query.ts`.
- **Décision** : lire `GET /dashboard/assigned-tasks` via `authenticatedFetch`, valider `data.tasks` avec Zod et utiliser `['dashboard', 'assigned-tasks']`, un signal d'annulation, une minute de fraîcheur et aucune relance automatique. Les tâches et commentaires écrits invalident le préfixe `['dashboard']` en plus des tâches du projet.
- **Justification** : Express sélectionne les assignations de l'utilisateur authentifié. Une réponse invalide est une erreur, pas une liste vide ; une erreur d'actualisation conserve les dernières cartes avec annonce et relance manuelle, comme dans les projets.

### D56 — Tâches ouvertes et ordre métier partagé (Choix, #13)

- **Référence** : spécifications §4 (« les plus urgents d'abord »), règle B07 ; décision explicite du porteur du projet.
- **Décision** : masquer `DONE` et `CANCELLED` uniquement dans la liste personnelle. Trier `URGENT > HIGH > MEDIUM > LOW`, puis par échéance croissante, valeurs nulles en dernier et égalités stables. Généraliser `sortProjectTasks` en `modules/tasks/sort-tasks-by-priority.ts` (`sortTasksByPriority`) et migrer le projet ainsi que son test, sans alias.
- **Justification** : montrer le travail restant dans un ordre prévisible et identique entre les deux contextes. Le tri porte sur une copie sans modifier le cache. Le sous-titre précise « Par ordre de priorité, puis d’échéance » ; les tests couvrent ensemble le filtre et l'ordre.

### D57 — Carte de tâche personnelle fidèle et accessible (Maquette + Choix, #13)

- **Référence** : `Dashboard.png`, règles D24 et D27 ; WCAG 2.1 AA.
- **Décision** : conserver titre, description, statut, projet, échéance et nombre réel de commentaires. Réutiliser `formatFrenchCalendarDate`, toujours avec l'année, et annoncer « Aucune échéance » si nulle. Partager les libellés et couleurs via `modules/tasks/task-status.ts`. Le lien « Voir » a un nom accessible qui identifie sa tâche ; les métadonnées sont nommées et les icônes décoratives.
- **Justification** : ne pas fabriquer d'assignation ou de compteur, préserver les contrastes AA et le jour calendaire de l'API. Les cartes restent sur une colonne et les textes se replient ; sur mobile, l'action de 48 px occupe toute la largeur.

### D58 — Accès direct au contexte chargé côté client (Choix, #13)

- **Référence** : critère #13 d'accès au contexte ; décision explicite du porteur du projet ; tâches rendues après leur requête navigateur.
- **Décision** : « Voir » ouvre `/projects/[projectId]#task-[taskId]`. Chaque carte du projet porte cet identifiant stable, `tabIndex={-1}`, une marge de défilement et un focus visible. Après chargement, le projet fait défiler et focalise la cible une seule fois ; les relectures ne déplacent plus le focus.
- **Justification** : l'ancre native peut être cherchée avant l'existence de la carte. Le traitement vérifie que la cible appartient aux tâches reçues, sans route de tâche inventée. Une cible absente ne provoque pas de déplacement. Le refus neutre existant du projet reste applicable après perte d'accès (B12).

### B18 — Tri alphabétique des priorités du dashboard (Backend, #13)

- **Référence** : `src/backend/src/controllers/dashboardController.ts:92-100`, `orderBy: [{ priority: "asc" }, { dueDate: "asc" }]` ; priorité stockée comme chaîne Prisma. Le commentaire `URGENT, HIGH, MEDIUM, LOW` ne change pas cet ordre alphabétique.
- **Impact** : l'ordre croissant des chaînes n'est pas l'ordre d'urgence métier demandé, et diffère aussi du tri décroissant de la liste du projet (B07).
- **Décision** : backend conservé ; appliquer côté client le tri partagé de D56, sur décision du porteur du projet. Aucun ajustement de l'API ni ordre implicite.

### B19 — Tous les statuts renvoyés dans les assignations (Backend + Choix, #13)

- **Référence** : `src/backend/src/controllers/dashboardController.ts:50-57`, filtre limité à `assignees.some.userId`, sans condition de statut.
- **Impact** : la réponse inclut aussi les tâches terminées et annulées, qui ne représentent plus le travail restant de la liste personnelle.
- **Décision** : backend conservé ; masquer `DONE` et `CANCELLED` dans cette vue sur décision explicite du porteur du projet (D56). Le détail du projet continue à montrer tous les statuts et la progression conserve sa propre règle D15.

## Kanban mensuel du tableau de bord

### D59 — Onglets de vues et création depuis le dashboard (Maquette + Choix, #14)

- **Référence** : `Dashboard.png` et `Dashboard vue Kanban.png` (onglets « Liste » et « Kanban », bouton « + Créer un projet ») ; spécifications §4.
- **Décision** : les vues utilisent `Tabs` shadcn/ui (Radix) : « Liste » est choisie par défaut, les flèches changent d'onglet et le choix n'est pas conservé dans l'URL. Le panneau Kanban reste monté mais masqué, pour garder le mois affiché pendant un changement d'onglet. L'en-tête du dashboard réutilise `ProjectCreation`, comme `/projects`. La recherche « Rechercher une tâche » de la maquette n'est pas ajoutée.
- **Justification** : Radix fournit le rôle `tablist`, la navigation au clavier et le lien entre onglet et panneau. Les deux vues lisent le même cache : un changement d'onglet ne relance pas de requête. La création réutilise un parcours déjà testé. La recherche et le filtrage sont optionnels dans les spécifications (§4) ; un champ sans effet serait trompeur.
- **Remplace** : D54 pour les onglets et la création.

### D60 — Mois calendaire, navigation et colonnes du Kanban (Sujet + Choix, #14)

- **Référence** : spécifications §4 (« tâches du mois par statut ») ; `Dashboard vue Kanban.png` (colonnes « À faire », « En cours », « Terminées » avec compteurs) ; B08, B19 et D44.
- **Décision** : le Kanban lit `['dashboard', 'assigned-tasks']`, déjà utilisé par la liste. Il ouvre le mois courant du navigateur et propose « Mois précédent » et « Mois suivant ». Une tâche appartient au mois de son jour calendaire renvoyé par l'API (`YYYY-MM-DD`), comme dans son affichage. Chaque colonne garde l'ordre métier partagé (`sortTasksByPriority`). Les tâches sans échéance et les tâches `CANCELLED` sont exclues. Le compteur est le nombre de cartes de la colonne. Il n'y a pas de drag-and-drop : le statut change dans le formulaire de la tâche.
- **Justification** : le seed date toutes ses tâches de 2024, donc un mois fixe laisserait le Kanban vide. La navigation permet de consulter les autres mois sans nouvelle route. Le jour calendaire de l'API évite un changement de mois selon le fuseau horaire. Une tâche sans échéance n'a pas de mois, et le sujet ne prévoit que trois statuts. Le drag-and-drop est un bonus du sujet.
