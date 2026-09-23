# Architecture d'Abricot

## Objectifs

- Consommer le backend Express fourni sans en dupliquer la logique métier.
- Protéger le JWT contre l'accès par le JavaScript du navigateur.
- Garder une architecture standard, explicite et accessible à un développeur débutant.
- Permettre des fonctionnalités verticales testables indépendamment.

## Vue d'ensemble

```text
Navigateur
    │
    │ pages et /api
    ▼
Frontend Next.js
    ├── Server Components et layouts
    ├── Client Components interactifs
    ├── BFF minimal
    └── cookie de session HttpOnly
    │
    │ Authorization: Bearer <token>
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

Le frontend est initialisé dans `src/frontend`, avec son propre `package.json` et `package-lock.json`. Les routes App Router sont dans `src/frontend/src/app`. Les dossiers `modules` et `components` sont réservés aux besoins futurs ; `lib` accueille les utilitaires transversaux. L'organisation est hybride :

```text
app/          routes, layouts et endpoints BFF
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

## BFF et authentification

Le BFF Next.js constitue une frontière de sécurité fine, pas un second backend métier.

- La connexion utilise `POST /api/auth/login` : le handler accepte les identifiants, transmet uniquement e-mail et mot de passe à `POST /auth/login` d'Express, et ne retourne jamais le token au navigateur dans le corps de réponse. L'inscription aura son propre handler explicite.
- Les réponses d'authentification ne sont pas mises en cache. Le handler refuse les requêtes portant une origine différente et renvoie des messages génériques pour les erreurs du backend.
- Le token reçu d'Express est stocké dans un cookie `session` de chemin `/`, `HttpOnly`, `SameSite=Lax`, valable sept jours (durée par défaut du JWT Express) et `Secure` en production.
- Les requêtes authentifiées passent par un proxy limité aux chemins et méthodes autorisés.
- Le BFF ajoute le header `Authorization` attendu par Express.
- Une réponse `401` invalide la session locale et déclenche une reconnexion explicite.
- Le JWT n'est jamais envoyé au code JavaScript applicatif ni stocké dans `localStorage`.

## Données et formulaires

- TanStack Query gère les données distantes, les chargements, les erreurs et l'invalidation après mutation.
- L'état purement visuel reste local au composant concerné.
- React Hook Form gère les formulaires.
- Zod décrit les validations frontend.
- Les erreurs et permissions du backend restent l'autorité finale.
- Les contrats API sont représentés par des types TypeScript manuels vérifiés contre les réponses réelles.

## Design

Les maquettes Abricot sont la référence visuelle. shadcn/ui fournit des comportements accessibles et une base modifiable, sans imposer son thème par défaut.

Le fichier racine `DESIGN.md` suit le format alpha de Google (frontmatter YAML de tokens et sections Markdown ordonnées). Les tokens reposent sur les PNG fournis et sont exposés par `@theme inline` dans `src/app/globals.css` pour Tailwind v4. Inter (corps) et Manrope (titres), confirmées par le porteur du projet, sont chargées localement via `@fontsource`. Les logos officiels sont copiés depuis les SVG fournis dans `public/`. La première primitive shadcn/ui est le bouton (`components/ui/button.tsx`), adapté à Abricot sans importer le thème générique ; Lucide fournit les icônes fonctionnelles. L'outil officiel `@google/design.md` est installé comme dépendance de développement du frontend ; `npm run design:lint` valide le document racine. L'accessibilité et le responsive priment sur une reproduction pixel-perfect.

## Tests

Les tests vivent dans une arborescence séparée du code applicatif.

- Vitest couvre les schémas et fonctions métier pures.
- React Testing Library couvre les composants à travers leurs comportements visibles.
- Les modules API peuvent être mockés avec Vitest dans les tests de composants.
- Playwright couvre les parcours critiques contre Next.js, le BFF et le backend réel avec une base de test maîtrisée.
- Axe et WAVE complètent les vérifications d'accessibilité.

Le socle utilise ESLint (configuration Next.js), Prettier avec `prettier-plugin-tailwindcss`, Vitest + jsdom + React Testing Library et Playwright. Les tests vivent sous `src/frontend/tests/{unit,component,e2e}` ; Playwright lance Next.js sur le port 3100 pour son test de fumée. Aucun backend n'est requis pour ce test initial. Les scripts `lint`, `typecheck`, `test`, `test:e2e`, `build` et `format:check` sont exécutés depuis `src/frontend`.

Le fichier `src/frontend/.env.example` documente `BACKEND_URL`, future URL serveur du BFF ; la page initiale ne l'utilise pas encore.

## Gestion des divergences

Une incohérence entre sujet, maquette et backend n'est jamais résolue implicitement. L'implémentation concernée s'arrête le temps de présenter :

1. le comportement observé ;
2. le comportement attendu ;
3. l'impact ;
4. les solutions possibles ;
5. la décision à prendre.

La décision durable peut ensuite être consignée dans un ADR.

## Hors périmètre initial

- génération IA réelle ;
- recherche et filtres avancés ;
- drag-and-drop du Kanban ;
- OAuth ;
- Storybook ;
- déploiement ;
- CI distante.
