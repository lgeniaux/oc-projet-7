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

Pour Playwright, installer d'abord le navigateur avec `npx playwright install chromium` (et, si nécessaire, ses bibliothèques système avec `npx playwright install --with-deps chromium`). Playwright démarre lui-même Next.js sur `localhost:8001`. Avant la suite complète, démarrer le backend Express inchangé sur `localhost:8000`, avec une base de test migrée et peuplée selon `src/backend/README.md`. Les parcours utilisent le compte de seed public `alice@example.com` et son mot de passe documenté ; ils ne modifient aucune donnée métier. Sans backend, seul le test de présentation peut être lancé avec `npm run test:e2e -- tests/e2e/home.spec.ts`.

Le formatage est assuré par `npm run format` (Prettier et tri des classes Tailwind). `design:lint` utilise le CLI officiel Google installé localement pour valider le `DESIGN.md` à la racine du dépôt.

## Organisation

- `src/app` : routes et layout Next.js ;
- `src/modules` : fonctionnalités métier, dont les formulaires, la session de l'onglet, le shell de l'application et le transport des appels Express authentifiés ;
- `src/components/ui` : première primitive shadcn/ui adaptée à Abricot (bouton) ;
- `src/lib` : utilitaires transversaux ;
- `public` : logos officiels SVG clair et blanc issus des maquettes ;
- `tests/unit`, `tests/component`, `tests/e2e` : tests séparés du code applicatif.

Les pages de l'application (`/` pour le tableau de bord, `/projects`, `/account`) partagent `src/app/(app)/layout.tsx` ; les pages publiques de connexion et d'inscription sont sous `src/app/(auth)`. La garde client masque l'application sans token et le transport authentifié centralise les réponses `401`. Express reste seul responsable de l'accès aux données : le HTML serveur n'est pas protégé par cette garde (ADR 0001).
