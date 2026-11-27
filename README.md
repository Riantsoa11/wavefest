# WaveFest · Billetterie (DDD)

Projet du cours Domain-Driven Design (Ynov, M1). Le festival WaveFest vend ses pass en vagues ; ce dépôt contient la modélisation (TP1, TP2), l'implémentation du contexte **Billetterie** en **TypeScript** (TP3), et son **intégration avec les 5 autres bounded contexts** de la Context Map.

Lien Miro : https://miro.com/app/board/uXjVEKGENRg=/?share_link_id=553093096347

## Lancer le projet

Prérequis : **Node.js 18 ou plus** (npm inclus).

```bash
npm install          # installe TypeScript et Vitest
npm test             # lance tous les tests (6 contextes, intégration, architecture)
npm run typecheck    # vérifie les types (tsc --noEmit)
npm run test:watch   # relance les tests à chaque modification
```

Aucun framework : TypeScript pur, Vitest pour les tests.

## Les 6 règles métier et leurs tests

| Règle | Énoncé | Où elle vit | Tests |
|---|---|---|---|
| R1 | 6 billets maximum par commande | `Commande.ajouterBillets` | `tests/billetterie/domaine/Commande.test.ts` |
| R2 | Le prix dépend de la vague active | `GrilleTarifaire.prixActuel`, `Vague.prixDe` | `tests/billetterie/domaine/GrilleTarifaire.test.ts` |
| R3 | Quota épuisé : vague suivante (découpage, tout ou rien) | `GrilleTarifaire.reserver` | `tests/billetterie/domaine/GrilleTarifaire.test.ts` |
| R4 | Non payée sous 15 min : places libérées dans leur vague | `Commande.doitExpirerA`, `GrilleTarifaire.liberer`, `ExpirerCommandesUseCase` | `Commande.test.ts`, `GrilleTarifaire.test.ts`, `UseCases.test.ts` |
| R5 | Changement de nom gratuit jusqu'à J-7 (J-7 pile refusé) | `Billet.changerTitulaire` | `tests/billetterie/domaine/Billet.test.ts` |
| R6 | Revente au prix d'achat au plus, commission 5 % | `Billet.mettreEnRevente`, `OffreDeRevente` | `tests/billetterie/domaine/Billet.test.ts` |

Les tests portent le nom de la règle (`R1_refuse_plus_de_6_billets`, `R5_refuse_le_changement_de_nom_a_J_7_pile`…) et couvrent les cas limites : 6 billets pile, 15 minutes pile, J-7 pile, prix de revente égal au prix d'achat.

## Les 6 bounded contexts

| Contexte | Classement | Agrégats | Règles clés |
|---|---|---|---|
| **Billetterie** | Core | GrilleTarifaire, Commande, Billet | R1 à R6 (ci-dessus), jours de validité des pass |
| **Revente** | Core | AnnonceDeRevente | Seul le titulaire revend, le vendeur ne rachète pas, annonces retirées si la tête d'affiche est annulée |
| **Contrôle d'accès** | Supporting | BilletDAcces, Bracelet | Bon jour, bon titulaire, un seul échange contre un bracelet, sorties et retours |
| **Cashless** | Supporting | SoldeCashless | Pas de paiement au-delà du solde, remboursement du solde jusqu'à J+15 moins 1,50 € |
| **Programmation** | Supporting | Programme | 3 jours, une tête d'affiche par jour, pas d'annulation en double |
| **Remboursements** | Supporting | CampagneDeRemboursement | 50 % au titulaire actuel (prix de rachat si revendu), un remboursement par billet, 3 essais puis traitement manuel |

Les contextes communiquent comme sur la [Context Map](docs/context-map.md) : langage publié et bus d'événements (`src/fr/wavefest/integration`), Open Host Service de la Billetterie, une ACL par contexte vers le PSP, Conformist vers le prestataire e-mail (voir [ADR 003](docs/adr/0003-integration-des-contextes.md)). Le fichier `src/fr/wavefest/Festival.ts` assemble les 6 contextes.

Le scénario complet est dans `tests/integration/ScenarioFestival.test.ts` : achat → paiement → billets émis → revente → annulation de la tête d'affiche → remboursements → bracelet → cashless.

## Choix d'architecture

Architecture **hexagonale** dans chaque contexte : les dépendances pointent vers le domaine.

```
src/fr/wavefest/
├── billetterie/        domaine (commun, offre, commande, billet) · application (+ ports) · infrastructure
├── revente/            domaine · application · infrastructure
├── controle-acces/     domaine · application · infrastructure
├── cashless/           domaine · application · infrastructure (+ ACL psp)
├── programmation/      domaine · application
├── remboursements/     domaine · application · infrastructure (+ ACL psp, e-mail)
├── integration/        langage publié, bus, API publique de la Billetterie (OHS)
├── externe/            systèmes externes simulés : PSP, prestataire e-mail
└── Festival.ts         assemblage des 6 contextes (composition root)
```

- **Petits agrégats** : voir [ADR 002](docs/adr/0002-frontieres-des-agregats.md) pour la Billetterie.
- **Value Objects** : l'argent est un `Montant` (ou des `Centimes`) en centimes entiers, jamais un nombre à virgule ; les identifiants de la Billetterie sont typés.
- **Pas de setter** : l'état ne change que par des actions métier.
- **L'heure est passée en paramètre** (`maintenant`) : aucun domaine ne lit l'horloge.
- **ACL étanche** : le vocabulaire du PSP (`succeeded`, `payment_intent`…) reste dans `externe/psp` et les dossiers `infrastructure/psp`.
- **Tests d'architecture** (`tests/architecture`) : ils échouent si un domaine importe autre chose que lui-même, si une application importe l'infrastructure, si un contexte importe le code d'un autre, si le vocabulaire du PSP sort d'une ACL, ou si un setter apparaît dans un domaine.

## Documentation

- [Glossaire](docs/glossaire.md), avec la correspondance terme → classe TypeScript
- [Context Map](docs/context-map.md) et [canvas de la Billetterie](docs/bc-canvas-billetterie.md)
- ADR : [001 Revente séparée](docs/adr/0001-revente-separee-billetterie.md), [002 Frontières des agrégats](docs/adr/0002-frontieres-des-agregats.md), [003 Intégration des contextes](docs/adr/0003-integration-des-contextes.md)
- TP1 : [sous-domaines](docs/tp1/sous-domaines.md), [hotspots](docs/tp1/hotspots.md) · TP2 : [processus](docs/tp2/processus.md)
