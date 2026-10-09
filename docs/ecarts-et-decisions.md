# Registre des écarts et décisions

Ce registre recense chaque écart avec le sujet, les maquettes ou le backend fourni, ainsi que les choix techniques ou produit qui demandent une justification en soutenance. Il complète `DESIGN.md`, `docs/ARCHITECTURE.md` et les ADR, qui détaillent la mise en œuvre.

Chaque entrée indique la référence d'origine, l'écart ou le choix, sa justification et le ticket concerné. Une entrée est ajoutée dans le même changement que la décision ; elle n'est jamais supprimée, seulement marquée « remplacée par … » si la décision évolue.

Types : **Maquette** (écart visuel ou fonctionnel avec `sujet/maquette`), **Sujet** (écart avec `sujet/`), **Backend** (incohérence du backend fourni, conservé sans modification), **Choix** (décision technique ou produit sans écart imposé).

## Authentification et session

### D01 — Authentification directe avec JWT en `sessionStorage` (Choix, #4)

- **Référence** : backend Express (`data.token`, `Authorization: Bearer`) ; sujet (éviter `localStorage` pour les données sensibles).
- **Décision** : le frontend appelle Express directement et conserve le JWT dans `sessionStorage` pour l'onglet courant. Le BFF Next.js avec cookie HttpOnly initialement prévu est suspendu.
- **Justification** : Express ne crée ni ne lit de cookie ; un BFF ajoutait une couche de traduction des requêtes. `sessionStorage` limite la durée de vie du token à l'onglet. Limite assumée : le token est lisible par le JavaScript (risque XSS).
- **Détails** : [ADR 0001](adr/0001-direct-express-authentication.md).

### D02 — Garde des pages côté navigateur uniquement (Choix, #5)

- **Référence** : sujet (routes privées inaccessibles sans token).
- **Décision** : `AppShell` masque l'application et redirige vers `/login` si l'onglet n'a pas de token. Le HTML rendu par le serveur n'est pas protégé et le JWT n'est pas vérifié localement.
- **Justification** : un Server Component ne peut pas lire `sessionStorage`. Express reste l'autorité : aucune donnée n'est servie sans JWT valide.

### D03 — Traitement commun des réponses `401` (Choix, #5)

- **Décision** : `authenticatedFetch` efface la session sur toute réponse `401` et la page de connexion explique l'expiration (`/login?reason=session-expired`).
- **Justification** : un seul point de gestion pour toutes les pages ; exception documentée en B01.

### D04 — CORS limité à `localhost` (Backend, #4)

- **Référence** : configuration CORS d'Express (`localhost:8000`, `localhost:8001` ; `https://votre-domaine.com` en production).
- **Décision** : le frontend tourne sur `localhost:8001`. Depuis Windows avec WSL, ouvrir `http://localhost:8001`, pas l'adresse IP de WSL.
- **Justification** : le backend n'est pas modifié. Le domaine de production demandera une décision avant déploiement.

## Structure et navigation

### D05 — Pas de page de présentation : `/` est le tableau de bord (Maquette, #5)

- **Référence** : aucune maquette ni spécification de page d'accueil publique.
- **Décision** : la page de présentation initiale est supprimée. `/` affiche le tableau de bord ; sans session, l'utilisateur arrive sur la connexion.
- **Justification** : fidélité au sujet, qui commence par la connexion puis le tableau de bord.

### D06 — Page 404 Abricot (Maquette, #5)

- **Référence** : aucune maquette de page 404 ; exigée par le ticket du shell.
- **Décision** : page publique avec logo, titre et retour au tableau de bord, dans l'identité Abricot.

### D07 — « Mon compte » et la déconnexion dans un menu sur l'avatar (Maquette, #6)

- **Référence** : `Dashboard.png`, `Projets.png`, `Mon compte.png` (avatar « AD » sans lien « Mon compte » ni bouton de déconnexion).
- **Décision** : la navigation contient seulement « Tableau de bord » et « Projets ». L'avatar affiche les initiales réelles et ouvre un menu `DropdownMenu` avec « Mon compte » et « Se déconnecter ».
- **Justification** : la déconnexion est indispensable mais absente des maquettes ; le menu la rend accessible sans ajouter d'élément visible à l'en-tête.

### D08 — Avatar actif en `link` au lieu de `primary` (Maquette, #6)

- **Référence** : `Mon compte.png` (avatar orange `#D3590B`, initiales blanches).
- **Décision** : sur `/account`, l'avatar utilise `#AD4706` (`link`).
- **Justification** : blanc sur `#D3590B` donne environ 4,0:1, sous le seuil AA de 4,5:1 pour des initiales de 14 px ; `#AD4706` donne environ 5,7:1.

### D09 — Textes orange en `link` (`#AD4706`) (Maquette, #3)

