---
version: alpha
name: Abricot
description: Identité visuelle de l'application de gestion collaborative de projets.
colors:
  primary: "#D3590B"
  primary-soft: "#FFE8D9"
  link: "#AD4706"
  background: "#F9FAFB"
  surface: "#FFFFFF"
  text: "#1F1F1F"
  muted: "#6B7280"
  border: "#E5E7EB"
  action: "#1F1F1F"
  action-hover: "#0F0F0F"
  on-action: "#FFFFFF"
  status-todo: "#9F1239"
  status-todo-soft: "#FFE4E6"
  status-progress: "#854D0E"
  status-progress-soft: "#FEF3C7"
  status-done: "#166534"
  status-done-soft: "#DCFCE7"
typography:
  heading-lg:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.2
  heading-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
rounded:
  sm: 8px
  md: 10px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.md}"
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
---

# Abricot Design System

## Overview

Abricot est un outil de gestion collaborative de projets destiné principalement aux freelances. L'interface des maquettes est sobre, claire et aérée : fonds très clairs, surfaces blanches, texte sombre, orange pour l'identité et certains repères, actions principales sombres. La cible est une fidélité forte, sans pixel-perfect. L'accessibilité WCAG 2.1 AA et le responsive priment sur les détails décoratifs.

Sources : `sujet/maquette/Dashboard.png`, `Dashboard vue Kanban.png`, `Projets.png`, `Single projet.png`, `Log In.png`, `Sign In.png`, `Mon compte.png` et `Modale création projet.png` (PNG desktop 1440 px et SVG du logo). Les aplats de couleurs sont relevés par échantillonnage RGB ; les espacements, rayons et tailles sont regroupés à partir de leurs dimensions visibles et ajustés à une échelle simple, sans viser le pixel-perfect. Inter et Manrope sont confirmées par le porteur du projet. Les tailles d'écrans métier restent indicatives ; le thème Tailwind utilise les tokens ci-dessous, et les pages futures les adapteront selon leurs besoins.

Référence de format : [spécification Google DESIGN.md (alpha)](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md). Vérifier le document avec `cd src/frontend && npm run design:lint`.

## Colors

- **Primary (`#D3590B`)** : orange de la marque et du logo (`Logo.svg`, attribut `fill`), employé pour les pictogrammes et accents. À 4,04:1 sur blanc, il **ne convient pas aux petits textes**.
- **Link (`#AD4706`)** : adaptation plus sombre de l'orange de marque pour les textes sur fond clair (5,71:1 sur blanc, 5,46:1 sur le fond de page). Ce ton est un choix d'accessibilité, non un prélèvement de la maquette.
- **Background (`#F9FAFB`)** : fond des vues et du panneau de connexion.
- **Surface (`#FFFFFF`)** : cartes, modales, en-tête et champs.
- **Text / action (`#1F1F1F`)** : texte principal et fond des actions principales ; `on-action` blanc (16,48:1). `Action-hover` (`#0F0F0F`) est prélevé sur la navigation active.
- **Muted (`#6B7280`)** : descriptions et métadonnées ; **border (`#E5E7EB`)** : contours discrets.

Le gris `muted` sur blanc atteint 4,83:1 et sur `background` 4,63:1. Ces ratios sont calculés selon la formule WCAG pour du texte normal (seuil AA 4,5:1). Les statuts sont accompagnés de texte : `status-todo` sur `status-todo-soft` (rose, 6,68:1), `status-progress` sur `status-progress-soft` (ambre, 6,15:1), `status-done` sur `status-done-soft` (vert, 6,49:1). « Annulée » utilise `text` sur `border` (gris, 13,31:1). Les tons sombres sont des adaptations AA des familles de couleurs de la maquette, pas des prélèvements exacts.

## Typography

**Manrope** est la police des titres et **Inter** celle du corps de texte (information confirmée par le porteur du projet). Le frontend charge localement les variantes latines Manrope 600, Inter 400 et 500 via `@fontsource`. Les vues desktop suggèrent des titres de page autour de 24 px, des titres de carte autour de 20 px et du texte courant autour de 16 px. `heading-lg` (36 px) sert au titre des pages d'authentification, pas aux titres de page des vues métier. Préserver des titres sémantiques et une interligne lisible ; confirmer les tailles lors de chaque écran.

## Layout

Les maquettes desktop sont fournies en largeur 1440 px. Le dashboard a un en-tête d'environ 94 px de haut ; son contenu est centré (environ 100 px de marge de chaque côté). La grille des projets comporte trois colonnes avec des intervalles d'environ 16 px ; le Kanban utilise trois colonnes avec des intervalles d'environ 22 px. Ces mesures servent de repères, pas de contraintes sur petit écran. Les espacements de 8, 16, 24, 32 et 48 px normalisent les écarts observés. Les pages d'authentification reprennent le panneau clair (39 % de la largeur desktop) et l'image à droite des maquettes. Sur petit écran, l'image décorative est masquée et le formulaire utilise toute la largeur disponible, sans défilement horizontal.

