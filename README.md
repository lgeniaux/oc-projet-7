# Projet 7 — Abricot

Application SaaS de gestion collaborative de projets et de tâches réalisée dans le cadre du parcours OpenClassrooms.

## État du projet

Le dépôt contient le backend officiel sous forme de submodule et un socle frontend Next.js en TypeScript. Les fonctionnalités métier sont encore à développer.

## Clonage

```bash
git clone --recurse-submodules git@github.com:lgeniaux/oc-projet-7.git
```

Pour récupérer le backend après un clone classique :

```bash
git submodule update --init --recursive
```

## Backend

```bash
cd src/backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Le backend démarre par défaut sur <http://localhost:8000>. Sa documentation Swagger est disponible sur <http://localhost:8000/api-docs>.

Les comptes de démonstration utilisent le mot de passe `P@ssword123`. Voir `src/backend/README.md` pour la liste complète.

## Frontend

```bash
cd src/frontend
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir <http://localhost:3000>. La page initiale fonctionne sans backend. Voir `src/frontend/README.md` pour les commandes de validation et les prérequis Playwright.

## Documentation de travail

- `AGENTS.md` : règles de contribution des agents ;
- `CONTEXT.md` : vocabulaire métier ;
- `docs/ARCHITECTURE.md` : architecture technique ;
- `DESIGN.md` : tokens YAML et règles visuelles selon le format Google (vérifier avec `cd src/frontend && npm run design:lint`) ;
- `sujet/` : documents et maquettes fournis.

Cette documentation accompagne le développement dans le dépôt privé.