- **Référence** : orange de marque `#D3590B` utilisé pour des textes dans les maquettes.
- **Décision** : l'orange de marque reste réservé aux pictogrammes et accents ; les textes orange utilisent `#AD4706`.
- **Justification** : `#D3590B` atteint 4,04:1 sur blanc, insuffisant pour du texte normal (AA 4,5:1).

## Inscription et connexion

### D10 — Champ « Nom » obligatoire à l'inscription (Maquette + Backend, #4)

- **Référence** : `Sign In.png` (e-mail et mot de passe seulement) ; Swagger (nom obligatoire) ; contrôleur Express (nom optionnel).
- **Décision** : champ « Nom » obligatoire, au moins deux caractères.
- **Justification** : le nom sert à l'affichage (initiales, membres, assignations) ; décision du porteur du projet face à la contradiction Swagger/code.

### D11 — Pas de lien « Mot de passe oublié ? » (Maquette, #4)

- **Référence** : `Log In.png`.
- **Justification** : aucun endpoint de réinitialisation dans le backend ; un lien inactif serait trompeur.

## Compte

### D12 — Un seul champ « Nom » au lieu de « Nom » et « Prénom » (Maquette, #6)

- **Référence** : `Mon compte.png` ; backend `User.name` (champ unique, optionnel).
- **Décision** : un seul champ « Nom », lié à `name`.
- **Justification** : découper un nom unique au premier espace casse les prénoms composés ; cohérent avec l'inscription (D10).

### D13 — Deux formulaires indépendants (Maquette, #6)

- **Référence** : `Mon compte.png` (un seul champ mot de passe, un seul bouton) ; Express `PUT /auth/profile` et `PUT /auth/password` (mot de passe actuel requis).
- **Décision** : formulaire « Informations » (nom, e-mail) et formulaire « Mot de passe » (actuel, nouveau, confirmation locale), chacun avec son bouton.
- **Justification** : deux endpoints distincts ; un bouton unique ferait deux requêtes non atomiques avec des résultats partiels difficiles à expliquer.

## Incohérences du backend (backend conservé sans modification)

### B01 — `401` pour un mot de passe actuel incorrect (Backend, #6)

- **Référence** : `authController.ts` (`updatePassword`, code `INVALID_CURRENT_PASSWORD`, statut `401`).
- **Impact** : le traitement commun des `401` (D03) déconnecterait l'utilisateur après une simple faute de saisie.
- **Décision** : `authenticatedFetch` conserve la session pour ce seul code d'erreur ; le formulaire affiche l'erreur sur le champ. Tous les autres `401` déconnectent.

### B02 — Réponse de `GET /auth/profile` différente du Swagger (Backend, #5)

- **Référence** : Swagger (`data` = utilisateur) ; contrôleur (`data.user`).
- **Décision** : le frontend suit le contrôleur réel et valide la réponse à l'exécution.

### B03 — E-mail déjà utilisé en `409` (Backend, #6)

- **Référence** : `updateProfile` renvoie `409 EMAIL_ALREADY_EXISTS`.
- **Décision** : l'erreur est affichée sur le champ e-mail à partir du code réel.

### B04 — Message de validation du mot de passe incomplet (Backend, #6)

- **Référence** : `validation.ts` (le message ne mentionne ni le symbole obligatoire ni les caractères autorisés, contrairement à la regex).
- **Décision** : le frontend applique exactement la regex d'Express et affiche toutes les règles avant la saisie.

### B05 — Nom vide refusé malgré le code de mise à jour (Backend, #6)

- **Référence** : `validateUpdateProfileData` refuse un nom vide, alors que `updateProfile` prévoit `name.trim() || null`.
- **Décision** : l'interface ne propose pas d'effacer un nom existant.

## Choix techniques

### T01 — TanStack Query pour les données distantes (Choix, #6)

- **Référence** : spécification #18.
- **Décision** : introduit au deuxième usage réel (profil partagé entre le shell et le compte). Le provider ne couvre que les pages de l'application et disparaît à la déconnexion.

### T02 — Primitives shadcn/ui adaptées à Abricot (Choix, #3, #6)

- **Décision** : tout contrôle fourni par shadcn/ui (`Button`, `Input`, `Label`, `DropdownMenu`…) passe par sa primitive, adaptée aux tokens Abricot et réduite aux parties utilisées.
- **Justification** : comportements accessibles éprouvés (focus, clavier, ARIA) et cohérence visuelle. Le CLI a importé un paquet npm `cn` erroné et le thème générique : corrigés manuellement.

### T03 — Groupes de routes `(app)` et `(auth)` (Choix, #5)

- **Décision** : les pages de l'application sont sous `(app)` avec le shell commun ; les pages publiques de connexion et d'inscription sont l'exception, sous `(auth)`.

### T04 — Polices Inter et Manrope chargées localement (Choix, #3)

- **Référence** : polices confirmées par le porteur du projet.
- **Décision** : chargement via `@fontsource`, sans requête vers un service externe.
