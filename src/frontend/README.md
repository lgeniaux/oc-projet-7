# Frontend Abricot

Application Next.js (App Router) en TypeScript. Le backend Express reste un projet npm séparé dans `src/backend`.

## Démarrer

Depuis `src/frontend` :

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir <http://localhost:8001> (utiliser `localhost`, pas `127.0.0.1`). Sans session, l'application redirige vers la connexion ; démarrer Express sur `http://localhost:8000` pour l'inscription, la connexion et les pages de l'application. Son CORS autorise `localhost:8001` en développement. `NEXT_PUBLIC_API_URL` est visible dans le navigateur : ne jamais y mettre de secret. Le JWT retourné par Express est stocké dans `sessionStorage` pour l'onglet courant ; le BFF est en pause (voir `docs/adr/0001-direct-express-authentication.md`).

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run format:check
npm run design:lint
```

Pour Playwright, installer d'abord le navigateur avec `npx playwright install chromium` (et, si nécessaire, ses bibliothèques système avec `npx playwright install --with-deps chromium`). Playwright démarre lui-même Next.js sur `localhost:8001`. Avant la suite complète, démarrer le backend Express inchangé sur `localhost:8000`, avec une base de test migrée et peuplée selon `src/backend/README.md`. Les parcours existants du shell utilisent le compte de seed public `alice@example.com` et son mot de passe documenté, sans le modifier. Le parcours compte inscrit un utilisateur neuf avec un e-mail unique et modifie uniquement son profil et son mot de passe : il ne modifie aucun compte du seed. Utiliser une base dédiée aux tests, car ce parcours crée et modifie son propre compte réel. Sans backend, seul le test de présentation peut être lancé avec `npm run test:e2e -- tests/e2e/home.spec.ts`.

Le formatage est assuré par `npm run format` (Prettier et tri des classes Tailwind). `design:lint` utilise le CLI officiel Google installé localement pour valider le `DESIGN.md` à la racine du dépôt.

## Organisation

- `src/app` : routes et layout Next.js ;
- `src/modules` : fonctionnalités métier, dont les formulaires, la session de l'onglet, le shell de l'application et le transport des appels Express authentifiés ;
- `src/components/ui` : primitives shadcn/ui adaptées à Abricot (`Button`, `Input`, `Label`, `DropdownMenu`) ;
- `src/lib` : utilitaires transversaux ;
- `public` : logos officiels SVG clair et blanc issus des maquettes ;
- `tests/unit`, `tests/component`, `tests/e2e` : tests séparés du code applicatif.

Les pages de l'application (`/` pour le tableau de bord, `/projects`, `/account`) partagent `src/app/(app)/layout.tsx` ; les pages publiques de connexion et d'inscription sont sous `src/app/(auth)`. La garde client masque l'application sans token et le transport authentifié centralise les réponses `401`. Express reste seul responsable de l'accès aux données : le HTML serveur n'est pas protégé par cette garde (ADR 0001).

`AppQueryProvider` est monté uniquement dans la branche authentifiée d'`AppShell`, après lecture du token ; les routes publiques n'en dépendent pas et le layout de l'application reste serveur. Le provider est démonté à la déconnexion et son cache est abandonné. Le shell et le compte lisent `GET /auth/profile` avec la même requête TanStack Query (`src/modules/auth/profile-query.ts`, clé `['profile']`), sans préchargement serveur ni hydratation.

## Compte

`/account` affiche « Mon compte » et les deux formulaires de `src/modules/account` dans une seule carte : informations (`PUT /auth/profile`) et changement de mot de passe (`PUT /auth/password`). Les projets restent une destination non implémentée, annoncée comme telle.

- Le champ « Nom » correspond au seul champ backend `name` ; les champs « Nom » et « Prénom » de la maquette ne sont pas séparés artificiellement. Un nom absent ou nul apparaît vide ; s'il reste inchangé, il est omis de la requête. Un nom fourni doit contenir au moins deux caractères après suppression des espaces de début et de fin ; effacer un nom existant n'est pas pris en charge par Express.
- La mise à jour du profil vérifie la réponse `data.user`, met à jour le cache partagé, puis invalide `['profile']` pour relire le profil serveur et actualiser aussi le nom du shell.
- Le changement de mot de passe exige l'actuel, un nouveau différent et une confirmation locale non envoyée au backend. La regex Express impose au moins huit caractères, une minuscule ASCII, une majuscule ASCII, un chiffre et un symbole parmi `@$!%*?&`. Seuls les lettres ASCII, les chiffres et ces symboles sont autorisés ; les espaces et les autres caractères sont refusés.
- React Hook Form gère l'état de soumission. Les champs utilisent `Input` et `Label` ; les chargements et succès sont annoncés par `role="status"`, les erreurs par `role="alert"` et les erreurs de champ sont reliées au contrôle. Les boutons sont « Modifier les informations » et « Modifier le mot de passe » ; les confirmations sont « Vos informations ont été mises à jour. » et « Votre mot de passe a été modifié. ».
- Le backend renvoie `401 INVALID_CURRENT_PASSWORD` pour un mot de passe actuel incorrect. Cette seule erreur conserve la session et est affichée sur le champ concerné ; toute autre réponse `401` déclenche la reconnexion, conformément au transport partagé et à l'ADR 0001.

