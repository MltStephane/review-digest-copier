# Contexte projet

## Vision produit

`@openchamber/review-digest-copier` est une extension Chrome/Brave Manifest V3 minimaliste. Elle copie dans le presse-papiers un digest exploitable de review GitHub Pull Request ou GitLab Merge Request.

L'objectif est de fournir rapidement à un développeur ou à un agent IA un contexte clair de review : commentaires visibles, éventuelle sélection utilisateur, et contexte fichier/diff GitLab MR lorsque disponible.

## Architecture synthétique

Le projet principal est situé dans `packages/browser-ai-digest-extension`.

Fichiers clés :

- `popup.html` : interface de la popup extension.
- `popup.css` : styles de la popup.
- `popup.js` : logique de popup, copie presse-papiers et injection MV3.
- `src/page-digest.js` : extraction du contenu de page GitHub/GitLab.
- `src/format-digest.js` : formatage du digest Markdown.
- `src/gitlab-mr-button.js` : bouton fixe sur les pages GitLab MR.
- `tests/*.test.js` : tests Node natifs.

## Commandes

Lancer les commandes depuis le package :

```bash
bun run --cwd packages/browser-ai-digest-extension test
bun run --cwd packages/browser-ai-digest-extension lint
```

Le package est en `type: module`.

## Règles techniques

- Respecter Manifest V3.
- Les fonctions passées à `chrome.scripting.executeScript({ func })` doivent être autonomes : elles sont sérialisées et ne doivent pas dépendre d'import, closure ou état externe non disponible dans la page.
- Garder l'extension minimaliste et robuste.
- Ne pas ajouter de modal sauf demande explicite ; préférer une page ou une route dédiée si un flux plus complexe est nécessaire.
- Ne pas introduire de dépendance ou de refactor hors-scope sans justification.

## Points d'attention GitHub / GitLab

- La sélection de texte utilisateur est prioritaire comme source de feedback.
- Sans sélection, l'extension extrait les commentaires/reviews visibles sur la page courante.
- Sur GitLab MR, le digest peut inclure le fichier et le contexte de diff quand ces informations sont trouvées.
- Le bouton fixe GitLab MR fait partie du comportement attendu sur les pages Merge Request.
- Le digest ne doit pas dépendre d'une limite arbitraire basse de commentaires.
- Le prompt généré doit rester neutre et exploitable par un agent IA.

## Critères de validation

- Les tests passent : `bun run --cwd packages/browser-ai-digest-extension test`.
- Le lint/syntax check passe : `bun run --cwd packages/browser-ai-digest-extension lint`.
- Chargement manuel possible via `chrome://extensions` ou `brave://extensions` en mode développeur, dossier `packages/browser-ai-digest-extension`.
- Vérification manuelle sur une GitHub PR et une GitLab MR lorsque le changement touche l'extraction ou l'UI d'extension.
