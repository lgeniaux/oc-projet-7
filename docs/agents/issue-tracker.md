# Suivi du projet

Les tâches sont suivies dans les issues du dépôt GitHub privé `lgeniaux/oc-projet-7` et organisées dans le GitHub Project privé « Projet 7 Abricot ».

## États

Le Project utilise seulement trois états :

- `Todo`
- `In Progress`
- `Done`

## Format d'une issue

Chaque issue reste courte et contient :

- un objectif concret ;
- des critères de validation vérifiables ;
- les issues qui la bloquent, lorsqu'il y en a.

Ne pas ajouter de statut `ready-for-agent`, de labels de triage ou de longues descriptions générées.

## Branches

Une branche est créée par issue par défaut. Son nom décrit uniquement le changement, sans numéro d'issue :

- `feat/authentication`
- `feat/project-management`
- `chore/frontend-setup`

Une branche peut contenir plusieurs commits atomiques. Les messages de commit ne mentionnent jamais le numéro de l'issue.

## Pull requests

La Pull Request est ouverte en brouillon après le premier commit cohérent. Sa description reste concise : résumé, validations exécutées et points à vérifier.

La liaison avec l'issue peut apparaître uniquement dans la Pull Request sous la forme `Closes #…`. La fusion utilise un merge commit afin de conserver les commits pédagogiques. La branche est supprimée après fusion.

Aucun commit, push, changement de statut, ouverture de Pull Request ou merge n'est effectué sans accord explicite de l'utilisateur.
