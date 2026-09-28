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

Le frontend est initialisé dans `src/frontend`, avec son propre `package.json` et `package-lock.json`. Les routes App Router sont dans `src/frontend/src/app`. Les dossiers `modules` et `components` sont réservés aux besoins futurs ; `lib` accueille les utilitaires transversaux. L'organisation est hybride :

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
- Les futures requêtes privées devront envoyer `Authorization: Bearer <token>` directement à Express ; Express reste l'autorité pour les droits. Une réponse `401` devra effacer la session locale et demander une reconnexion explicite.
- Un Server Component ne peut pas lire `sessionStorage` : la protection côté serveur du shell privé prévue au ticket #5 est bloquée par ce choix et doit être réarbitrée avant implémentation. Les données API restent protégées par Express.
- Après succès, les formulaires naviguent provisoirement vers `/`, page publique, jusqu'à l'existence d'une destination applicative. TanStack Query n'est pas requis pour ces soumissions ponctuelles.

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
- React Testing Library couvre les composants à travers leurs comportements visibles. Pour l'authentification, deux tests de composants couvrent validation, erreur de conflit/identifiants, stockage du JWT dans l'onglet et navigation après succès.
- Les modules API peuvent être mockés avec Vitest dans les tests de composants.
- Playwright couvre les parcours critiques contre Next.js et le backend Express réel avec une base de test maîtrisée.
- Axe et WAVE complètent les vérifications d'accessibilité.

Les tests restent proportionnés aux risques : privilégier les parcours essentiels, les comportements visibles et les régressions réelles. Choisir le niveau le plus simple qui donne confiance, sans dupliquer chaque cas aux niveaux unitaire, composant et E2E ni viser 100 % de couverture.

Le socle utilise ESLint (configuration Next.js), Prettier avec `prettier-plugin-tailwindcss`, Vitest + jsdom + React Testing Library et Playwright. Les tests vivent sous `src/frontend/tests/{unit,component,e2e}` ; Playwright lance Next.js sur `localhost:8001` pour son test de fumée. Aucun backend n'est requis pour ce test initial. Les scripts `lint`, `typecheck`, `test`, `test:e2e`, `build` et `format:check` sont exécutés depuis `src/frontend`.

Le fichier `src/frontend/.env.example` documente `NEXT_PUBLIC_API_URL` : URL Express visible du navigateur. En développement, Next.js utilise `localhost:8001`, seule origine frontend autorisée par le CORS Express inchangé ; le déploiement exige une décision distincte sur l'origine de production.

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
