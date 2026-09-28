# ADR 0001 — Authentification directe auprès d’Express

- Statut : accepté le 28 septembre 2026
- Périmètre : frontend Next.js, authentification et accès aux routes privées

## Contexte

Le backend Express fourni renvoie un JWT dans `data.token` après `POST /auth/login` ou `POST /auth/register`. Ses routes privées exigent `Authorization: Bearer <token>` ; il ne crée ni ne lit de cookie de session. Le BFF Next.js prévu initialement cachait ce JWT dans un cookie HttpOnly, mais ajoutait une frontière et une traduction des requêtes que le porteur du projet souhaite suspendre. Le backend reste inchangé.

Le sujet exige des routes privées inaccessibles sans token et conseille d'éviter `localStorage` pour les données sensibles. Il n'impose pas de BFF ni de cookie HttpOnly.

## Décision

- Le navigateur appelle directement les endpoints Express. Next.js conserve le rendu des pages et les formulaires, sans Route Handler BFF pour l'authentification.
- Après une réponse valide, le JWT est stocké dans `sessionStorage` pour l'onglet courant. Les prochaines requêtes privées devront lire ce token et l'envoyer en Bearer. Le token n'est jamais stocké dans `localStorage`.
- Express reste la seule autorité pour l'identité, la validation finale et les permissions. La validation Zod du formulaire fournit une aide immédiate, sans se substituer à Express.
- Le BFF et le cookie HttpOnly sont **en pause** ; ne pas introduire de proxy d'authentification ni modifier Express sans une nouvelle décision.

## Conséquences et limites

- Le JWT est accessible au JavaScript du navigateur : une faille XSS pourrait le voler. La session survit au rechargement dans le même onglet, mais pas à sa fermeture ; la déconnexion devra effacer `sessionStorage`.
- Un Server Component Next.js ne peut pas lire `sessionStorage`. Avec ce contrat Express, une protection **côté serveur** des pages privées n'est donc pas réalisable sans un autre mécanisme. Pour le ticket #5, le porteur du projet accepte une garde côté navigateur : elle masque l'interface tant que l'onglet n'a pas de token, mais ne vérifie pas le JWT et ne protège pas le HTML serveur. Express continue de refuser les données privées sans token valide. Une réponse `401` devra effacer la session et demander une reconnexion.
- En développement, le CORS Express n'autorise que `http://localhost:8000` et `http://localhost:8001`. Next.js utilise donc `http://localhost:8001` pour les parcours directs. `127.0.0.1` et `localhost:3000` ne sont pas interchangeables pour CORS.
- En production, Express n'autorise pour l'instant que `https://votre-domaine.com` (valeur fournie). La configuration du domaine réel ou un hébergement de même origine nécessitera une décision avant déploiement ; ne pas masquer cette limite avec un proxy non déclaré.
- Les tickets #4, #5 et #18 reflètent le contrat direct et ses limites à la place des critères BFF, cookie HttpOnly et JWT inaccessible au JavaScript. Les tests BFF sont supprimés ; les tests de formulaires et un E2E contre Express réel restent nécessaires.

## Options écartées pour l'instant

- **BFF Next.js et cookie HttpOnly** : meilleure isolation du JWT, mais couche supplémentaire refusée pour cette étape.
- **Express créant un cookie HttpOnly** : exigerait de modifier le backend fourni et sa lecture du token.
- **JWT uniquement en mémoire** : perdu au rechargement.
- **`localStorage`** : déconseillé par le sujet et interdit par les règles du projet.
