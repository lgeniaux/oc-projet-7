# Instructions du projet

## Priorités

1. Respecter les fonctionnalités obligatoires et les critères d'évaluation OpenClassrooms.
2. Produire un code propre, robuste et lisible par un développeur débutant.
3. Préserver l'accessibilité WCAG 2.1 AA et le responsive.
4. Éviter la sur-conception et les abstractions prématurées.

La lisibilité humaine prime sur la concision. Le code doit rester pédagogique sans devenir simpliste ou fragile.

## Documents à consulter

Avant une modification, lire les documents pertinents :

- `CONTEXT.md` pour le vocabulaire métier ;
- `docs/ARCHITECTURE.md` pour les décisions techniques ;
- les ADR pertinents sous `docs/adr/` lorsqu'ils existent ;
- `DESIGN.md` avant une modification visuelle ;
- le sujet et les maquettes lorsque le comportement attendu n'est pas déjà établi.

Les issues organisent le travail, mais ne remplacent pas ces documents ni le code comme sources de contexte.

## Maintenance obligatoire de la documentation

`AGENTS.md`, `docs/ARCHITECTURE.md` et `DESIGN.md` doivent rester strictement à jour pendant toute la durée du projet.

- Toute décision qui modifie les règles de travail doit mettre à jour `AGENTS.md` dans le même changement.
- Toute décision qui modifie l'architecture, les frontières entre modules, les flux de données, la sécurité ou la stratégie de test doit mettre à jour `docs/ARCHITECTURE.md` dans le même changement.
- Toute décision qui modifie les tokens, composants, règles visuelles, comportements responsive ou exigences d'accessibilité doit mettre à jour `DESIGN.md` dans le même changement.
- Ne jamais reporter une mise à jour documentaire nécessaire à un travail ultérieur.
- Avant de proposer un commit, vérifier explicitement si ces trois documents sont toujours cohérents avec le code et les décisions prises.
- Une fonctionnalité n'est pas terminée si la documentation concernée est obsolète ou incomplète.

## Backend fourni

Le backend OpenClassrooms est une contrainte externe conservée sans modification pour le moment.

Lorsqu'une incohérence apparaît entre le backend, le sujet, les maquettes ou le frontend :

1. ne modifier ni contourner silencieusement le comportement ;
2. fournir les fichiers, contrats ou réponses API concernés ;
3. expliquer l'impact sur la fonctionnalité ;
4. proposer les options et leurs conséquences ;
5. attendre la décision de l'utilisateur avant de poursuivre le point bloqué.

Une partie indépendante du travail peut continuer si elle n'est pas concernée.

## Architecture et code

- Utiliser TypeScript strict et les conventions standards de Next.js.
- Employer les Server Components par défaut et les Client Components seulement lorsqu'une interaction ou une API client le nécessite.
- Organiser le métier par modules sans considérer l'arborescence comme immuable.
- Ne créer une abstraction qu'à partir d'un besoin concret, généralement au second usage réel.
- Ne pas ajouter de wrapper autour d'une bibliothèque sans bénéfice explicite.
- Garder les données authentifiées partagées dans le sous-arbre du provider de l'application, démonté à la déconnexion.
- Ne pas fragmenter artificiellement les composants.
- Nommer explicitement les fonctions, composants, variables et types.
- Éviter `any` dans le code applicatif.
- Écrire les commentaires et JSDoc en anglais technique simple (Simplified Technical English) : phrases courtes, mots courants, un sens par phrase. Pour les flux backend/BFF, ajouter de brefs commentaires de section si utiles. Documenter les fonctions pertinentes au format JSDoc du backend (description, `@param`, `@returns`) en précisant seulement les contrats, échecs ou contraintes de sécurité qui aident à comprendre. Éviter la verbosité, la paraphrase du code et la copie des commentaires du backend.
- Ajouter une dépendance seulement si son bénéfice peut être expliqué en soutenance.

## Interface

