# Consignes agents IA

## Workflow

1. Lire `CONTEXT.md`, `AGENTS.md` et `PERSONAS.md` avant toute modification.
2. Identifier si le changement concerne la popup, l'extraction de page, le formatage du digest, le bouton GitLab MR ou les tests.
3. Inspecter uniquement les fichiers nécessaires.
4. Modifier le minimum de code ou de documentation requis.
5. Vérifier avec les commandes adaptées au changement.
6. Ne pas commit, push ou deploy sauf demande explicite.

## Fichiers à inspecter selon le sujet

- Popup extension : `packages/browser-ai-digest-extension/popup.js`, `popup.html`, `popup.css`.
- Extraction GitHub/GitLab : `packages/browser-ai-digest-extension/src/page-digest.js`.
- Format Markdown : `packages/browser-ai-digest-extension/src/format-digest.js`.
- Bouton GitLab MR : `packages/browser-ai-digest-extension/src/gitlab-mr-button.js`.
- Manifest et permissions : `packages/browser-ai-digest-extension/manifest.json`.
- Tests : `packages/browser-ai-digest-extension/tests/*.test.js`.
- Documentation utilisateur : `packages/browser-ai-digest-extension/README.md`.

## Commandes

Depuis la racine du dépôt :

```bash
bun run --cwd packages/browser-ai-digest-extension test
bun run --cwd packages/browser-ai-digest-extension lint
```

Pour un changement documentaire seul, ces commandes ne sont généralement pas nécessaires.

## Restrictions

- Ne pas commit, push ou deploy sans instruction explicite.
- Ne pas modifier des fichiers hors-scope.
- Ne pas ajouter de modal sauf demande explicite.
- Ne pas casser la compatibilité Manifest V3.
- Ne pas déplacer l'architecture du package sans demande explicite.
- Ne pas inventer de nouvelle fonctionnalité produit non demandée.

## Pièges connus

- Les fonctions injectées via `chrome.scripting.executeScript({ func })` sont sérialisées : elles doivent être autonomes.
- Le contexte DOM GitHub/GitLab est fragile et peut changer ; privilégier des sélecteurs tolérants et des fallbacks simples.
- La sélection utilisateur doit rester prioritaire sur le scraping automatique.
- Le bouton GitLab MR est un point sensible : vérifier son injection, son positionnement et l'absence de duplication.
- Le digest doit rester neutre, lisible et utile à un humain comme à un agent IA.
- Les commandes `test` et `lint` doivent être lancées depuis le package avec `--cwd packages/browser-ai-digest-extension`.
