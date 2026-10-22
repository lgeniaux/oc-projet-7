# Architecture d'Abricot

## Objectifs

- Consommer le backend Express fourni sans en dupliquer la logique métier.
- Conserver le JWT uniquement pour l'onglet courant sans utiliser `localStorage`, en documentant son exposition au JavaScript.
- Garder une architecture standard, explicite et accessible à un développeur débutant.
- Permettre des fonctionnalités verticales testables indépendamment.

## Vue d'ensemble

```text
Navigateur ── pages ──► Frontend Next.js
    │                   ├── Server Components et layouts
    │                   └── formulaires Client Components
    │
    │ JWT en sessionStorage ; requêtes directes avec Bearer
    ▼
Backend Express fourni
    │
    ▼
SQLite / Prisma
```

Le frontend et le backend restent deux projets npm indépendants. Le backend est référencé comme submodule officiel et n'est pas modifié sans décision explicite.

## Frontend

### Socle

- Next.js stable avec App Router ;
- React et TypeScript strict ;
- Tailwind CSS ;
- shadcn/ui ajouté composant par composant ;
- Lucide React pour les icônes fonctionnelles.

### Organisation

Le frontend est initialisé dans `src/frontend`, avec son propre `package.json` et `package-lock.json`. Les routes App Router sont dans `src/frontend/src/app`. Les modules regroupent les fonctionnalités métier, les composants regroupent les primitives et présentations partagées, et `lib` accueille les utilitaires transversaux. L'organisation est hybride :

```text
app/          routes et layouts Next.js
components/   composants génériques, dont les primitives UI
modules/      authentification, compte, projets, tâches et dashboard
lib/          utilitaires transversaux et infrastructure
```

Cette arborescence guide le développement sans interdire une adaptation justifiée.

### Rendu

Les Server Components sont le choix par défaut. Un composant devient client lorsqu'il utilise notamment :

- un formulaire interactif ;
- une modale ;
- un état navigateur ;
- TanStack Query ;
- une API React nécessitant le client.

Le projet n'introduit pas de préchargement ou d'hydratation avancée tant qu'un besoin mesurable ne le justifie pas.

## Authentification directe

Voir [ADR 0001](adr/0001-direct-express-authentication.md). Le BFF et le cookie HttpOnly sont en pause ; le backend fourni reste inchangé.

- Les pages publiques `/login` et `/register` sont des Server Components qui composent une présentation partagée et deux formulaires Client Components. React Hook Form et Zod valident les champs avant un appel direct à `POST /auth/login` ou `POST /auth/register` d'Express. Le nom (au moins deux caractères) est requis à l'inscription sur décision du porteur du projet, même si Express le permet optionnellement.
- Une réponse Express de succès est vérifiée à l'exécution avant stockage du JWT dans `sessionStorage`. Le token survit au rechargement du même onglet mais reste accessible au JavaScript ; ne pas utiliser `localStorage`. Les réponses `401`, `409`, `400` et les pannes donnent des messages utilisateur en français sans divulguer la réponse brute.
- Les pages de l'application (`/` pour le tableau de bord, `/projects`, `/projects/[id]`, `/account`) sont regroupées sous `app/(app)`, dont le layout Server Component compose une seule garde client `AppShell` ; les pages restent des Server Components. Les pages publiques `/login` et `/register` sont l'exception et sont regroupées sous `app/(auth)` ; elles composent `AuthPage`, car titre, image et lien alternatif varient selon la page. Aucune page de présentation n'existe : les maquettes et les spécifications n'en prévoient pas. La page compte permet de modifier le profil et le mot de passe ; les projets accessibles et leur détail minimal consomment les données réelles d'Express.
- Un Server Component ne peut pas lire `sessionStorage`. Le porteur du projet accepte la garde côté navigateur : elle masque le shell et le contenu avant lecture du token, puis redirige vers `/login` si l'onglet n'en possède pas. Elle ne vérifie pas le JWT et ne protège pas le HTML envoyé par le serveur ; seules les réponses de l'API sont protégées par Express.
- `modules/auth/session.ts` centralise la lecture, le stockage et la suppression du token de l'onglet. Chaque changement notifie la garde via `auth-session-change`. La déconnexion supprime immédiatement le token ; la garde masque les pages puis remplace la route par `/login`.
- Les appels authentifiés doivent utiliser `modules/auth/authenticated-fetch.ts` : requête directe à Express avec `Authorization: Bearer <token>`, sans cookie ni proxy. Une réponse `401` efface le token et notifie la garde, qui redirige vers `/login?reason=session-expired`, sauf lorsque son code d'erreur est précisément `INVALID_CURRENT_PASSWORD` (voir la décision ci-dessous). La page de connexion affiche alors un message français annoncé par `role="status"`. Le motif de redirection reste en mémoire, sans persister de nouvelle donnée de session ; une réponse tardive ne supprime pas une session plus récente. Les autres erreurs restent à la charge du composant appelant.
- Le shell et la page compte partagent la lecture de `GET /auth/profile` définie dans `modules/auth/profile-query.ts`, sous la clé TanStack Query `['profile']`. La réponse est vérifiée à l'exécution dans `data.user`, conformément au contrôleur Express. Le shell affiche le nom réel lorsqu'il existe ; une indisponibilité est annoncée sans fausse identité ni suppression d'un token non rejeté par Express.
- Après succès, les formulaires d'authentification naviguent vers `/`. React Hook Form suffit pour ces soumissions ponctuelles ; TanStack Query sert à la lecture partagée du profil. La page 404 racine est publique et propose un retour au tableau de bord, soumis à la même garde.

