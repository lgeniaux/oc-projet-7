# Lisibilité des handlers d'authentification — recherche (sans décision d'architecture)

## Sources primaires

- [Next.js — Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) : les Route Handlers sont des endpoints publics ; valider avant transmission, gérer les exceptions, éviter les détails sensibles dans les réponses, vérifier type/taille des entrées et envisager des délais limites.
- [Next.js — Error handling](https://nextjs.org/docs/app/getting-started/error-handling) : distinguer erreurs attendues et exceptions inattendues ; la recommandation de renvoyer des erreurs attendues comme valeurs concerne surtout les Server Functions, **pas une obligation générale pour les Route Handlers**.
- [Zod — Basic usage](https://zod.dev/basics) : `safeParse` retourne une union succès/erreur, contrairement à `parse` qui lève une exception ; les données validées sont dans `result.data`.
- [MDN — Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) : `fetch` ne rejette pas la promesse sur les statuts HTTP 4xx/5xx ; tester `status` ou `ok` séparément des erreurs réseau.
- [TypeScript — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) : le contrôle de flux affine les types après vérification ; cela ne remplace pas la validation d'une réponse JSON externe.
- [OWASP — Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html) : erreurs inattendues génériques côté client, détails utiles côté serveur, sans fuite d'implémentation ; statuts 4xx/5xx adaptés.
- [OWASP — Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) : ne pas journaliser mots de passe, tokens, identifiants de session ou secrets.
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) : exceptions pour les cas exceptionnels, blocs `try` circonscrits ; ce guide Google n'est pas une norme universelle.
- [ESLint — complexity](https://eslint.org/docs/latest/rules/complexity) : mesure les chemins indépendants ; son seuil par défaut de 20 n'est pas un objectif de qualité universel.
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html) : format facultatif d'erreurs HTTP, qui ne remplace pas automatiquement un contrat API existant.

## Diagnostic avant refactorisation

Ce diagnostic porte sur l'état des handlers avant la refactorisation locale non commitée qui a suivi la recherche. Les éléments communs ont depuis été extraits dans `src/frontend/src/modules/auth/auth-request.ts` et la réponse Express est validée à l'exécution.

`src/frontend/src/app/api/auth/{login,register}/route.ts` répètent la vérification d'origine, la lecture JSON, l'appel `fetch`, la conversion JSON, la fabrication des erreurs et le contrôle du token. Les conditions `safeParse` sont désormais courtes, mais chaque handler continue de mélanger transport, traduction des statuts et réponse de session. Les deux `try/catch` distincts (`fetch`, puis `response.json`) sont justifiés par deux opérations susceptibles de rejeter ; les `if` sur les statuts sont des distinctions métier nécessaires, pas des échecs du linter. Les assertions `as LoginResponse` et `as RegisterResponse` ne vérifient pas réellement le JSON reçu : seul le contrôle manuel du token apporte actuellement une garantie partielle. Les erreurs d'infrastructure et de réponse inattendue sont silencieuses côté serveur, donc difficiles à diagnostiquer. Les exemples Next.js rappellent aussi de vérifier taille/type de corps et délais réseau selon le risque, indépendamment de la lisibilité.

## Proposition proportionnée (appliquée localement, sans commit)

1. **Route = orchestration explicite** : lire et valider l'entrée, appeler le backend, traduire les quelques statuts connus (`401`/`409`/`400`), produire la réponse de session. Garder ces cas visibles plutôt que cacher toutes les branches dans un framework.
2. **Extraction justifiée par deux usages réels** : une seule petite fonction serveur pour les étapes identiques (vérification d'origine, JSON, appel backend et lecture/validation de son enveloppe), en gardant les différences de statut et de message dans chaque handler. Alternative plus modeste : ne partager que `errorResponse`, `fetch` et le décodeur JSON. Choisir après comparaison de deux versions concrètes, non par dogme DRY.
3. **Une frontière de validation cohérente** : schémas Zod pour le formulaire et l'entrée BFF ; valider également la _réponse_ externe (succès, token non vide) avec un schéma ou une garde dédiée, plutôt qu'une assertion de type. Ne jamais exposer le token dans le JSON client.
4. **Erreurs attendues comme valeurs ; exceptions à la frontière** : traiter les statuts HTTP via `response.status` ; réserver `catch` à `request.json`, `fetch` et `response.json` lorsqu'ils peuvent rejeter. Des retours anticipés sont appropriés pour validation/échec, sans exiger « zéro if » ni convertir tout le code en exceptions.
5. **Observabilité sûre** : si une erreur réseau ou un JSON backend invalide se produit, journaliser l'étape et le statut utiles, sans corps d'identifiants, token ni réponse brute ; conserver des messages génériques et `no-store` côté navigateur. Tester les réponses inattendues et les attributs du cookie.

## Normes et conventions

Conserver TypeScript strict, conventions Next.js App Router, Zod aux frontières et ESLint/Prettier déjà en place comme **conventions de projet**, avec OWASP comme référence de sécurité. Il n'existe pas de norme officielle qui impose « un seul try/catch » ou « aucune condition » ; imposer un maximum arbitraire de complexité ESLint risquerait de multiplier les fonctions artificielles. Le guide Google TypeScript peut inspirer des revues mais n'est pas obligatoire. Ne pas adopter RFC 9457 pour ce BFF sans besoin d'interopérabilité, car Express a déjà son contrat `{ success, message, data, error }`. Ne pas ajouter de bibliothèque d'effets/résultats uniquement pour supprimer la syntaxe `if`/`try`.
