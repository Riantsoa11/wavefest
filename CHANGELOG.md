# Changelog

## [Non publié] · Intégration des bounded contexts
### Ajouté
- Contextes Revente, Contrôle d'accès, Cashless, Programmation et Remboursements, chacun avec son domaine et ses tests.
- Langage publié et bus d'événements, Open Host Service de la Billetterie, ACL PSP par contexte, Conformist e-mail.
- Composition root `Festival.ts` et scénario d'intégration de bout en bout.
- Tests d'architecture étendus aux 6 contextes ; ADR 003.
### Modifié
- Billetterie : jours de validité des pass (pass 1 jour = un jour choisi), billet remboursé, publication des événements, confirmation d'achat par e-mail.
- Tests de la Billetterie déplacés dans `tests/billetterie/`.

## [Non publié] · TP3
### Ajouté
- Contexte Billetterie en TypeScript (architecture hexagonale) : agrégats GrilleTarifaire, Commande, Billet.
- Règles R1 à R6 dans le domaine, avec tests nommés par règle et cas limites.
- Cas d'usage : AcheterPass, PayerCommande, ExpirerCommandes, ChangerTitulaire, MettreEnRevente.
- ACL du PSP (PspPaiementAdapter) et tests d'architecture.
- ADR 002, glossaire terme → classe, README.

## TP2
- Context Map, canvas Billetterie, ADR 001 (Revente séparée), processus achat et annulation.

## TP1
- Event Storming, sous-domaines, glossaire, hotspots.
