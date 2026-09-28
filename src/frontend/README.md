# Frontend Abricot

Application Next.js (App Router) en TypeScript. Le backend Express reste un projet npm séparé dans `src/backend`.

## Démarrer

Depuis `src/frontend` :

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir <http://localhost:8001> (utiliser `localhost`, pas `127.0.0.1`). La page d'accueil fonctionne sans backend ; pour l'inscription et la connexion, démarrer Express sur `http://localhost:8000`. Son CORS autorise `localhost:8001` en développement. `NEXT_PUBLIC_API_URL` est visible dans le navigateur : ne jamais y mettre de secret. Le JWT retourné par Express est stocké dans `sessionStorage` pour l'onglet courant ; le BFF est en pause (voir `docs/adr/0001-direct-express-authentication.md`).

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

Pour Playwright, installer d'abord le navigateur avec `npx playwright install chromium` (et, si nécessaire, ses bibliothèques système avec `npx playwright install --with-deps chromium`). Le test E2E démarre lui-même l'application sur `localhost:8001`. Les futurs parcours d'authentification E2E nécessiteront Express et une base de test dédiée.

Le formatage est assuré par `npm run format` (Prettier et tri des classes Tailwind). `design:lint` utilise le CLI officiel Google installé localement pour valider le `DESIGN.md` à la racine du dépôt.

## Organisation

- `src/app` : routes et layout Next.js ;
- `src/modules` : fonctionnalités métier, dont les formulaires d'authentification ;
- `src/components/ui` : première primitive shadcn/ui adaptée à Abricot (bouton) ;
- `src/lib` : utilitaires transversaux ;
- `public` : logos officiels SVG clair et blanc issus des maquettes ;
- `tests/unit`, `tests/component`, `tests/e2e` : tests séparés du code applicatif.
