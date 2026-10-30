# Fiche d'autoévaluation — justification point par point

Ce document reprend chaque indicateur de `sujet/fiche_autoevaluation.md` et le relie à des preuves vérifiables : extraits de code, tests automatisés et décisions du [registre](ecarts-et-decisions.md). Les chemins partent de la racine du dépôt ; les numéros de ligne correspondent à la branche `main` après la fusion de #17.

Vérifications exécutées sur `main` avant la livraison : `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run design:lint` (0 erreur), `npm test` (149 tests), `npm run build` et `npm run test:e2e` (23 parcours Playwright contre le vrai backend Express).

---

## 1. Développer une interface performante et responsive avec React

### ☑ Le code respecte les bonnes pratiques d'accessibilité, standard AA minimum

L'objectif WCAG 2.1 AA est posé dans `DESIGN.md`. Les couleurs de texte sont choisies pour leur contraste : l'orange brut de la marque est remplacé par `link` pour le texte. Un audit axe-core (règles WCAG 2.0/2.1 A et AA) a couvert chaque page, modale et onglet du tableau de bord à 375, 768 et 1440 px. Résultat : aucune violation après corrections.

- `DESIGN.md:76-82` : contrastes documentés, par exemple :
  ```text
  - **Link (`#AD4706`)** : adaptation plus sombre de l'orange de marque pour les textes sur fond clair (5,71:1 sur blanc, 5,46:1 sur le fond de page).
  ```
- `docs/ARCHITECTURE.md:219` : méthode et résultat de l'audit axe.
- Corrections issues de l'audit : compteur de contributeurs (contraste de 4,39:1, sous le seuil AA de 4,5:1), focus des radios et menus, menu du compte non modal (D62). Voir `DESIGN.md`, section « Corrections de l'audit de livraison (#17) ».

#### ☑ Les balises ARIA sont présentes

Les régions, navigations et groupes sont nommés. Les états dynamiques sont annoncés (`role="status"`, `role="alert"`, `aria-live`). Les erreurs de formulaire sont reliées à leur champ.

- `src/frontend/src/modules/auth/app-shell.tsx:85-87` : navigation nommée.
  ```tsx
  <nav
    aria-label="Navigation principale"
    className="order-last w-full lg:order-none lg:w-auto"
  >
  ```
- `src/frontend/src/modules/auth/login-form.tsx:65-68` : champ invalide relié à son message.
  ```tsx
  autoComplete="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "login-email-error" : undefined}
  {...register("email")}
  ```
- `src/frontend/src/modules/dashboard/dashboard-month-kanban.tsx:62-66` : changement de mois annoncé.
  ```tsx
  <p
    aria-live="polite"
    className="min-w-36 text-center font-medium first-letter:uppercase"
  >
    {formatCalendarMonth(visibleMonth)}
  ```
- `src/frontend/src/modules/dashboard/assigned-task-card.tsx:42-45` : icône décorative et libellé réservé aux lecteurs d'écran.
  ```tsx
  />
  <span className="sr-only">Projet</span>
  </dt>
  <dd className="min-w-0 wrap-anywhere">{task.project.name}</dd>
  ```
- `src/frontend/src/modules/dashboard/assigned-tasks-error.tsx:18-25` : erreur annoncée avec relance.
  ```tsx
  <p role="alert" className="text-link">
    {hasTasks
      ? "L’actualisation des tâches assignées est indisponible. Les dernières tâches restent affichées."
      : "Les tâches assignées sont indisponibles pour le moment. Réessayez."}
  </p>
  ```

#### ☑ La navigation au clavier est possible

Un lien d'évitement précède l'en-tête. Les onglets, modales et menus utilisent les primitives Radix de shadcn/ui : flèches, Échap, focus contenu dans la modale et retour du focus au déclencheur. Le focus est aussi déplacé quand le contexte change (arrivée sur une tâche, suppression).

- `src/frontend/src/modules/auth/app-shell.tsx:71-76` : lien d'évitement.
  ```tsx
  <a
    href="#main-content"
    className="sr-only rounded-sm bg-surface p-3 text-link focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:outline-2 focus:outline-link"
  >
    Aller au contenu
  </a>
  ```
- `src/frontend/src/modules/projects/project-task-list.tsx:102-106` : la tâche ouverte depuis le dashboard reçoit le focus.
  ```tsx
  const target = document.getElementById(`task-${task.id}`);
  if (!target) return;
  focusedHash.current = hash;
  target.scrollIntoView({ block: "start" });
  target.focus({ preventScroll: true });
  ```
- Tests :
  - `src/frontend/tests/e2e/app-shell.spec.ts:88-90` (« login, navigation and sign-out ») : lien d'évitement, puis focus du contenu principal.
    ```ts
    await page.getByRole("link", { name: "Aller au contenu" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    ```
  - `src/frontend/tests/e2e/dashboard-month-kanban.spec.ts:80-86` : changement d'onglet avec la flèche droite, puis ouverture d'une tâche avec Entrée.

#### ☑ Aucune image n'est sans texte alternatif

Les logos informatifs ont un `alt`. Les illustrations décoratives ont `alt=""` et sont masquées. Les icônes Lucide sont en `aria-hidden`. Les avatars ont un nom accessible.

- `src/frontend/src/modules/auth/app-shell.tsx:79-84` : logo de l'en-tête.
  ```tsx
  <Image src="/abricot-logo.svg" alt="Abricot" width={147} height={19} />
  ```
- `src/frontend/src/modules/auth/auth-page.tsx:61-64` : illustration décorative masquée.
  ```tsx
  <div className="relative hidden lg:block" aria-hidden="true">
    <Image
      src={image}
      alt=""
  ```
- `src/frontend/src/modules/projects/project-list.tsx:153-159` : avatar nommé, initiales décoratives.
  ```tsx
  <Avatar
    role="img"
    aria-label={`${ownerName}, Propriétaire`}
    title={`${ownerName}, Propriétaire`}
  >
    <AvatarFallback>
      <span aria-hidden="true">{getInitials(project.owner)}</span>
  ```
- L'audit axe (règle `image-alt`) n'a relevé aucune image sans alternative.

#### ☐ → à cocher après contrôle manuel : aucune erreur n'est soulevée par le plugin WAVE

- **Fait :** l'audit axe-core, qui couvre les mêmes familles d'erreurs (alternatives, contrastes, ARIA, structure, formulaires), ne relève aucune violation sur toutes les pages, modales et onglets, aux trois largeurs (`docs/ARCHITECTURE.md:219`).
- **Corrigé :** les défauts trouvés (D62, contraste, focus, liste de définitions du dashboard).
- **Reste à faire :** passer l'extension WAVE à la main sur `/login`, `/register`, `/` (onglets Liste, Kanban et Projets), `/projects`, une page projet, `/account` et une URL inexistante. WAVE est une extension de navigateur ; elle n'a pas pu être lancée dans l'environnement automatisé.

### ☑ L'ensemble des pages et leur navigation sont conformes aux maquettes

Les routes privées partagent un shell (logo, navigation « Tableau de bord » / « Projets », avatar) repris des maquettes. `DESIGN.md` fait le lien entre chaque maquette et ses composants. Chaque écart volontaire est justifié dans le registre.

- `src/frontend/src/modules/auth/app-shell.tsx:20-23` : navigation des maquettes.
  ```tsx
  const navigation = [
    { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/projects", label: "Projets", icon: FolderOpen },
  ];
  ```
- `src/frontend/tests/e2e/app-shell.spec.ts:44-46` : parcours de navigation entre les deux sections.
- Écarts justifiés :
  - D05 : la racine mène au tableau de bord.
  - D07 : le compte et la déconnexion sont dans le menu de l'avatar.
  - D10–D13 : formulaires d'authentification et de compte.
  - D31, D43 : emplacement des boutons de création.
  - D59 : onglets du tableau de bord.
  - D61 : vue Projets sans maquette.

#### ☑ Page de connexion / inscription

Les pages `/login` et `/register` reprennent `Log In.png` et `Sign In.png` : panneau de formulaire à gauche, illustration à droite à partir de `lg`. Les deux routes partagent le composant `AuthPage`.

- `src/frontend/src/modules/auth/auth-page.tsx:29-31` :
  ```tsx
  <main className="grid min-h-screen lg:grid-cols-[39%_61%]">
    <section className="flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-8 lg:py-20">
  ```
- `src/frontend/src/modules/auth/schemas.ts:20-28` : validation Zod alignée sur le backend.
- Tests : `src/frontend/tests/component/auth-forms.test.tsx:22` (« shows a login error, then navigates after valid credentials ») et `:53` (« validates registration before sending it and reports a duplicate e-mail »).
- Écarts : D10 (champ « Nom » exigé par le backend), D11 (pas de « Mot de passe oublié ? », faute de route backend).

#### ☑ Page profil et ses différentes vues

`/account` reprend `Mon compte.png`. Elle contient deux formulaires indépendants : informations (nom, e-mail) et mot de passe. Les états chargement, erreur et succès sont annoncés.

- `src/frontend/src/modules/account/profile-form.tsx:115-118` : champ « Nom ».
- `src/frontend/src/modules/account/password-form.tsx:97-101` : formulaire de mot de passe séparé.
  ```tsx
  <form
    aria-labelledby="password-heading"
    noValidate
    onSubmit={handleSubmit(onSubmit)}
  ```
- Tests :
  - `src/frontend/tests/e2e/account.spec.ts:6` (« an account owner updates their profile and password without losing their session ») ;
  - `src/frontend/tests/component/account-forms.test.tsx:252` (« keeps the session on a wrong current password and clears both fields after success »).
- Écarts : D12 (un seul champ « Nom », le backend n'ayant pas de prénom), D13 (deux routes backend distinctes), B05.

#### ☑ Page projet, création et édition

`/projects` reprend `Projets.png` et `/projects/[id]` reprend `Single projet.png`. Les modales de création et de modification de projet et de tâche reprennent les quatre maquettes de modale (`Dialog` shadcn/ui).

- `src/frontend/src/modules/projects/project-creation.tsx:152-155` :
  ```tsx
  <DialogContent closeLabel="Fermer la fenêtre de création">
    <DialogTitle>Créer un projet</DialogTitle>
    <DialogDescription>
  ```
- `src/frontend/src/modules/projects/project-details.tsx:118-121` : l'édition n'est proposée qu'aux administrateurs.
  ```tsx
  {(role === "owner" || role === "admin") && (
    <ProjectEditing
      project={project.data}
      canDelete={role === "owner"}
  ```
- Tests E2E :
  - `project-creation.spec.ts` : création avec un contributeur recherché ;
  - `project-editing.spec.ts` : modification, contributeurs, suppression confirmée ;
  - `task-management.spec.ts` : création, statut, suppression d'une tâche ;
  - `projects.spec.ts` : lecture des tâches et commentaires.
- Décisions : D31–D49.

#### ☑ Page 404

Il n'y a pas de maquette de 404 (D06) : la page reprend l'identité Abricot (logo, accent, lien sombre de retour au tableau de bord). Elle est publique et répond en HTTP 404.

- `src/frontend/src/app/not-found.tsx:4-7` :
  ```tsx
  export default function NotFound() {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center px-6 py-12">
        <Image src="/abricot-logo.svg" alt="Abricot" width={147} height={19} />
  ```
- `src/frontend/tests/e2e/app-shell.spec.ts:142-145` :
  ```ts
  test("an unknown route shows the Abricot 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  ```

### ☑ L'ensemble de l'application est responsive

Les grilles et l'en-tête s'adaptent grâce aux points de rupture Tailwind (`sm`, `md`, `lg`, `xl`). Les tests E2E vérifient l'absence de défilement horizontal (`scrollWidth <= largeur`). L'audit l'a contrôlé sur toutes les pages à 375, 768 et 1440 px.

- `src/frontend/src/modules/projects/project-list.tsx:86` :
  ```tsx
  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  ```
- `src/frontend/src/modules/dashboard/dashboard-month-kanban.tsx:92` : colonnes empilées sur mobile, trois colonnes à partir de `lg`.
  ```tsx
  <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-6">
  ```
- `src/frontend/src/modules/auth/app-shell.tsx:78` : en-tête sur deux lignes sous `lg`, sans menu masqué.
  ```tsx
  <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:flex-nowrap">
  ```
- Tests de débordement :
  - `app-shell.spec.ts` à 375, 768 et 1440 px ;
  - `dashboard-assigned-tasks.spec.ts`, `dashboard-month-kanban.spec.ts`, `dashboard-projects.spec.ts` et `task-comments.spec.ts` à 375 et 1440 px.

### ☑ Aucune erreur n'est présente sur le site, ni dans la console

- Les réponses API sont validées par Zod : une réponse inattendue devient une erreur annoncée avec relance, pas un plantage.
- L'audit n'a relevé aucune erreur ni aucun avertissement console sur l'ensemble des pages après correction des deux avertissements Next.js (ratio du logo, chargement des images).
- `src/frontend/src/modules/dashboard/assigned-tasks-query.ts:18-21` :
  ```ts
  const assignedTasksResponseSchema = z.object({
    success: z.literal(true),
    data: z.object({ tasks: z.array(assignedTaskSchema) }),
  });
  ```
- `src/frontend/tests/e2e/app-shell.spec.ts:6-15` : test « auth pages load without console warnings… », qui échoue sur tout avertissement, toute erreur console ou toute erreur de page.
  ```ts
  const diagnostics: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      diagnostics.push(message.text());
    }
  });
  page.on("pageerror", (error) => diagnostics.push(error.message));
  ```
- **Seule exception, assumée (D63) :** sur une URL inexistante, le navigateur journalise la réponse HTTP 404 du document. C'est le comportement normal d'une vraie 404.

### ☑ L'authentification se fait de manière sécurisée

- Le JWT n'est jamais placé dans `localStorage` : il est validé puis rangé dans `sessionStorage`, effacé à la fermeture de l'onglet (ADR 0001, D01).
- Il est envoyé en `Authorization: Bearer`. Toute réponse `401` efface la session et redirige (D03).
- L'erreur de connexion ne révèle pas si l'e-mail existe.
- `src/frontend/src/modules/auth/session.ts:38-44` :
  ```ts
  export async function saveAuthToken(response: Response) {
    const body: unknown = await response.json();
    const parsed = authResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error("Invalid auth response");
    }
    sessionStorage.setItem("authToken", parsed.data.data.token);
  ```
- `src/frontend/src/modules/auth/authenticated-fetch.ts:16-26` :
  ```ts
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(new URL(path, process.env.NEXT_PUBLIC_API_URL), {
    ...options,
    headers,
  });
  if (response.status === 401) {
  ```
- `src/frontend/src/modules/auth/login-form.tsx:38-39` : message générique « E-mail ou mot de passe incorrect. ».
- Tests :
  - `app-shell.spec.ts:108` : Express refuse le profil sans token valide ;
  - `app-shell.spec.ts:134` : les pages privées redirigent un visiteur sans token.
- **Limites assumées (D01–D02) :**
  - le JWT reste lisible par le JavaScript de la page (risque XSS), contrairement à un cookie HttpOnly, que le backend fourni ne gère pas ;
  - la garde des pages est côté navigateur, mais Express refuse toute donnée sans JWT valide.

### ☑ Qualité du code

#### Le code est propre, organisé et conforme aux standards

- TypeScript `strict` (`src/frontend/tsconfig.json:7`).
- Aucun `any` dans `src/frontend/src`.
- ESLint (configuration Next.js), Prettier avec tri des classes Tailwind.
- Organisation : routes App Router dans `src/app`, modules métier dans `src/modules/{auth,account,projects,tasks,dashboard}`, primitives shadcn/ui dans `src/components/ui`, utilitaires dans `src/lib` (`docs/ARCHITECTURE.md:36-47`).
- `src/frontend/package.json:8-15` : commandes de contrôle, toutes vertes à la livraison.
  ```json
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  ```

#### Les fonctions et composants sont rigoureusement nommés

Les noms décrivent l'intention métier : `getProjectViewerRole`, `compareTasksByPriority`, `sortTasksByPriority`, `getOpenAssignedTasks`, `getMonthKanbanColumns`, `getProjectsByUrgency`, `getProjectProgress`, `saveAuthToken`, `authenticatedFetch`, `DashboardMonthKanban`, `ProjectCreation`, `AssignedTaskCard`.

- `src/frontend/src/modules/projects/project-query.ts:86-91` :
  ```ts
  export function getProjectViewerRole(
    project: Project,
    viewerId: string | undefined,
  ): ProjectViewerRole | null {
    if (viewerId === undefined) return null;
    if (viewerId === project.owner.id) return "owner";
  ```

#### Le code est commenté quand c'est nécessaire

Les fonctions métier ont une JSDoc courte (contrat, cas limites). Les commentaires expliquent le _pourquoi_, pas le _quoi_.

- `src/frontend/src/modules/dashboard/get-projects-by-urgency.ts:12-17` :
  ```ts
  /**
   * Order the projects by their most urgent open assigned task.
   * Projects without an open task come last. Ties keep the API order (by name).
   * @returns A new array. The query cache is not changed.
   */
  export function getProjectsByUrgency(
  ```
- Autres exemples :
  - `month-kanban.ts` : règle du jour calendaire de l'API et fuseaux horaires ;
  - `project-progress.ts` : tâches annulées exclues ;
  - `authenticated-fetch.ts` : traitement des `401`.

---

## 2. Développer des fonctionnalités complexes avec React

### ☑ Les fonctionnalités du document de spécifications sont fonctionnelles et conformes

| Exigence (`sujet/specifications_fonctionnelles_abricot.md`)          | Implémentation                                                                             | Preuve par test                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Inscription / connexion par e-mail et mot de passe                   | `modules/auth/login-form.tsx`, `register-form.tsx`, `schemas.ts`                           | `component/auth-forms.test.tsx`, `e2e/app-shell.spec.ts`                 |
| Modifier nom, e-mail, mot de passe                                   | `modules/account/profile-form.tsx`, `password-form.tsx`                                    | `e2e/account.spec.ts`                                                    |
| Rôles par projet                                                     | `modules/projects/project-query.ts:86` (`getProjectViewerRole`), `project-details.tsx:118` | `component/projects.test.tsx:379` (« shows only permitted actions… »)    |
| Créer un projet (nom, description, contributeurs)                    | `modules/projects/project-creation.tsx`, `contributor-picker.tsx`                          | `e2e/project-creation.spec.ts`                                           |
| Vue d'ensemble des projets                                           | `modules/projects/project-list.tsx`                                                        | `component/projects.test.tsx`, `e2e/projects.spec.ts`                    |
| Modifier / supprimer un projet, ajouter ou retirer des contributeurs | `modules/projects/project-editing.tsx`                                                     | `e2e/project-editing.spec.ts`                                            |
| Créer une tâche (titre, description, échéance, statut)               | `modules/tasks/task-creation.tsx`, `task-form-fields.tsx`                                  | `e2e/task-management.spec.ts`                                            |
| Assigner une tâche à une ou plusieurs personnes                      | `task-form-fields.tsx` (`assigneeIds`, menu à cases)                                       | `component/task-management.test.tsx`, `e2e/task-management.spec.ts`      |
| Statut À faire / En cours / Terminée                                 | `modules/tasks/task-status.ts`, `task-actions.tsx`                                         | `e2e/task-management.spec.ts` (passage à « Terminée »)                   |
| Commentaires de tâche                                                | `modules/tasks/task-comments.tsx`                                                          | `e2e/task-comments.spec.ts`                                              |
| Dashboard, liste des tâches assignées, les plus urgentes d'abord     | `modules/dashboard/dashboard-assigned-tasks.tsx`, `get-open-assigned-tasks.ts`             | `e2e/dashboard-assigned-tasks.spec.ts` (ordre réel vérifié)              |
| Dashboard, Kanban du mois par statut                                 | `modules/dashboard/dashboard-month-kanban.tsx`, `month-kanban.ts`                          | `unit/month-kanban.test.ts`, `e2e/dashboard-month-kanban.spec.ts`        |
| Dashboard, projets avec tâches assignées, les plus urgents d'abord   | `modules/dashboard/dashboard-projects.tsx`, `get-projects-by-urgency.ts`                   | `unit/get-projects-by-urgency.test.ts`, `e2e/dashboard-projects.spec.ts` |
| Vue liste des tâches d'un projet                                     | `modules/projects/project-task-list.tsx`                                                   | `component/project-tasks.test.tsx`, `e2e/projects.spec.ts`               |
| _Optionnel_ : recherche et filtrage                                  | Non réalisé (bonus)                                                                        | —                                                                        |

Toutes les écritures (tâche, commentaire, projet) invalident les caches concernés, dont le préfixe `['dashboard']`. Les vues se mettent à jour sans rechargement (D49, D52).

---

## 3. Mettre en place l'authentification sur le site web

### ☑ L'authentification est fonctionnelle

#### Il est possible de créer un compte

- `src/frontend/src/modules/auth/register-form.tsx:26-33` : `POST /auth/register`, puis enregistrement du token et redirection.
  ```tsx
  const response = await fetch(
    new URL("/auth/register", process.env.NEXT_PUBLIC_API_URL),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    },
  );
  ```
- Test : `component/auth-forms.test.tsx:53` (validation et e-mail déjà utilisé). Le parcours `e2e/account.spec.ts` crée aussi un compte neuf.

#### Il est possible de se connecter

- `src/frontend/src/modules/auth/login-form.tsx` : `POST /auth/login` et message générique en cas de `401`.
- Tests : `component/auth-forms.test.tsx:22`, puis la connexion réelle au début de chaque parcours E2E (`e2e/app-shell.spec.ts`).

#### L'utilisateur peut changer son mot de passe

- `src/frontend/src/modules/account/password-form.tsx` : mot de passe actuel exigé, nouveau mot de passe confirmé.
- `src/frontend/tests/e2e/account.spec.ts:78-84` :
  ```ts
  await currentPassword.fill(initialPassword);
  await page.getByRole("button", { name: "Modifier le mot de passe" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Votre mot de passe a été modifié." }),
  ).toBeVisible();
  ```
- Un mauvais mot de passe actuel ne déconnecte pas l'utilisateur (exception ciblée au traitement des `401`, `component/account-forms.test.tsx:252`).

### ☑ Les droits d'accès sont gérés comme demandé

Le backend Express reste l'autorité. Le frontend reflète les droits en n'affichant que les actions permises et traite les refus `403`.

#### Tout le monde peut créer un projet et en devient automatiquement administrateur

- `src/backend/src/controllers/projectController.ts:114-119` : le créateur devient propriétaire.
  ```ts
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      ownerId: authReq.user.id,
    },
  ```
- Le bouton « Créer un projet » est proposé à tout utilisateur connecté, sur `/projects` et sur le tableau de bord (`src/frontend/src/app/(app)/page.tsx`). La modale l'annonce : « Vous serez propriétaire du projet » (`project-creation.tsx:165`).

#### Seuls les contributeurs d'un projet peuvent le consulter et y créer / supprimer des tâches

- `src/backend/src/utils/permissions.ts:10` (`hasProjectAccess`) et `:104` (`canCreateTasks`) : accès réservé au propriétaire et aux membres.
- `src/frontend/src/modules/projects/project-details.tsx:62-64` : un non-membre reçoit un message neutre, sans fuite d'information.
  ```tsx
  const isInaccessible =
    project.error instanceof ProjectRequestError &&
    (project.error.status === 403 || project.error.status === 404);
  ```
- Décisions : B06 (projet inexistant ou inaccessible, même réponse `403`), B16 (le backend autorise tous les membres à gérer les tâches, ce qui inclut création et suppression).

#### Seuls les administrateurs d'un projet peuvent modifier ses informations

- `src/backend/src/utils/permissions.ts:130` (`canModifyProject` → `isProjectAdmin`).
- `src/frontend/src/modules/projects/project-details.tsx:118-121` : « Modifier » n'est affiché qu'au propriétaire ou à un administrateur. La suppression est réservée au propriétaire (B11).
- `src/frontend/tests/component/projects.test.tsx:374-379` :
  ```tsx
  it.each([
    { viewer: alice, userRole: "ADMIN", editable: true, deletable: true },
    { viewer: charlie, userRole: "ADMIN", editable: true, deletable: false },
    { viewer: bob, userRole: "CONTRIBUTOR", editable: false, deletable: false },
  ] as const)(
  ```
- « Deadlines » : le modèle `Project` du backend n'a pas de champ d'échéance (`src/backend/prisma/schema.prisma:32-43`). Les échéances existent seulement sur les tâches.

---

## Points restant à traiter avant de cocher toute la fiche

1. **WAVE** : passage manuel de l'extension sur les pages listées plus haut.
2. **Interface IA** (#16) : hors périmètre obligatoire selon le sujet (« excepté la génération de tâches automatique ») ; prévue en bonus après validation.
