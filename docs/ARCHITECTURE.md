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

L'organisation cible est hybride :

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

- L'inscription et la connexion possèdent des handlers explicites.
- Le token reçu d'Express est stocké dans un cookie `HttpOnly`, `SameSite=Lax` et `Secure` en production.
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

Le fichier `DESIGN.md` capture progressivement les tokens et règles observés dans les maquettes. L'accessibilité et le responsive priment sur une reproduction pixel-perfect.

## Tests

Les tests vivent dans une arborescence séparée du code applicatif.

- Vitest couvre les schémas et fonctions métier pures.
- React Testing Library couvre les composants à travers leurs comportements visibles.
- Les modules API peuvent être mockés avec Vitest dans les tests de composants.
- Playwright couvre les parcours critiques contre Next.js, le BFF et le backend réel avec une base de test maîtrisée.
- Axe et WAVE complètent les vérifications d'accessibilité.

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
