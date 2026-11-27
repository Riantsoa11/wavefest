# WaveFest · Billetterie (DDD)

Projet du cours Domain-Driven Design (Ynov, M1). Le festival WaveFest vend ses pass en vagues ; ce dépôt contient la modélisation (TP1, TP2) et l'implémentation du contexte **Billetterie** en **TypeScript** (TP3).

Lien Miro : https://miro.com/app/board/uXjVEKGENRg=/?share_link_id=553093096347

## Lancer le projet

Prérequis : **Node.js 18 ou plus** (npm inclus).

```bash
npm install          # installe TypeScript et Vitest
npm test             # lance tous les tests (domaine, cas d'usage, ACL, architecture)
npm run typecheck    # vérifie les types (tsc --noEmit)
npm run test:watch   # relance les tests à chaque modification
```

Aucun framework : TypeScript pur, Vitest pour les tests.

## Les 6 règles métier et leurs tests

| Règle | Énoncé | Où elle vit | Tests |
|---|---|---|---|
| R1 | 6 billets maximum par commande | `Commande.ajouterBillets` | `tests/domaine/Commande.test.ts` |
| R2 | Le prix dépend de la vague active | `GrilleTarifaire.prixActuel`, `Vague.prixDe` | `tests/domaine/GrilleTarifaire.test.ts` |
| R3 | Quota épuisé : vague suivante (découpage, tout ou rien) | `GrilleTarifaire.reserver` | `tests/domaine/GrilleTarifaire.test.ts` |
| R4 | Non payée sous 15 min : places libérées dans leur vague | `Commande.doitExpirerA`, `GrilleTarifaire.liberer`, `ExpirerCommandesUseCase` | `Commande.test.ts`, `GrilleTarifaire.test.ts`, `UseCases.test.ts` |
| R5 | Changement de nom gratuit jusqu'à J-7 (J-7 pile refusé) | `Billet.changerTitulaire` | `tests/domaine/Billet.test.ts` |
| R6 | Revente au prix d'achat au plus, commission 5 % | `Billet.mettreEnRevente`, `OffreDeRevente` | `tests/domaine/Billet.test.ts` |

Les tests portent le nom de la règle (`R1_refuse_plus_de_6_billets`, `R5_refuse_le_changement_de_nom_a_J_7_pile`…) et couvrent les cas limites : 6 billets pile, 15 minutes pile, J-7 pile, prix de revente égal au prix d'achat.

## Choix d'architecture

Architecture **hexagonale** : les dépendances pointent vers le domaine.

```
src/fr/wavefest/billetterie/
├── domaine/            // AUCUN import technique, aucune lecture de l'horloge
│   ├── commun/         Montant, Quantite, Email, Titulaire, identifiants typés
│   ├── offre/          GrilleTarifaire (agrégat), Vague, Formule, Tranche
│   ├── commande/       Commande (agrégat), LigneCommande, CommandePayee
│   └── billet/         Billet (agrégat), OffreDeRevente
├── application/        AcheterPass, PayerCommande, ExpirerCommandes, ChangerTitulaire, MettreEnRevente
│   └── ports/          Commandes, Billets, PortPaiement, Horloge (+ GrillesTarifaires, GenerateurIdentifiants), un fichier par port
└── infrastructure/
    ├── persistance/    CommandesEnMemoire, BilletsEnMemoire, GrillesTarifairesEnMemoire
    ├── horloge/        HorlogeSysteme, HorlogeFixe
    └── psp/            ApiPspSimulee, PspPaiementAdapter (ACL)
```

- **Trois petits agrégats** : GrilleTarifaire, Commande, Billet (voir [ADR 002](docs/adr/0002-frontieres-des-agregats.md)).
- **Value Objects partout** : l'argent est un `Montant` en centimes entiers (jamais de nombre à virgule), les quantités une `Quantite`, les identifiants sont typés.
- **Pas de setter** : l'état ne change que par des actions métier (`ajouterBillets`, `expirer`, `changerTitulaire`…).
- **L'heure est passée en paramètre** (`maintenant`) : le domaine ne lit jamais l'horloge ; l'application passe par le port `Horloge`.
- **ACL étanche** : le vocabulaire du PSP (`succeeded`, `payment_intent`…) reste dans `infrastructure/psp`.
- **Tests d'architecture** (`tests/architecture`) : ils échouent si le domaine importe l'application ou l'infrastructure, si l'application importe l'infrastructure, si le vocabulaire du PSP sort de l'ACL, ou si un setter apparaît dans le domaine.

## Documentation

- [Glossaire](docs/glossaire.md), avec la correspondance terme → classe TypeScript
- [Context Map](docs/context-map.md) et [canvas de la Billetterie](docs/bc-canvas-billetterie.md)
- ADR : [001 Revente séparée](docs/adr/0001-revente-separee-billetterie.md), [002 Frontières des agrégats](docs/adr/0002-frontieres-des-agregats.md)
- TP1 : [sous-domaines](docs/tp1/sous-domaines.md), [hotspots](docs/tp1/hotspots.md) · TP2 : [processus](docs/tp2/processus.md)
