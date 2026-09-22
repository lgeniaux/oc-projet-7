# Projet 7 — Abricot

Application SaaS de gestion collaborative de projets et de tâches réalisée dans le cadre du parcours OpenClassrooms.

## État du projet

Le dépôt est en cours d'initialisation. Il contient le backend officiel sous forme de submodule et accueillera un frontend Next.js en TypeScript.

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

Les instructions seront ajoutées lors de son initialisation.

## Documentation de travail

- `AGENTS.md` : règles de contribution des agents ;
- `CONTEXT.md` : vocabulaire métier ;
- `docs/ARCHITECTURE.md` : architecture technique ;
- `DESIGN.md` : règles visuelles ;
- `sujet/` : documents et maquettes fournis.

Cette documentation accompagne le développement dans le dépôt privé.
