# ADR 002 : Trois agrégats dans la Billetterie (GrilleTarifaire, Commande, Billet)

- **Statut :** accepté
- **Date :** TP3

## Contexte

Le contexte Billetterie doit protéger six règles :

| Règle | Énoncé |
|---|---|
| R1 | 6 billets maximum par commande |
| R2 | Le prix dépend de la vague active |
| R3 | Quota épuisé : vague suivante (commande découpée, tout ou rien) |
| R4 | Non payée sous 15 min : places libérées dans leur vague d'origine |
| R5 | Changement de nom gratuit jusqu'à J-7 (J-7 pile refusé) |
| R6 | Revente au prix d'achat au plus, commission de 5 % |

Un agrégat est une frontière de cohérence : tout ce qu'il contient est vrai **à chaque instant**, et on ne modifie qu'un agrégat par transaction (sauf compensation explicite). Il faut décider quelles règles doivent être vraies ensemble.

## Options envisagées

1. **Un seul gros agrégat « Edition »** contenant vagues, commandes et billets : toutes les règles seraient protégées au même endroit, mais chaque achat verrouillerait toute l'édition (contention lors de l'ouverture d'une vague) et l'objet deviendrait énorme.
2. **Commande contenant ses billets** : un billet changerait de nom ou serait revendu en chargeant toute la commande, alors que R5 et R6 ne concernent qu'un billet, et que la commande est terminée une fois payée.
3. **Trois petits agrégats** : GrilleTarifaire (vagues et quotas), Commande (lignes et paiement), Billet (titulaire et revente).

## Décision

**Option 3.**

| Agrégat | Ce qu'il protège | Pourquoi cette frontière |
|---|---|---|
| **GrilleTarifaire** (racine) + Vague (entité) | R2, R3, et le retour des places de R4 | Le quota est partagé par **toutes** les commandes : il doit être cohérent à part. Les vagues ne sont modifiables que par la grille (Vague est immuable). |
| **Commande** + LigneCommande (VO) | R1, R4 (délai de 15 min, minuteur suspendu au paiement) | La limite de 6 billets et le délai concernent une commande, pas l'édition. |
| **Billet** + OffreDeRevente (VO) | R5, R6 | Après le paiement, chaque billet vit seul : nom, revente. |

Les agrégats se référencent **par identifiant** (une Tranche connaît le `VagueId`, un Billet connaît le `CommandeId`), jamais par objet.

## Conséquences

**Plus simple :**
- chaque agrégat est petit, testé seul (Commande.test, GrilleTarifaire.test, Billet.test) ;
- acheter un pass ne verrouille ni les billets ni les autres commandes ;
- les règles sont lisibles à l'endroit où elles vivent.

**Plus difficile :**
- l'achat touche deux agrégats (GrilleTarifaire puis Commande). Si R1 refuse la commande, le cas d'usage rend les places à la grille (compensation technique, sans règle métier) ;
- l'expiration (R4) et le paiement refusé modifient une Commande puis la GrilleTarifaire : cohérence assurée par le cas d'usage, pas par une seule transaction ;
- l'émission des billets suit l'événement `CommandePayee` : en production, ce serait une cohérence à terme.

## Lien avec l'ADR 001 (Revente séparée)

R6 est vérifiée dans l'agrégat **Billet**, car la Billetterie est la source de vérité sur le prix d'achat et le titulaire. Le contexte Revente gère les annonces et les rachats ; il s'appuie sur `Billet.mettreEnRevente` / `revendreA` exposés par la Billetterie (OHS + Published Language).
