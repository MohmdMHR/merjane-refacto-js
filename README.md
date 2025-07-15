### Consignes JS:

- Si probleme de version pnpm, utiliser `corepack enable pnpm` qui devrait automatiquement utiliser la bonne version
- Ne pas modifier les classes qui ont un commentaire: `// WARN: Should not be changed during the exercise
`
- Pour lancer les tests: `pnpm test`
  - integration only in watch mode `pnpm test:integration`
  - unit only in watch mode `pnpm test:unit`

## Refactor & Test Coverage – 16 juillet 2025

### Ce que j’ai fait
| ✔ | Détail |
|---|--------|
| **Refactor SRP** | extraction de la logique `NORMAL / SEASONAL / EXPIRABLE` dans 3 helpers dédiés |
| **Typage strict** | remplacement de tous les `any` par `Product`, `Database`, `INotificationService` |
| **Nettoyage** | suppression des `console.log`, variables inutilisées, `await` non-promesse |
| **DI fix** | alignement du conteneur (`ns`) avec la résolution dans le contrôleur |
| **Tests** | tous les tests existants passent + 1 test d’intégration supplémentaire pour la décrémentation d’un produit NORMAL |
| **Lint** | `pnpm run lint` ⇒ 0 erreur |