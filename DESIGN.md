---
version: alpha
name: Abricot
description: Identité visuelle de l'application de gestion collaborative de projets.
colors:
  primary: "#D3590B"
  background: "#F9FAFB"
  surface: "#FFFFFF"
  text: "#1F1F1F"
  muted: "#6B7280"
  border: "#E5E7EB"
  action: "#1F1F1F"
  on-action: "#FFFFFF"
typography:
  placeholder-heading:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.2
  placeholder-body:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
spacing:
  placeholder-gutter: 24px
  placeholder-gap: 16px
omitted:
  - section: rounded
    reason: Rayons non encore vérifiés dans les maquettes.
  - section: components
    reason: Aucun composant métier implémenté ; valeurs détaillées à vérifier avant intégration.
---

# Abricot Design System

## Overview

Abricot est un outil de gestion collaborative de projets destiné principalement aux freelances. L'interface des maquettes est sobre, claire et aérée : fonds très clairs, surfaces blanches, texte sombre, orange pour l'identité et certains repères, actions principales sombres. La cible est une fidélité forte, sans pixel-perfect. L'accessibilité WCAG 2.1 AA et le responsive priment sur les détails décoratifs.

Les couleurs ci-dessus ont été relevées sur les aplats des maquettes `sujet/maquette/Dashboard.png` et `sujet/maquette/Projets.png` (pixels RGB). Les dimensions des tokens `placeholder-*` décrivent **uniquement la page d'accueil provisoire** de `src/frontend`, pas les tailles typographiques ni l'espacement définitifs des vues métier. Les familles Inter et Manrope sont, elles, confirmées pour le produit. Les autres tokens sont des références visuelles à intégrer progressivement ; le CSS de la page provisoire ne reflète pas encore l'ensemble du système.

Référence de format : [spécification Google DESIGN.md (alpha)](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md). Vérifier le document avec `cd src/frontend && npm run design:lint`.

## Colors

- **Primary (`#D3590B`)** : orange de la marque, du logo et de repères tels que la navigation inactive ou les liens ; ne pas l'employer automatiquement comme fond de bouton.
- **Background (`#F9FAFB`)** : fond des vues et du panneau de connexion.
- **Surface (`#FFFFFF`)** : cartes, modales, en-tête et champs.
- **Text / action (`#1F1F1F`)** : texte principal et fond des actions principales ; `on-action` blanc.
- **Muted (`#6B7280`)** : descriptions et métadonnées ; **border (`#E5E7EB`)** : contours discrets.

Les couleurs de statut ne sont pas encore normalisées. Ne jamais porter une information uniquement par la couleur ; tester les contrastes réels de chaque paire texte/fond avant intégration.

## Typography

**Manrope** est la police des titres et **Inter** celle du corps de texte (information confirmée par le porteur du projet). Le frontend les charge localement via `@fontsource`, sans requête vers un service de polices au chargement de la page. Les tailles et graisses des tokens `placeholder-*` décrivent uniquement la page d'accueil provisoire (titre de 36 px / 600, texte de 18 px / 400) ; les échelles typographiques des écrans métier restent à relever dans les maquettes. Conserver une hiérarchie de titres logique et une interligne lisible.

## Layout

Les maquettes desktop sont fournies en largeur 1440 px. Le dashboard organise la navigation en haut puis le contenu dans une colonne centrale ; les projets utilisent une grille de trois cartes sur desktop. Les cartes regroupent leurs informations avec des marges généreuses. La page provisoire utilise une gouttière latérale de 24 px et un espacement de 16 px entre ses éléments ; ces valeurs ne définissent pas encore la grille finale.

Sur tablette et mobile, conserver l'ordre de lecture, replier les colonnes et préserver des contrôles utilisables sans défilement horizontal. Ne pas déduire de seuils de rupture arbitraires des seules maquettes desktop.

## Elevation & Depth

La hiérarchie s'appuie d'abord sur le contraste entre le fond clair et les surfaces blanches, ainsi que sur des bordures légères. Les ombres, si nécessaires, doivent rester discrètes ; aucune échelle d'élévation n'est encore validée.

## Shapes

Les cartes, champs et boutons présentent des coins légèrement arrondis, les avatars et badges sont plus arrondis. Les rayons précis restent à mesurer avant création de tokens `rounded` ; ne pas traiter les formes de la page provisoire comme norme.

## Components

Les maquettes montrent des actions principales sombres à texte blanc, des cartes à fond blanc bordées, des champs explicitement étiquetés et des badges de statut. Les composants réels ne sont pas encore implémentés : les dimensions, états interactifs, focus, erreurs et variantes devront être documentés au moment de leur création. Les modales futures doivent gérer le focus, Échap et les annonces accessibles.

## Do's and Don'ts

- Préserver la hiérarchie des maquettes sans compromettre WCAG 2.1 AA ni la lecture sur petit écran.
- Conserver des libellés et messages en français ; accompagner statuts et erreurs de texte, pas seulement de couleur.
- Ne pas inventer des tokens ou états de composants non vérifiés dans les maquettes ou le code.
- Ne pas transformer la page d'accueil temporaire en référence visuelle des fonctionnalités futures.