Sur tablette et mobile, conserver l'ordre de lecture, replier les colonnes et préserver des contrôles utilisables sans défilement horizontal. Ne pas déduire de seuils de rupture arbitraires des seules maquettes desktop.

## Elevation & Depth

La hiérarchie s'appuie d'abord sur le contraste entre le fond clair et les surfaces blanches, ainsi que sur des bordures légères. Les ombres, si nécessaires, doivent rester discrètes ; aucune échelle d'élévation n'est encore validée.

## Shapes

Les cartes, champs et boutons présentent des coins légèrement arrondis (environ 8 à 10 px sur les PNG) : `sm` 8 px et `md` 10 px. Les avatars et badges sont arrondis complètement (`full`). Ces mesures rationalisées doivent rester cohérentes entre composants.

## Components

Le bouton shadcn/ui est la première primitive intégrée, avec seulement les variantes `default` (fond sombre, texte blanc) et `outline` (fond blanc bordé). Hauteur minimale de 48 px, rayon de 10 px, focus clavier visible et état désactivé explicite. Ce thème remplace les valeurs neutres par défaut du générateur ; ne pas réimporter son thème générique lors de l'ajout d'autres primitives. `lucide-react` fournit les pictogrammes fonctionnels ; les logos officiels SVG restent des fichiers locaux, avec une alternative textuelle pertinente selon le contexte.

Les cartes présentent un fond blanc et une bordure discrète, sans ombre par défaut. Les formulaires de connexion, d'inscription et du compte utilisent les primitives shadcn/ui `Input` et `Label`, adaptées au thème Abricot. `Input` mesure 48 px de haut, avec un fond `surface`, une bordure `border`, un rayon `sm`, un texte `text` et un placeholder `muted`. Le focus clavier affiche un anneau `link` de 2 px avec un décalage de 2 px ; `aria-invalid` colore la bordure en `link`, sans remplacer le message d'erreur. L'état désactivé utilise le fond `background`, une opacité réduite et un curseur explicite. `Label` garde un texte lisible et est relié au champ par son identifiant. Les modales reposent sur `Dialog` (et `AlertDialog` pour les confirmations de suppression) et doivent gérer le focus, Échap et les annonces accessibles.


L'inscription ajoute un champ « Nom » obligatoire (au moins deux caractères) aux champs e-mail et mot de passe de `Sign In.png`, sur décision du porteur du projet : le visuel de référence n'en comporte que deux, tandis que la documentation Swagger le déclare obligatoire et que le code Express l'accepte comme optionnel. La connexion suit `Log In.png` sans afficher le lien « Mot de passe oublié ? », faute de contrat backend. Les photos décoratives proviennent du recadrage des parties droites des maquettes et sont chargées localement.

Les champs d'authentification et du compte sont explicitement étiquetés. Les erreurs de champ sont reliées par `aria-describedby`, signalées par `aria-invalid`, annoncées par `role="alert"` et colorées avec `link` (contraste AA) ; les erreurs serveur sont aussi annoncées. L'aide au nouveau mot de passe est affichée avant la saisie : au moins huit caractères, une majuscule ASCII, une minuscule ASCII, un chiffre et un symbole parmi `@$!%*?&` ; seuls les lettres ASCII, les chiffres et ces symboles sont autorisés, conformément à la regex Express. Le bouton est désactivé pendant l'envoi et son texte annonce l'état de chargement. Les liens de navigation restent accessibles au clavier.