### Gestion du compte

La page `/account` conserve le titre « Mon compte » et compose `modules/account/account-details.tsx`. `AccountDetails` prend en charge le chargement et l'erreur du profil, puis présente `ProfileForm` et `PasswordForm` dans une seule carte. Ces deux formulaires sont indépendants : la mise à jour des informations ne demande pas le mot de passe et ne soumet pas le formulaire de changement de mot de passe.

- `ProfileForm` reçoit le profil réel (`name` éventuellement absent ou nul, `email`) et appelle `PUT /auth/profile`. Le seul champ « Nom » correspond à `name` : le backend n'a pas de champ prénom. Un nom fourni contient au moins deux caractères après suppression des espaces de début et de fin. Un nom initialement absent reste affiché vide et est omis s'il est inchangé ; l'API ne permet pas d'effacer un nom existant. L'e-mail est obligatoire et valide. Après succès, le profil reçu dans `data.user` remplace la donnée du cache `['profile']`, puis cette requête est invalidée pour relire la valeur serveur ; le nom du shell et le compte utilisent donc la même source.
- `PasswordForm` appelle `PUT /auth/password` avec `currentPassword` et `newPassword`. Le mot de passe actuel est requis ; le nouveau doit être différent. La confirmation du nouveau mot de passe est une validation locale, non envoyée à Express. Les champs de mot de passe sont vidés après succès.
- La validation du nouveau mot de passe et de l'inscription suit la regex réelle de `src/backend/src/utils/validation.ts` : au moins huit caractères, une minuscule ASCII, une majuscule ASCII, un chiffre et un caractère spécial parmi `@$!%*?&`. Seuls les lettres ASCII, les chiffres et ces sept caractères spéciaux sont autorisés : les espaces, lettres accentuées et autres symboles ne sont pas acceptés, même si le message backend du changement de mot de passe ne détaille pas toutes ces contraintes.
- Les soumissions utilisent l'état `isSubmitting` de React Hook Form, sans ajouter de mutation TanStack Query pour ces appels ponctuels. Les erreurs de champ et serveur sont annoncées ; les confirmations sont « Vos informations ont été mises à jour. » et « Votre mot de passe a été modifié. ».

Express renvoie `401` et le code `INVALID_CURRENT_PASSWORD` lorsque le mot de passe actuel est incorrect, même si la session est valide. Pour traiter ce refus métier sans déconnecter l'utilisateur, une exception ciblée a été approuvée : le transport authentifié lit une copie du corps de réponse et conserve la session uniquement pour ce code précis. `PasswordForm` l'annonce comme erreur du champ « Mot de passe actuel ». Toute autre réponse `401`, y compris un corps absent ou illisible, conserve le comportement de déconnexion et de redirection. Le backend reste inchangé ; voir aussi l'ADR 0001.

### Projets accessibles

