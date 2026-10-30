# Projet 7 — Abricot

Application de gestion collaborative de projets et de tâches réalisée pour le parcours OpenClassrooms : frontend Next.js 16 / React / TypeScript et backend Express fourni, conservé sans modification dans un sous-module Git.

## Prérequis

- Git, avec accès à ce dépôt et au sous-module public du backend.
- Node.js **22.22.2 minimum dans la branche 22**, ou **24.15.0 minimum dans la branche 24**, avec npm. Next.js seul exige Node 20.9+, mais les dépendances de test verrouillées (`jsdom`, notamment) exigent ces versions plus récentes. Installation vérifiée avec Node **24.18.0**.
- Les ports locaux **8000** (Express) et **8001** (Next.js) disponibles pour démarrer l'application.

SQLite est utilisé localement : aucun serveur de base de données séparé n'est nécessaire. Les deux applications ont chacune leur `package.json` et leur fichier de verrouillage ; utiliser `npm ci` dans chacun des dossiers, pas à la racine.

## 1. Cloner avec le backend

```bash
git clone --recurse-submodules git@github.com:lgeniaux/oc-projet-7.git
cd oc-projet-7
```

Si le dépôt a déjà été cloné sans ses sous-modules, exécuter **depuis sa racine** :

```bash
git submodule update --init --recursive
```

## 2. Installer et préparer le backend

Dans un premier terminal, depuis la racine du dépôt :

```bash
cd src/backend
npm ci
cp .env.example .env
node -e "const fs = require('node:fs'); const crypto = require('node:crypto'); fs.writeFileSync('.env', fs.readFileSync('.env', 'utf8').replace('MY_SECRET', crypto.randomBytes(32).toString('hex')));"
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
```

La commande Node remplace le secret factice de l'exemple par une valeur aléatoire locale. Le fichier `.env` conserve `DATABASE_URL="file:./db.sqlite"` : Prisma crée la base dans `src/backend/prisma/db.sqlite` et applique les migrations fournies. Ne pas versionner `.env`, la base ou le secret. Aucun `prisma db push` n'est nécessaire.

**Attention : `npm run seed` efface toutes les données de cette base avant de recréer les données de démonstration.** Ne l'exécuter que sur une base locale jetable, jamais sur une base à conserver.

Puis démarrer Express dans ce terminal (commande persistante, nécessaire aux parcours et aux tests E2E) :

```bash
npm run dev
```

API : <http://localhost:8000> ; documentation Swagger : <http://localhost:8000/api-docs>. Le [README du backend](src/backend/README.md) décrit son API et ses permissions.

## 3. Installer et démarrer le frontend

Dans un **second terminal**, depuis la racine du dépôt :

```bash
cd src/frontend
npm ci
cp .env.example .env.local
```

L'exemple configure `NEXT_PUBLIC_API_URL=http://localhost:8000`. Cette variable est publique et lue par le navigateur : ne jamais y mettre de secret.

Puis démarrer Next.js dans ce terminal (commande persistante) :

```bash
npm run dev
```

Ouvrir **<http://localhost:8001>**. Sans session, l'application redirige vers la connexion. Express doit rester démarré pour l'inscription, la connexion et les données métier.