- L'interface et les messages utilisateur sont en français.
- Le code, les noms de fichiers et les messages de commit sont en anglais.
- La documentation de travail et le README sont en français.
- Les maquettes déterminent la structure et l'identité visuelle ; la cible est une fidélité forte sans pixel-perfect.
- Les contrôles d'interface (boutons, champs, libellés, modales, menus…) utilisent les primitives shadcn/ui, ajoutées au premier besoin et adaptées au thème Abricot. Ne pas réécrire à la main un contrôle que shadcn/ui fournit.
- L'accessibilité et le fonctionnement priment lorsqu'ils entrent en conflit avec un détail visuel.
- Toute interface doit gérer les états de chargement, vide et erreur pertinents.
- Consigner chaque écart avec le sujet, les maquettes ou le backend, et chaque choix technique ou produit à justifier en soutenance, dans `docs/ecarts-et-decisions.md`, dans le même changement que la décision.
- Faire correspondre la validation des formulaires au contrat réel du backend, y compris les caractères autorisés ; documenter les divergences décidées avec les maquettes ou le sujet.
- Toute suppression destructive demande confirmation.

## Sécurité

- Ne jamais versionner un fichier `.env`, un secret, un token ou des identifiants réels.
- Versionner uniquement des fichiers `.env.example` avec des valeurs factices.
- Ne jamais stocker le JWT dans `localStorage`. Selon l'ADR 0001, l'authentification directe utilise `sessionStorage` pour l'onglet courant : reconnaître que le JWT y est accessible au JavaScript et ne jamais l'afficher ni le journaliser.
- Le BFF et le cookie HttpOnly sont en pause. Ne pas supposer qu'Express crée ou lit des cookies : son contrat actuel renvoie `data.token` et attend `Authorization: Bearer`.
- Le backend reste l'autorité finale pour l'authentification et les permissions.

## Tests et validations

Les tests vérifient les comportements observables, pas les détails d'implémentation.

- Tester en priorité les parcours essentiels, les règles métier et les risques de sécurité ou de régression.
- Pour chaque comportement, choisir le niveau de test le plus simple qui donne confiance ; ne pas tester la même chose à chaque niveau sans raison.
- Regrouper les cas équivalents et éviter les tests de chaque branche, des fonctions triviales ou des détails de bibliothèque. Ajouter un test de régression lorsqu'un bug réel le justifie.
- Garder les tests courts, lisibles et proportionnés au risque ; ne pas chercher une couverture de 100 %.

Avant un commit, exécuter au minimum :

- le lint ;
- la vérification TypeScript ;
- les tests concernés.

Avant un jalon fonctionnel ou une livraison, exécuter également :

- la suite complète ;
- le build de production ;
- les tests end-to-end ;
- les vérifications manuelles visuelles et d'accessibilité pertinentes.

Ne pas imposer de seuil arbitraire de couverture.

## Git et review

- Une branche sémantique est créée par issue par défaut, sans numéro : `feat/authentication`, `fix/session-expiration`, `chore/frontend-setup`.
- Une branche peut contenir plusieurs commits pédagogiques et atomiques.
- Les messages suivent Conventional Commits et décrivent uniquement la modification réelle.
- Les branches et commits ne mentionnent jamais de numéro d'issue.
- Présenter le diff avant chaque commit.
- Gérer les tickets dans le GitHub Project « Projet 7 Abricot » : placer un ticket en `In Progress` au début de son implémentation, puis en `Done` uniquement après la fusion de sa Pull Request. Ne jamais marquer `Done` au seul motif que le code ou les tests sont terminés.
- Ne jamais commit, push, ouvrir ou modifier une Pull Request, changer le statut d'une issue ou fusionner sans accord explicite, sauf la mise à jour des statuts du Project prévue ci-dessus, autorisée par cette règle de suivi.
- Ouvrir une Draft PR après le premier commit cohérent.
- Garder la description de PR courte : résumé, validations, points à vérifier.
- La référence `Closes #…` est autorisée uniquement dans la Pull Request.
- Fusionner avec un merge commit afin de conserver les commits pédagogiques, puis supprimer la branche.
- Ne jamais effectuer de force-push sans demande explicite et explication du risque.

## Agent skills

### Issue tracker

Les tâches sont suivies dans les issues du dépôt privé et dans le GitHub Project « Projet 7 Abricot ». Voir `docs/agents/issue-tracker.md`.

### Domain docs

Le projet utilise une documentation métier single-context. Voir `docs/agents/domain.md`.
