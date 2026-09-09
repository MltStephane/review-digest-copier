# Personas

## Mainteneur / reviewer

### Besoins

- Comprendre rapidement l'intention d'un changement.
- Préserver une extension minimaliste et maintenable.
- Vérifier que Manifest V3, GitHub et GitLab restent supportés.
- Éviter les régressions sur le digest, le bouton GitLab MR et la copie presse-papiers.

### Critères de succès

- Changements limités au périmètre demandé.
- Tests et lint lancés lorsque le code change.
- Digest stable, lisible et neutre.
- Pas de complexité inutile ni de dépendance non justifiée.

## Utilisateur développeur

### Besoins

- Copier rapidement un digest depuis une GitHub PR ou une GitLab MR.
- Utiliser soit la sélection de texte, soit les commentaires visibles de la page.
- Obtenir sur GitLab MR un contexte fichier/diff quand il est disponible.
- Utiliser l'extension sans configuration lourde.

### Critères de succès

- Installation simple en extension unpacked Chrome/Brave.
- Bouton GitLab MR visible et pratique.
- Popup compréhensible.
- Contenu copié immédiatement exploitable.

## Agent IA consommateur du digest

### Besoins

- Recevoir un Markdown clair et structuré.
- Distinguer les commentaires, le contexte de page et le contexte fichier/diff.
- Travailler avec un prompt neutre, sans instruction biaisée.
- Disposer d'assez de contexte pour aider à traiter une review.

### Critères de succès

- Digest complet pour les commentaires visibles ou la sélection fournie.
- Format prévisible et facile à parser.
- Contexte GitLab MR utile quand disponible.
- Absence de limite arbitraire qui masque des retours importants.