**Windows / WSL et CORS :** ouvrir cette URL avec `localhost`, pas `127.0.0.1` ni l'adresse IP de WSL. Le backend fourni autorise uniquement les origines locales prévues ; changer l'URL du frontend ne change pas cette liste (décision [D04](docs/ecarts-et-decisions.md#d04--cors-limité-à-localhost-backend-4)).

### Comptes de démonstration

Le seed crée dix comptes, tous avec le mot de passe public **`P@ssword123`** :

- `alice@example.com` (Alice Martin, compte conseillé pour commencer), `bob@example.com` ;
- `caroline@example.com`, `david@example.com`, `emma@example.com` ;
- `francois@example.com`, `gabrielle@example.com`, `henri@example.com` ;
- `isabelle@example.com`, `jacques@example.com`.

Il crée aussi 5 projets, 17 tâches et 25 commentaires. Les échéances du seed sont en **2024** : dans le Kanban mensuel, naviguer jusqu'au mois concerné ou créer une tâche de démonstration avec une échéance actuelle.

## 4. Vérifier le frontend

Depuis `src/frontend` :

| Commande                          | Objet / prérequis                                                                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                    | ESLint.                                                                                                                                                               |
| `npm run typecheck`               | Vérification TypeScript sans émission.                                                                                                                                |
| `npm test`                        | Tests unitaires et de composants, sans serveur.                                                                                                                       |
| `npm run build`                   | Compilation de production, sans serveur.                                                                                                                              |
| `npm run format:check`            | Vérification Prettier, sans modification.                                                                                                                             |
| `npm run design:lint`             | Validation du `DESIGN.md` de la racine.                                                                                                                               |
| `npx playwright install chromium` | Installation du navigateur pour les tests E2E, une fois par environnement.                                                                                            |
| `npm run test:e2e`                | **Nécessite Express sur `localhost:8000` avec une base migrée et seedée.** Playwright démarre Next.js sur `localhost:8001`, ou réutilise le serveur existant hors CI. |

Sur Linux, installer les bibliothèques système éventuellement signalées par Playwright selon votre distribution (droits système possibles). Utiliser une **base dédiée aux tests E2E** : les parcours créent des comptes et des données réelles, même si les projets et tâches jetables sont nettoyés. Ne pas lancer la suite sur des données à conserver.

Les tests E2E et les deux commandes de démarrage nécessitent les serveurs et ports indiqués ; les autres vérifications ne nécessitent aucun serveur. Voir le [README frontend](src/frontend/README.md) pour les détails de configuration et de tests.

## Périmètre livré et limites

### Fonctionnalités obligatoires livrées

- Inscription, connexion, déconnexion ; modification du nom, de l'e-mail et du mot de passe.
- Projets accessibles, progression, création, modification, suppression confirmée et ajout/retrait de contributeurs selon les permissions réelles de l'API.
- Liste détaillée des tâches d'un projet ; création, modification, suppression confirmée, échéance, priorité, statut et assignation à une ou plusieurs personnes.
- Lecture et ajout de commentaires aux tâches.
- Tableau de bord personnel : liste des tâches assignées par urgence, Kanban mensuel par statut et liste des projets avec tâches assignées par urgence.
- Interface française responsive ; contrôles clavier, libellés, annonces d'état et contrastes conçus pour WCAG 2.1 AA. Les choix et écarts sont documentés, sans prétendre à une certification d'accessibilité.

### Non livré à ce stade

L'**interface de génération automatique de tâches par IA**, mentionnée dans la mission, n'est pas livrée. Aucun bouton factice n'est affiché.

### Options et bonus non livrés

Drag-and-drop Kanban, recherche et filtres des projets/tâches, authentification OAuth et déploiement public. La recherche de contributeurs à l'ajout d'un membre est disponible ; elle ne constitue pas une recherche globale de projets ou de tâches. Des tests E2E, proposés en bonus dans le sujet, sont en revanche présents.

### Limites connues du backend conservé

Le [registre des écarts et décisions](docs/ecarts-et-decisions.md) détaille les contrats réels et leurs conséquences, notamment :

- **D01–D02, D04** : JWT en `sessionStorage` (accessible au JavaScript), garde de navigation côté navigateur et CORS limité à `localhost` ; Express reste l'autorité des accès.
- **B06** : projet inexistant et projet inaccessible généralement renvoyés en `403` ; message neutre commun.
- **B07, B18–B19** : tri des priorités et statuts des assignations corrigés pour l'affichage côté frontend ; aucun changement de l'API.
- **B09, D41** : association des contributeurs et modification d'un projet non atomiques ; les résultats partiels sont explicités.
- **B11, B16** : seul le propriétaire peut supprimer un projet ; tous les membres peuvent gérer ses tâches, conformément aux permissions Express.
- **B12, B17** : retirer un membre ne supprime pas ses anciennes assignations ; le formulaire d'édition les signale et les retire à l'enregistrement.
- **B15** : statut ignoré par le POST de création de tâche ; un second appel enregistre le statut choisi et un échec partiel est annoncé.

## Structure et documentation

- `src/frontend/` : application Next.js, modules métier, primitives shadcn/ui et tests.
- `src/backend/` : sous-module du backend officiel Express / Prisma / SQLite, non modifié.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) : structure technique, flux de données et stratégie de tests.
- [`DESIGN.md`](DESIGN.md) : tokens, composants et règles visuelles / accessibilité.
- [`CONTEXT.md`](CONTEXT.md) : vocabulaire métier.
- [`docs/ecarts-et-decisions.md`](docs/ecarts-et-decisions.md) : limites et décisions à justifier en soutenance.
- [`AGENTS.md`](AGENTS.md) : règles de contribution ; [`sujet/`](sujet/) : mission, spécifications et maquettes.
