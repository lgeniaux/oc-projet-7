# Frontend Abricot

Application Next.js 16 (App Router), React et TypeScript. L'interface et les messages utilisateur sont en français. Le backend Express fourni est un projet npm séparé dans `../backend`, conservé sans modification.

Pour cloner **avec les sous-modules**, installer le backend, préparer SQLite et créer les comptes de démonstration, suivre d'abord le [README de la racine](../../README.md). Prérequis commun : Node.js **22.22.2+ dans la branche 22** ou **24.15.0+ dans la branche 24**, avec npm ; les dépendances de test exigent davantage que le minimum de Next.js (20.9).

## Démarrage local

Depuis `src/frontend` :

```bash
npm ci
cp .env.example .env.local
```

Le fichier `.env.local` contient `NEXT_PUBLIC_API_URL=http://localhost:8000`. Cette variable est intégrée au code du navigateur : elle ne doit contenir aucun secret. Après un changement de valeur, redémarrer Next.js.

Avec Express déjà démarré sur `http://localhost:8000`, lancer dans un second terminal (commande persistante) :

```bash
npm run dev
```

Ouvrir **<http://localhost:8001>**, y compris depuis Windows avec WSL. Ne pas remplacer `localhost` par `127.0.0.1` ou l'adresse IP de WSL : le CORS du backend autorise l'origine `http://localhost:8001`, pas ces alternatives ([D04](../../docs/ecarts-et-decisions.md#d04--cors-limité-à-localhost-backend-4)).

Sans session, l'application redirige vers la connexion. Le compte seed conseillé est `alice@example.com` / `P@ssword123` ; les autres comptes sont listés dans le README racine. Express doit rester disponible pour tous les parcours métier.

## Vérifications

Depuis `src/frontend`, les commandes suivantes ne nécessitent aucun serveur :

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
npm run design:lint
```

- `test` lance les tests unitaires et de composants avec Vitest / Testing Library.
- `build` compile l'application de production ; il ne démarre pas de serveur.
- `format:check` vérifie le formatage sans modifier les fichiers.
- `design:lint` valide le `DESIGN.md` situé à la racine avec le CLI Google local.

### Tests end-to-end avec Express réel

Installer Chromium une fois par environnement :

```bash
npx playwright install chromium
```

Sur Linux, installer les bibliothèques système éventuellement signalées par Playwright selon votre distribution (droits système possibles).

**Avant de lancer la suite, démarrer Express sur `localhost:8000` avec une base dédiée aux tests, migrée et seedée selon le README racine.** Le seed efface la base visée. Les tests créent de vraies données : le parcours compte inscrit et modifie un nouvel utilisateur ; les parcours d'écriture utilisent des projets et tâches jetables avec nettoyage. Ne pas utiliser de données à conserver et ne pas modifier les comptes de démonstration.

```bash
npm run test:e2e
```

`playwright.config.ts` utilise Chromium et `http://localhost:8001`. Playwright démarre Next.js lui-même ou réutilise le serveur existant hors CI ; en CI, libérer le port 8001 avant la suite. Cette commande nécessite les serveurs et ports indiqués, contrairement aux vérifications précédentes. Le Kanban ouvre le mois courant : les tâches seedées datent de 2024 et ne sont visibles que dans leur mois d'échéance.

## Organisation et contrats

- `src/app` : routes et layouts Next.js ; `/` (tableau de bord), `/projects`, `/projects/[id]`, `/account`, `/login` et `/register`.
- `src/modules` : fonctionnalités métier et transport des appels Express authentifiés.
- `src/components/ui` : primitives shadcn/ui adaptées à Abricot.
- `src/lib` : utilitaires transversaux ; `public` : ressources statiques, dont les logos.
- `tests/unit`, `tests/component`, `tests/e2e` : tests séparés du code applicatif.

Le JWT est conservé dans `sessionStorage` pour l'onglet courant, jamais dans `localStorage`. Il reste accessible au JavaScript ; le BFF avec cookie HttpOnly est en pause. La garde client masque l'application sans token mais ne protège pas le HTML serveur : Express vérifie les accès aux données. Le transport commun gère les réponses `401`, sauf le code de mot de passe actuel incorrect qui doit rester une erreur de formulaire ([ADR 0001](../../docs/adr/0001-direct-express-authentication.md), B01).

TanStack Query partage les données distantes dans la branche authentifiée ; son provider et son cache sont abandonnés à la déconnexion. Les écritures actualisent les vues concernées sans rechargement manuel. Le backend reste l'autorité des permissions, même lorsqu'une action est masquée dans l'interface.

Voir aussi :

- [Architecture](../../docs/ARCHITECTURE.md) : modules, flux, cache et stratégie de tests.
- [Design](../../DESIGN.md) : composants, tokens, responsive et accessibilité.
- [Registre des écarts et décisions](../../docs/ecarts-et-decisions.md) : règles de progression et de tri, limites backend et adaptations des maquettes.
