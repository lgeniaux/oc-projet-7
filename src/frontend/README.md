# Frontend Abricot

Application Next.js (App Router) en TypeScript. Le backend Express reste un projet npm séparé dans `src/backend`.

## Démarrer

Depuis `src/frontend` :

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir <http://localhost:3000>. La page de présentation des fondations visuelles ne requiert pas le backend ; son bouton reste désactivé tant qu'aucune fonctionnalité métier n'est disponible. `BACKEND_URL` servira au BFF lorsqu'il sera implémenté ; ne pas préfixer cette variable par `NEXT_PUBLIC_`.

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

Pour Playwright, installer d'abord le navigateur avec `npx playwright install chromium` (et, si nécessaire, ses bibliothèques système avec `npx playwright install --with-deps chromium`). Le test E2E démarre lui-même l'application sur le port 3100.

Le formatage est assuré par `npm run format` (Prettier et tri des classes Tailwind). `design:lint` utilise le CLI officiel Google installé localement pour valider le `DESIGN.md` à la racine du dépôt.

## Organisation

- `src/app` : routes et layout Next.js ;
- `src/modules` : fonctionnalités métier à ajouter au fil des tickets ;
- `src/components/ui` : première primitive shadcn/ui adaptée à Abricot (bouton) ;
- `src/lib` : utilitaires transversaux ;
- `public` : logos officiels SVG clair et blanc issus des maquettes ;
- `tests/unit`, `tests/component`, `tests/e2e` : tests séparés du code applicatif.
