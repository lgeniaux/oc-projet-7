# Documentation du domaine

Ce document explique comment les agents doivent utiliser la documentation métier de ce dépôt.

## Documents à lire avant une exploration

- `CONTEXT.md` à la racine, lorsqu'il existe ;
- les ADR pertinents sous `docs/adr/`.

Si ces fichiers n'existent pas encore, poursuivre silencieusement. Ils seront créés lorsque des termes métier ou des décisions durables auront effectivement besoin d'être consignés.

## Organisation

Le dépôt utilise un contexte métier unique :

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```

## Vocabulaire

Les noms employés dans les spécifications, tickets, tests et propositions techniques doivent respecter le vocabulaire défini dans `CONTEXT.md`. Ne pas remplacer silencieusement un terme établi par un synonyme.

Un concept nécessaire mais absent du glossaire peut signaler soit un vocabulaire inventé inutilement, soit une lacune réelle à documenter.

## Décisions architecturales

Avant de proposer une modification, lire les ADR qui concernent la zone touchée. Toute proposition contraire à un ADR doit signaler explicitement cette contradiction au lieu de remplacer silencieusement la décision existante.
