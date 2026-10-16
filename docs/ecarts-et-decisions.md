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

## Création d'un projet

### D31 — Création depuis la liste et modale accessible (Maquette + Choix, #8)

- **Référence** : `Projets.png`, `Dashboard.png`, `Modale création projet.png` ; périmètre explicite du ticket.
- **Décision** : ajouter le bouton avec plus décoratif uniquement sur `/projects`, même si le dashboard possède également ce bouton dans sa maquette. Il reste disponible dans les états vide, chargement et erreur. La modale utilise `Dialog` shadcn/ui adapté à Abricot, avec fermeture X nommée en français, focus contenu, Échap, retour du focus et défilement interne responsive.
- **Justification** : le parcours de liste permet immédiatement la création sans étendre le ticket au dashboard. Radix fournit les comportements clavier plutôt qu'un contrôle artisanal. Les primitives inutilisées du générateur et son import erroné `cn` sont retirés ; aucun paquet supplémentaire n'est conservé.
- **Remplace** : D16.

### D32 — Description facultative et limites réelles (Maquette + Backend, #8)

- **Référence** : `Modale création projet.png` marque titre et description obligatoires ; `src/backend/src/utils/validation.ts:194-215`.
- **Décision** : seul « Titre » porte un astérisque. Il contient entre 2 et 100 caractères après suppression des espaces de début et de fin ; la description est facultative et limitée à 500 caractères après la même normalisation. Une description vide est omise. `Textarea` shadcn/ui remplace le champ court de la maquette et permet une saisie multiligne.
- **Justification** : ne pas imposer de contrainte métier absente d'Express ; rendre les limites visibles avant envoi et conserver une description lisible.

### D33 — Recherche simple et liste de contributeurs (Maquette + Choix, #8)

- **Référence** : dropdown de `Modale création projet.png` ; ticket #8 excluant une autocomplétion complexe ; `projectController.ts:717-770`.
- **Décision** : champ de recherche par e-mail ou nom, délai de 300 ms, minimum deux caractères, clé `['users', 'search', query]`, cache frais 30 secondes, signal d'annulation et réponses validées par Zod. Liste de dix résultats maximum avec boutons « Ajouter » ; sélections avec boutons « Retirer ». Exclure le profil courant par identifiant et les personnes déjà choisies ; attendre le profil avant la recherche. Les résultats antérieurs ne restent pas affichés lors d'une nouvelle recherche ou d'une erreur.
- **Justification** : conserver un parcours clavier simple sans combobox ni dépendance supplémentaire, tout en présentant aide, chargement, vide, erreur avec relance et compteur annoncé poliment. L'API inclut le lecteur dans les résultats : appel réel `query=alice` authentifié comme Alice.

### D34 — Aucun choix de rôle à la création (Backend + Choix, #8)

- **Référence** : `projectController.ts:113-118,160-165` ; spécifications fonctionnelles §2 ; gestion des membres au ticket #9.
- **Décision** : Express définit le propriétaire à partir du JWT ; tous les membres choisis sont des contributeurs. L'interface l'explique, sans sélecteur `ADMIN`.
- **Justification** : le corps de création n'accepte pas de rôle et impose `CONTRIBUTOR`. Ne pas proposer une permission impossible à enregistrer ; la gestion des rôles appartient à #9.

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
