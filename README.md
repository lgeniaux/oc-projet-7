# Abricot

Abricot est une application de gestion de projets en équipe, réalisée pour le projet 7 du parcours OpenClassrooms. Elle permet de créer des projets, d'y inviter des contributeurs, de répartir des tâches et de suivre leur avancement depuis un tableau de bord personnel.

- **Frontend** : Next.js 16, React, TypeScript, Tailwind CSS et shadcn/ui (`src/frontend`).
- **Backend** : l'API Express / Prisma / SQLite fournie par OpenClassrooms, intégrée comme sous-module Git et laissée telle quelle (`src/backend`).

## Prérequis

- Node.js 22.22.2+ ou 24.15.0+, avec npm (testé avec Node 24.18.0).
- Les ports **8000** (API) et **8001** (application) libres.

Pas besoin d'installer de base de données : le backend utilise un fichier SQLite.

## Installation

### 1. Cloner le dépôt

```bash
git clone --recurse-submodules git@github.com:lgeniaux/oc-projet-7.git
cd oc-projet-7
```

Si le dépôt est déjà cloné sans le backend : `git submodule update --init --recursive`.

### 2. Lancer le backend

Dans un premier terminal :

```bash
cd src/backend
npm ci
cp .env.example .env
```

Dans `.env`, remplacer `MY_SECRET` par une chaîne aléatoire, par exemple celle donnée par `openssl rand -hex 32`. Ensuite :

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

L'API répond sur <http://localhost:8000>. Sa documentation Swagger est sur <http://localhost:8000/api-docs>.

> `npm run seed` vide la base avant d'y créer les données de démonstration.

### 3. Lancer le frontend

Dans un second terminal :

```bash
cd src/frontend
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir **<http://localhost:8001>**. Sous Windows avec WSL, utiliser bien `localhost` et pas `127.0.0.1` : le backend n'accepte que cette origine.

## Comptes de démonstration

Tous les comptes créés par le seed ont le mot de passe **`P@ssword123`**. Pour commencer, utiliser `alice@example.com`. Les autres comptes sont `bob@`, `caroline@`, `david@`, `emma@`, `francois@`, `gabrielle@`, `henri@`, `isabelle@` et `jacques@example.com`.

Les échéances des tâches de démonstration sont en 2024 : pour les voir dans le Kanban du mois, revenir à ces mois-là ou créer une tâche avec une date actuelle.

## Fonctionnalités

- Inscription, connexion et déconnexion ; modification du nom, de l'e-mail et du mot de passe.
- Projets : création, modification, suppression et gestion des contributeurs, selon le rôle de chacun.
- Tâches : création, modification, suppression, échéance, priorité, statut, assignation à une ou plusieurs personnes et commentaires.
- Tableau de bord : tâches assignées, Kanban du mois et projets, avec les plus urgents en premier.
- Interface en français, responsive et accessible au clavier et aux lecteurs d'écran (objectif WCAG 2.1 AA).

## Tests et vérifications

Depuis `src/frontend` :

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Pour les tests end-to-end (Playwright), le backend doit tourner sur le port 8000 avec une base seedée. Utiliser une base de test : les tests créent de vraies données.

```bash
npx playwright install chromium   # la première fois seulement
npm run test:e2e
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) : organisation du code, flux de données et tests.
- [`DESIGN.md`](DESIGN.md) : charte graphique, composants et accessibilité.
- [`docs/ecarts-et-decisions.md`](docs/ecarts-et-decisions.md) : écarts avec les maquettes ou le backend, et choix techniques.
- [`docs/adr/`](docs/adr/) : décisions d'architecture.
- [`docs/autoevaluation.md`](docs/autoevaluation.md) : fiche d'autoévaluation, avec une preuve pour chaque point.
- [`sujet/`](sujet/) : énoncé, spécifications et maquettes.
