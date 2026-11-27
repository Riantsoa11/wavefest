# CLAUDE.md · WaveFest Billetterie

## Carte du projet
- `src/fr/wavefest/billetterie/domaine` : modèle métier (agrégats GrilleTarifaire, Commande, Billet). Aucun import technique.
- `src/fr/wavefest/billetterie/application` : cas d'usage et ports.
- `src/fr/wavefest/billetterie/infrastructure` : adapters (mémoire, horloge, PSP + ACL).
- `tests/` : un dossier par couche + `architecture/` (sens des dépendances).
- `docs/` : glossaire, context map, ADR, livrables TP1-TP2, et le suivi du projet (BACKLOG, BUGS, DONE…).

## Règles permanentes
- Langage ubiquitaire : noms de classes et méthodes en français, repris du glossaire.
- Une règle métier vit dans un agrégat, jamais dans un cas d'usage.
- Argent = `Montant` ; heure = paramètre `maintenant` (port `Horloge`) ; pas de setter.
- Le vocabulaire du PSP ne sort pas de `infrastructure/psp`.
- Branche `feature/…` ou `fix/…` avant toute modification ; jamais de commit direct sur `main`.
- Commits en français : `type(portée): description`. Tests verts avant chaque commit.