`/projects` compose `modules/projects/project-list.tsx` après le titre serveur « Mes projets ». `project-query.ts` valide les réponses avec Zod et lit les projets accessibles avec `GET /projects` (clé `['projects']`), le détail avec `GET /projects/:id` (clé `['projects', id]`) et les tâches avec `GET /projects/:id/tasks` (clé `['projects', id, 'tasks']`). Tous les appels passent par `authenticatedFetch`, transmettent le signal d'annulation et suivent le profil : cache frais pendant une minute, sans relance automatique ni préchargement serveur.

- Express filtre la liste aux projets possédés ou rejoints. `owner` n'est pas inclus dans `members` : l'équipe compte le propriétaire et les membres. `userRole` vaut `ADMIN` pour le propriétaire mais aussi pour un membre administrateur ; l'interface compare l'identifiant stable du profil (`GET /auth/profile`, `data.user.id`) à `owner.id` pour ne pas confondre ces situations. L'e-mail n'est pas utilisé pour cette identité, car il peut changer alors qu'une liste de projets reste en cache.
- `GET /projects` fournit `_count.tasks`, mais aucun nombre de tâches terminées. Chaque carte lance donc une requête de tâches indépendante : coût **N+1** (une liste et N listes de tâches, avec leur contenu complet) imposé par le contrat actuel. Le cache mutualise chaque clé, mais ne supprime pas ce coût initial. Une erreur de progression ne masque ni le nom, ni l'équipe, ni le lien du projet. Une évolution vers des compteurs agrégés nécessiterait une décision backend.
- La fonction pure `getProjectProgress` compte les tâches `DONE` et exclut `CANCELLED` du dénominateur. Le pourcentage est arrondi à l'entier le plus proche ; zéro tâche éligible donne 0 % et « Aucune tâche ». `_count.tasks` n'est pas utilisé comme dénominateur, car il comprend les tâches annulées.
- `lib/get-initials.ts` est extrait au deuxième usage réel : shell et équipes des cartes partagent les premières lettres du premier et du dernier mot du nom, ou la première lettre de l'e-mail.
- `/projects/[id]` attend les paramètres asynchrones de Next.js côté serveur, puis compose `ProjectDetails` côté client ; le détail et les tâches réelles sont décrits ci-dessous. La création de projet est disponible depuis `/projects` (voir « Création d'un projet »).
- Le contrôle d'accès de `getProject` précède la recherche du projet : un identifiant inexistant retourne actuellement `403 FORBIDDEN`, comme un projet inaccessible. Pour `403` et `404`, le détail affiche « Ce projet n'existe pas ou vous n'y avez pas accès. » et un retour aux projets, sans révéler l'existence du projet. Les autres erreurs ont un état annoncé et une relance manuelle.

Les choix et écarts du ticket #7 sont consignés dans le [registre unique](ecarts-et-decisions.md).

### Détail d'un projet

`ProjectDetails` conserve les états de lecture du projet et présente son nom, sa description et ses contributeurs. Le propriétaire est ajouté avant les membres, car Express ne le duplique pas dans `members`. Les noms sont visibles, avec l'e-mail comme repli pour un nom absent ; les initiales sont décoratives. Le lien serveur « Mes projets » reste disponible dans tous les états.

Une fois le projet reçu, `ProjectTaskList` utilise la requête partagée `['projects', id, 'tasks']` : son échec ne masque pas les informations du projet. Les chargements, erreurs et relances restent locaux ; une actualisation échouée conserve les tâches précédentes et l'annonce explicitement. Une réponse mal formée produit une erreur, pas une liste vide artificielle. Le schéma Zod décrit les champs réellement consommés (titre, description nullable, statut, priorité, échéance nullable, assignations avec `user`, commentaires avec `author` et date), tout en tolérant les champs supplémentaires.

`GET /projects/:id/tasks` renvoie déjà les commentaires complets, triés par date de création croissante. Les cartes affichent leur nombre et permettent de les déplier avec `Collapsible` shadcn/ui, en lecture seule ; aucun appel supplémentaire ni formulaire de commentaire n'est ajouté. Les tâches annulées restent visibles avec « Annulée », contrairement au calcul de progression qui les exclut de son dénominateur.

Le backend trie les priorités stockées comme chaînes par ordre alphabétique décroissant, ce qui place `MEDIUM` avant `HIGH`. `sortProjectTasks` trie une copie des tâches selon `URGENT > HIGH > MEDIUM > LOW`, puis l'échéance croissante (valeurs nulles en dernier) ; les égalités gardent l'ordre reçu. Le cache partagé n'est pas modifié. `formatFrenchCalendarDate` étend l'utilitaire de date : il conserve le jour calendaire ISO renvoyé par l'API, le formate en UTC sans conversion au fuseau du navigateur et affiche toujours l'année. L'échéance nulle est explicitement annoncée.

Les tests unitaires couvrent le tri et les limites de jour ; les tests de composants couvrent les états de tâches, les quatre statuts, l'ordre, les assignés et l'ouverture clavier des commentaires. Le parcours E2E ouvre le projet E-commerce du seed et vérifie ses tâches, statuts et échéances sans modifier les données. Les choix de périmètre et écarts backend sont consignés dans le registre (D23–D30, B07–B08). Le repère du propriétaire passe par le composant partagé `OwnerCrown` (cartes et détail). La salutation « Bonjour … » n'est plus rendue par `AppShell` : `modules/dashboard/dashboard-greeting.tsx` l'affiche sous le titre du tableau de bord.

### Création d'un projet

`ProjectList` conserve le déclencheur `ProjectCreation` sur `/projects`, y compris pendant le chargement ou une erreur de liste. La page serveur et le dashboard ne changent pas. La modale shadcn/ui `Dialog` compose React Hook Form, Zod, `Input`, `Textarea` et `ContributorPicker`. Le titre (`name`) est obligatoire, entre 2 et 100 caractères après suppression des espaces de début et de fin ; la description est facultative et limitée à 500 caractères après la même normalisation.

- Le sélecteur attend 300 ms après la saisie, puis appelle `GET /users/search?query=…` sous la clé `['users', 'search', query]`. La recherche est active seulement à partir de deux caractères et après lecture du profil partagé `['profile']`. Le transport authentifié transmet le signal d'annulation ; Zod vérifie `data.users`, le cache reste frais 30 secondes et les erreurs se relancent manuellement. Les résultats précédents sont masqués pendant une nouvelle recherche ou une erreur.
- Le profil permet d'exclure le propriétaire par identifiant stable ; les personnes déjà sélectionnées sont également retirées des résultats. Une panne du profil bloque seulement la recherche, pas la création sans contributeur. Aucun e-mail libre n'est envoyé : seuls les utilisateurs choisis dans les résultats sont retenus. Les états aide, chargement, vide et erreur sont explicites ; le nombre de résultats disponibles est annoncé poliment.
- La soumission suit la convention des formulaires du compte : `handleSubmit` → `authenticatedFetch` → validation Zod → `invalidateQueries({ queryKey: ['projects'] })`, sans `useMutation`. `isSubmitting` désactive l'envoi et les champs. Le corps de `POST /projects` contient le titre, la description si renseignée et les e-mails sélectionnés. Les erreurs `400` sont reliées aux champs reconnus ; les autres refus ou pannes donnent un message français et conservent les saisies.
- Le schéma de création dérive du schéma de projet existant sans `userRole`, absent de la réponse de création réelle. Après succès, les membres retournés sont comparés aux e-mails sélectionnés ; les absents sont listés dans un avertissement non bloquant. Aucun rôle n'est choisi à la création : Express impose `CONTRIBUTOR` et définit le propriétaire à partir du JWT.
- Le formulaire est vidé, la modale se ferme et rend le focus au déclencheur ; la confirmation reste visible sur la page avec `role="status"`. L'invalidation recharge la liste active sans rechargement du document. Si la lecture échoue, l'état de liste existant distingue l'échec d'actualisation du succès de création. Une fermeture volontaire pendant l'envoi ne l'annule pas : l'état en cours et son résultat restent annoncés sur la page, et une nouvelle ouverture attend la fin de cet envoi.

Les tests de composants couvrent validation, recherche et relance, sélection/retrait, erreurs serveur avec conservation des champs, confirmation, invalidation réelle de liste, membres manquants et clavier de la modale. Le parcours Playwright crée un projet au nom unique avec Bob, le retrouve sans rechargement et ouvre son détail ; il modifie seulement un nouveau projet de test. Les décisions #8 sont consignées de D31 à D37 et B09 à B10 dans le registre.

### Administration d'un projet

`project-query.ts` expose `ProjectViewerRole` et `getProjectViewerRole`. L'identifiant du profil distingue le propriétaire d'un membre `ADMIN` ; sans profil, aucune action d'administration n'est affichée. La liste partage ce calcul pour son libellé de rôle. Le détail affiche « Modifier » au propriétaire et aux membres `ADMIN`, et la suppression au seul propriétaire. Le backend vérifie toujours les permissions.

`ProjectEditing` reçoit le projet déjà chargé, `canDelete` et `onDeleted`. À l'ouverture, il copie les champs et les membres hors propriétaire dans le brouillon et sa référence. Il partage `ProjectFormFields` et son schéma Zod avec la création, sans partager leurs contrôleurs réseau. `ContributorPicker` reçoit le texte d'aide et l'identifiant du propriétaire, utilise `useId` et ne propose pas de retirer le lecteur. Chaque nouvel ajout reste `CONTRIBUTOR`, sans paramètre `role`.

La soumission conserve RHF `handleSubmit` et `authenticatedFetch`, sans `useMutation`. Elle compare les membres par identifiant, en excluant le propriétaire et le lecteur des ajouts et retraits. Elle envoie un `PUT` seulement pour les champs modifiés, puis les ajouts et enfin les retraits, séquentiellement. Une description effacée est envoyée avec `""`, jamais `null`. Un refus des champs arrête la séquence ; une erreur d'autorisation sur un membre arrête les écritures restantes. Les réponses `401` laissent le transport et le shell gérer la déconnexion sans message local.

Après une écriture, l'invalidation du préfixe `['projects']` actualise liste, détail et tâches. Une réussite ferme la modale et annonce « Projet modifié. ». Une erreur partielle conserve la modale et nomme chaque personne concernée, en précisant si les champs ont été enregistrés. La référence et la sélection sont remplacées par les membres du détail relu dans le cache, ou par la référence précédente en l'absence de donnée. La nouvelle tentative recalcule les changements, sans rollback ; `409 USER_ALREADY_MEMBER` est un succès et le retrait d'un non-membre est idempotent côté Express.

La suppression utilise une zone séparée dans la modale et `AlertDialog` shadcn/ui. Avant le `DELETE`, le contrôleur annule les requêtes du détail et des tâches. Après succès, `ProjectDetails` affiche l'état supprimé et démonte son contenu, y compris les observateurs et les modales. Un effet annule de nouveau les requêtes, retire le préfixe `['projects', id]`, filtre la liste en cache, l'invalide exactement sans relecture et appelle `router.replace('/projects')`. Ces opérations supportent la double exécution des effets en StrictMode. Aucun observateur du projet supprimé ne déclenche ainsi de relecture refusée.

Les tests de composants vérifient les permissions, les champs préremplis, les corps et l'ordre des écritures, les erreurs partielles et leur nouvelle tentative, les protections du propriétaire et du lecteur, ainsi que la confirmation et le nettoyage du cache après suppression. Playwright crée un projet jetable avec Bob, modifie son titre, efface sa description, remplace Bob par Caroline puis le supprime ; les projets du seed ne sont pas modifiés. Les limites backend et les décisions sont consignées en D38–D42 et B11–B14 dans le registre.

### Gestion des tâches

Le module `modules/tasks/` regroupe la gestion des tâches. `task-status.ts` partage les libellés et couleurs des statuts entre la liste et les formulaires. `ProjectTaskList` affiche `TaskCreation` dans l'en-tête de sa section et chaque carte reçoit `TaskActions` (menu « … », modification et suppression). Tout membre du projet voit ces actions, car Express autorise tout membre à créer, modifier et supprimer une tâche ; le backend reste l'autorité.

- `task-form-fields.tsx` partage le schéma Zod `taskFieldsSchema`, les champs et leur accessibilité entre création et modification, sans partager leurs contrôleurs réseau. Le titre (2 à 200 caractères), la description (1 à 1000 caractères) et l'échéance sont obligatoires ; la priorité (« Moyenne » par défaut) et le statut sont des groupes radio shadcn/ui ; les assignés sont choisis dans un `DropdownMenu` à cases parmi le propriétaire et les membres du détail en cache (`['projects', id]`).
- L'échéance vient d'un champ date natif (`AAAA-MM-JJ`). `toCalendarDateTime` (`lib/format-date.ts`) l'envoie à minuit UTC ; `formatFrenchCalendarDate` relit ce jour sans conversion de fuseau. La modification préremplit le champ avec les dix premiers caractères de la valeur API.
- La création appelle `POST /projects/:id/tasks` avec titre, description, échéance, priorité et `assigneeIds`. Express ignore `status` à cette étape : si le statut choisi n'est pas « À faire », un `PUT` du seul `status` suit. Son échec ne supprime pas la tâche : la modale se ferme et une alerte indique que la tâche est restée « À faire ».
- La modification compare le formulaire à la tâche et n'envoie que les champs modifiés. `assigneeIds` remplace toute la liste côté Express ; il est envoyé seulement si la sélection change, filtré aux membres actuels. Les assignés retirés du projet (B12) sont nommés sous le champ et perdent leur assignation à l'enregistrement. Une tâche annulée garde l'option « Annulée » ; les autres ne la proposent pas.
- La suppression passe par un `AlertDialog`. Après succès (ou `404`, tâche déjà absente), la tâche est retirée du cache des tâches, puis les vues sont invalidées. `ProjectTaskList` transmet à chaque carte, puis à `TaskActions`, le rappel `onDeleted` : appelé une fois la carte retirée, il annonce la suppression et place le focus sur le titre « Tâches » ; après modification, le focus revient sur le bouton « … » de la carte.
- Les soumissions suivent D36 (`handleSubmit` → `authenticatedFetch` → Zod, sans `useMutation`) et bloquent la fermeture des modales pendant l'envoi. Les erreurs `400` sont reliées aux champs, dont `INVALID_ASSIGNEES` sur « Assigné à », qui relit aussi le détail du projet ; `403`, `404` et les pannes conservent les saisies avec un message français. Les réponses `401` restent gérées par le transport.
- `invalidateTaskViews` invalide `['projects', id, 'tasks']`, la liste `['projects']` (compteur de tâches, sans relecture si elle n'est pas observée) et le préfixe `['dashboard']` après chaque écriture : la tâche apparaît, change ou disparaît sans rechargement.

Les tests de composants couvrent la validation, le `POST` suivi du `PUT` de statut et son échec annoncé, les refus backend avec conservation des saisies, le corps de modification limité aux champs changés, l'option « Annulée », les anciens membres, la confirmation de suppression, le focus et l'invalidation du tableau de bord ; Vitest vérifie le jour envoyé aux limites de fuseau. Playwright crée un projet jetable avec Bob, y crée une tâche assignée « En cours », la passe à « Terminée », la supprime puis supprime le projet. Les décisions sont consignées en D43–D49 et B15–B17 dans le registre.

## Données et formulaires

- `AppQueryProvider` (`modules/auth/app-query-provider.tsx`) fournit TanStack Query uniquement dans la branche authentifiée d'`AppShell`, après lecture du token. Le layout `app/(app)` reste serveur ; les pages publiques ne montent pas ce provider.
- Le shell et le compte partagent ainsi les données distantes, leur chargement, leurs erreurs et l'invalidation après mise à jour. Le provider est démonté à la déconnexion, ce qui abandonne son cache ; une nouvelle session ne réutilise pas le profil précédent.
- Aucun préchargement serveur, déshydratation ou hydratation de cache n'est ajouté.
- L'état purement visuel reste local au composant concerné.
- React Hook Form gère les champs, la validation et l'état de soumission ; Zod décrit des contraintes conformes au contrat réel d'Express.
- Les erreurs et permissions du backend restent l'autorité finale.
- Les contrats API sont représentés par des types TypeScript manuels vérifiés contre les réponses réelles.

## Design

Les maquettes Abricot sont la référence visuelle. shadcn/ui fournit des comportements accessibles et une base modifiable, sans imposer son thème par défaut.

Le fichier racine `DESIGN.md` suit le format alpha de Google (frontmatter YAML de tokens et sections Markdown ordonnées). Les tokens reposent sur les PNG fournis et sont exposés par `@theme inline` dans `src/app/globals.css` pour Tailwind v4. Inter (corps) et Manrope (titres), confirmées par le porteur du projet, sont chargées localement via `@fontsource`. Les logos officiels sont copiés depuis les SVG fournis dans `public/`. Les primitives shadcn/ui `Button`, `Input`, `Label`, `DropdownMenu`, `Avatar` et `Progress` (`components/ui/`) sont adaptées à Abricot sans importer le thème générique ; seules les parties utilisées sont conservées et `cn` vient de `lib/utils`. Lucide fournit les icônes fonctionnelles, dont le repère compact du propriétaire dans les équipes. L'outil officiel `@google/design.md` est installé comme dépendance de développement du frontend ; `npm run design:lint` valide le document racine. L'accessibilité et le responsive priment sur une reproduction pixel-perfect.

## Tests

Les tests vivent dans une arborescence séparée du code applicatif.

- Vitest couvre les schémas et fonctions métier pures.
- React Testing Library couvre les comportements visibles : validation et soumission des formulaires d'authentification et du compte, partage du profil avec le shell, chargement, erreurs et confirmations, garde sans token, navigation avec token, suppression immédiate à la déconnexion et redirection après `401` avec annonce de session expirée sur la connexion. Les projets couvrent chargement, liste vide, erreur et relance, équipe accessible, progression isolée, liens des cartes et refus du détail ; Vitest couvre le calcul pur de progression.
- Les modules API peuvent être mockés avec Vitest dans les tests de composants.
- Playwright couvre les parcours critiques contre Next.js et le backend Express réel avec une base de test maîtrisée.
- Axe et WAVE complètent les vérifications d'accessibilité.

Les tests restent proportionnés aux risques : privilégier les parcours essentiels, les comportements visibles et les régressions réelles. Choisir le niveau le plus simple qui donne confiance, sans dupliquer chaque cas aux niveaux unitaire, composant et E2E ni viser 100 % de couverture.

Le socle utilise ESLint (configuration Next.js), Prettier avec `prettier-plugin-tailwindcss`, Vitest + jsdom + React Testing Library et Playwright. Les tests vivent sous `src/frontend/tests/{unit,component,e2e}`. Playwright lance Next.js sur `localhost:8001` ; les parcours authentifiés exigent aussi Express réel sur `localhost:8000` et une base de test maîtrisée. Les parcours du shell et l'ouverture d'un projet utilisent le compte de test public du seed (`alice@example.com`, documenté dans le README backend), sans le modifier. Le shell couvre connexion, navigation clavier, lien d'évitement, déconnexion, `401`, routes sans token et 404, avec des largeurs de 375, 768 et 1440 px ; le parcours projets ouvre une carte réelle et retrouve son nom dans le détail. Le parcours compte inscrit un utilisateur neuf avec un e-mail unique, puis modifie uniquement son profil et son mot de passe ; il ne modifie aucun compte du seed. Le test de présentation reste indépendant du backend. Les scripts `lint`, `typecheck`, `test`, `test:e2e`, `build` et `format:check` sont exécutés depuis `src/frontend`.

Le fichier `src/frontend/.env.example` documente `NEXT_PUBLIC_API_URL` : URL Express visible du navigateur. En développement, Next.js utilise `localhost:8001`, seule origine frontend autorisée par le CORS Express inchangé ; le déploiement exige une décision distincte sur l'origine de production.

## Gestion des divergences

Une incohérence entre sujet, maquette et backend n'est jamais résolue implicitement. L'implémentation concernée s'arrête le temps de présenter :

1. le comportement observé ;
2. le comportement attendu ;
3. l'impact ;
4. les solutions possibles ;
5. la décision à prendre.

La décision est ensuite consignée dans le registre [`ecarts-et-decisions.md`](ecarts-et-decisions.md), dans le même changement ; une décision durable d'architecture fait aussi l'objet d'un ADR.

## Hors périmètre initial

- génération IA réelle ;
- recherche et filtres avancés ;
- drag-and-drop du Kanban ;
- OAuth ;
- Storybook ;
- déploiement ;
- CI distante.