Le shell commun à `/` (tableau de bord), `/projects`, `/projects/[id]` et `/account` attend la lecture de `sessionStorage` avant d'afficher son contenu : un message de chargement annoncé évite un flash de contenu lors du retour à `/login`. L'en-tête blanc bordé reprend le logo, la navigation et l'avatar des maquettes Dashboard, Projets et Mon compte. La navigation contient seulement « Tableau de bord » et « Projets » ; la destination courante a un fond sombre, un texte blanc et `aria-current="page"`, les autres liens utilisent `link`. La section Projets reste active dans le détail. L'avatar circulaire (56 px) affiche les initiales réelles du profil : premières lettres du premier et du dernier mot du nom, ou première lettre de l'e-mail sans nom ; une icône neutre le remplace pendant le chargement. Au repos il utilise `primary-soft` (`#FFE8D9`, relevé sur `Dashboard.png`) avec le texte `text` ; sur `/account`, la maquette montre un aplat `primary` avec texte blanc, mais ce couple n'atteint qu'environ 4,0:1 pour des initiales de 14 px : l'avatar utilise donc `link` (`#AD4706`, environ 5,7:1). L'avatar est le déclencheur nommé « Menu du compte » d'un `DropdownMenu` shadcn/ui : le menu rappelle le nom (ou l'e-mail) puis propose « Mon compte » et « Se déconnecter ». La maquette ne montre ni lien « Mon compte » dans la navigation ni bouton de déconnexion ; ce menu donne accès aux deux sans les ajouter à l'en-tête. Le nom réel reçu d'Express est affiché s'il existe et suit les modifications du compte grâce au profil partagé.

La page « Mes projets » reprend `Projets.png` : sous-titre « Gérez vos projets », grille avec un intervalle de 16 px, une colonne sur mobile, deux à partir de `md` (768 px), trois à partir de `lg` (1024 px). Les cartes blanches bordées, sans ombre, comportent le nom (`h2`), la description, la progression et l'équipe. Chaque carte est un lien unique vers le détail, nommé par le titre du projet, avec focus `link` visible de 2 px et sans contrôle interactif imbriqué. Les textes et les équipes peuvent se replier pour éviter le débordement.

`Avatar`/`AvatarFallback` et `Progress` shadcn/ui sont ajoutés au premier usage et limités aux parties employées. L'avatar propriétaire utilise `primary-soft` (`brand-soft` dans le CSS) ; les avatars des autres membres utilisent le gris `border`, avec les initiales `text`. Le gros badge « Propriétaire » de la maquette est remplacé, à la demande du porteur du projet, par une petite couronne `link` centrée au-dessus de son avatar : repère compact distinct par sa forme, sans pill ni texte supplémentaire. Les initiales et la couronne sont décoratives ; chaque avatar est nommé par le nom réel ou l'e-mail de la personne et son rôle (`aria-label` et `title`). « Équipe (N) » compte le propriétaire en plus des membres ; son avatar et sa couronne précèdent les avatars gris des membres. Le rôle du lecteur est indiqué en texte, sans confondre un propriétaire et un membre administrateur.

La progression est annoncée en pourcentage et en « x/y tâches terminées », avec une barre `Progress` nommée pour le projet. Les tâches annulées sont exclues du total ; zéro tâche éligible affiche 0 % et « Aucune tâche ». Un chargement ou une erreur des tâches reste local à la progression sans remplacer le reste de la carte ni afficher un faux 0 %. Le chargement de la liste est annoncé ; une erreur est expliquée avec un bouton de relance. L'état vide précise que les projets apparaissent quand l'utilisateur en crée un ou est ajouté comme contributeur. Le bouton « + Créer un projet » de la maquette est volontairement absent : son action arrive avec la création au ticket #8, sans faux contrôle provisoire.

Le détail de `Single projet.png` présente le retour « Mes projets », le nom (`h1`) et la description, puis la barre de contributeurs et la liste des tâches réelles. Les états chargement et erreur restent annoncés. Les réponses `403` et `404` affichent le même message neutre « Ce projet n'existe pas ou vous n'y avez pas accès. », sans révéler l'existence du projet. Les contrôles « Modifier », « Créer une tâche », « IA », les menus de tâche, le choix Liste/Calendrier, le filtre Statut et la recherche sont absents du périmètre de consultation, pas affichés comme de fausses actions.

**Barre de contributeurs** : fond `border/30`, rayon `md`, espacement de 16 à 24 px, titre `h2` et nombre de personnes incluant le propriétaire. Une liste visible associe chaque avatar décoratif à un nom (ou e-mail) qui se replie. Le propriétaire apparaît en premier avec avatar `brand-soft` et la couronne `OwnerCrown` au-dessus ; un texte réservé aux lecteurs d'écran ajoute « Propriétaire » après son nom. Les membres utilisent `border` et `text`.

**Règle récurrente : repère du propriétaire.** Partout où un propriétaire de projet est affiché (cartes, détail, futures vues), il est signalé par la petite couronne `link` centrée au-dessus de son avatar (`modules/projects/owner-crown.tsx`), jamais par un badge texte « Propriétaire ». La couronne est décorative : le rôle reste donné en texte accessible (nom accessible de l'avatar ou texte `sr-only`).

**Carte de tâche et badge de statut** : la section blanche bordée porte le titre `h2` « Tâches » et le sous-titre « Par ordre de priorité, puis d’échéance ». Les cartes sont empilées en une seule colonne à toute largeur, avec bordure `border`, rayon `md`, padding 16 px sur mobile puis 24 px et titres `h3`. Le statut textuel est une pill arrondie utilisant les tokens AA décrits dans Colors : « À faire », « En cours », « Terminée » ou « Annulée ». La description et les libellés utilisent `muted`, les informations `text`. Les échéances gardent toujours l'année (ex. « 9 mars 2026 ») pour distinguer les dates seedées anciennes ; une valeur nulle affiche « Aucune échéance ».

Les assignés sont une liste avec avatars décoratifs et noms visibles, ou « Non assignée ». La ligne « Commentaires (n) » est un déclencheur `Collapsible` shadcn/ui avec hauteur minimale de 48 px, focus `link` de 2 px et chevron décoratif ; la primitive expose l'état ouvert/fermé via `aria-expanded`. Son contenu liste les vrais commentaires (auteur, date française, texte), en lecture seule, ou « Aucun commentaire. ». Aucun bouton d'ajout n'est introduit. Les contributeurs, métadonnées et textes longs peuvent se replier ; les cartes restent sur une colonne mobile/tablette/desktop sans largeur fixe ni défilement horizontal.

La page « Mon compte » reprend la carte blanche bordée et l'empilement vertical de `Mon compte.png`. Le formulaire d'informations contient « Nom » et « E-mail », avec le bouton « Modifier les informations ». Le seul champ « Nom » correspond au champ backend `name` : contrairement aux deux champs « Nom » et « Prénom » de la maquette, aucune séparation artificielle ni donnée fictive n'est ajoutée. Un nom absent est affiché vide ; l'interface ne promet pas d'effacer un nom existant, car le backend refuse un nom vide fourni.

Une seconde section dans la même carte propose un formulaire indépendant avec « Mot de passe actuel », « Nouveau mot de passe » et sa confirmation, puis le bouton « Modifier le mot de passe ». Ces deux formulaires remplacent volontairement le seul champ mot de passe et le bouton unique de la maquette : les routes Express de profil et de mot de passe sont distinctes et le changement de mot de passe exige l'actuel. Aucun mot de passe existant ni faux masque prérempli n'est affiché. Sur petit écran, préserver l'ordre des sections et des champs, les marges lisibles et l'absence de défilement horizontal.

Le chargement du compte est annoncé par `role="status"` ; une erreur de lecture du profil est annoncée par `role="alert"`, sans inventer de valeurs ni afficher des formulaires préremplis fictivement. Chaque formulaire annonce ses erreurs indépendamment. Les réussites sont annoncées par `role="status"` avec « Vos informations ont été mises à jour. » ou « Votre mot de passe a été modifié. » ; une couleur seule ne suffit jamais. Les champs de mot de passe sont vidés après succès.

Sur desktop (à partir de `lg`, 1024 px), l'en-tête tient sur une ligne. Sur mobile et tablette, le logo et l'avatar restent sur la première ligne et la navigation passe sur une seconde ligne : aucun menu de navigation masqué, aucun piège de focus ni défilement horizontal. Les contrôles mesurent au moins 48 px de haut, conservent leurs libellés et un focus visible de 2 px. L'ordre clavier suit les liens des sections, puis l'avatar. Le menu du compte s'ouvre avec Entrée, Espace ou la flèche bas, se parcourt aux flèches, se ferme avec Échap et rend le focus à l'avatar (comportement Radix). Le lien d'évitement « Aller au contenu » précède l'en-tête et cible le contenu focalisable. Les changements de route utilisent la gestion de focus native de Next.js.

La déconnexion est accessible au clavier depuis le menu du compte. Une réponse Express `401` efface la session et renvoie à la connexion avec un message de session expirée annoncé par `role="status"`, sauf le refus métier identifié par `INVALID_CURRENT_PASSWORD`. Le backend utilise aussi `401` pour ce mot de passe actuel incorrect : l'exception ciblée approuvée conserve la session et annonce une erreur sur le champ « Mot de passe actuel », sans effacer la saisie ni quitter le compte. Toutes les autres réponses `401` entraînent une reconnexion. Une panne de profil est aussi annoncée, sans masquer les liens ni inventer une identité. La 404 reprend le logo Abricot, l'accent `link`, un titre sémantique et un lien sombre de retour au tableau de bord ; elle reste publique et fonctionne aussi sans session.

## Do's and Don'ts

- Préserver la hiérarchie des maquettes sans compromettre WCAG 2.1 AA ni la lecture sur petit écran.
- Conserver des libellés et messages en français ; accompagner statuts et erreurs de texte, pas seulement de couleur.
- Ne pas employer l'orange brut comme petit texte sur fond clair ; utiliser `link` pour les textes et vérifier chaque contraste.
- Ne pas imposer les valeurs par défaut de shadcn/ui lorsque les maquettes montrent une autre identité.
