# Bounded Context Canvas · Billetterie

## Nom et objectif

**Billetterie**

Vendre les pass WaveFest en vagues à prix fixe, sans jamais dépasser les quotas, et émettre des billets nominatifs. Gérer la vie du billet jusqu'au festival : changement de nom et revente officielle à prix plafonné.

## Classification

| Axe | Valeur |
|---|---|
| Domaine | 🟥 **Core** : porte le chiffre d'affaires, et ses règles (vagues, quotas, réservation de 15 min, billets nominatifs, revente plafonnée) sont propres à WaveFest. |
| Modèle d'affaires | Génère du revenu (ventes et commission de revente de 5 %). |
| Évolution | Sur mesure : les vagues et les prix changent à chaque édition. |

## Rôle

**Moteur** (*execution*) : il exécute la vente et publie les billets émis, que d'autres contextes consomment (Contrôle d'accès, Cashless, Remboursements d'annulation).

## Langage ubiquitaire

| Terme | Sens dans la Billetterie |
|---|---|
| Pass | Type de droit d'accès vendu : 1 jour, 3 jours ou VIP. |
| Vague | Période de vente à prix fixe, close à sa date ou quand son quota est épuisé. |
| Quota | Nombre maximal de billets vendables dans une vague. |
| Commande | Achat de 1 à 6 billets par un acheteur, en un seul paiement. |
| Réservation | Blocage des places d'une commande non payée, pendant 15 minutes au plus. |
| Acheteur | Personne qui passe et paie une commande. |
| Billet | Exemplaire d'un pass acheté, au nom d'un titulaire. |
| Titulaire | Personne dont le nom figure sur le billet ; elle seule peut entrer avec. |
| Changement de nom | Remplacement du titulaire d'un billet, gratuit jusqu'à J-7. |
| Revente | Vente d'un billet par son titulaire à un autre festivalier, via WaveFest. |
| Prix plafond | Prix maximal de revente, égal au prix d'achat du billet. |
| Commission de revente | Part de 5 % prélevée par WaveFest sur chaque revente. |

## Règles métier (invariants)

1. Une vague ne vend jamais plus de billets que son quota.
2. Une commande contient de 1 à 6 billets, payés en un seul paiement.
3. Une réservation bloque les places 15 minutes au plus ; sans paiement, elle expire et les places sont libérées.
4. Dès que le paiement est demandé, le délai de réservation est suspendu (réponse de l'expert, Q2).
5. Un billet a un seul titulaire à la fois, nommé dès la commande.
6. Le changement de nom est gratuit et possible jusqu'à J-7, refusé ensuite.
7. Un billet revendu ne dépasse jamais son prix plafond ; WaveFest prélève 5 % de commission.
8. Une revente réémet le billet au nom du racheteur ; l'ancien billet n'est plus valable.
9. Une vague close peut rouvrir si des places sont libérées, à un prix plus élevé (réponse de l'expert, Q3 ; règle de prix à fixer).

## Entrées

| Type | Nom | Venant de |
|---|---|---|
| Commande | Ouvrir une vague | Organisateur |
| Requête | Consulter la grille des prix | Acheteur |
| Commande | Passer une commande | Acheteur |
| Commande | Payer la commande | Acheteur |
| Commande | Expirer la réservation | Politique (15 min) |
| Commande | Changer le nom du titulaire | Titulaire |
| Commande | Mettre un billet en revente / Racheter un billet | Vendeur / Racheteur |
| Événement | Paiement confirmé / Paiement refusé | PSP (via ACL) |
| Requête | Billets d'une journée | Remboursements d'annulation |

## Sorties (événements publiés)

| Événement | Pour qui |
|---|---|
| Billets émis | Contrôle d'accès, Cashless, Prestataire e-mail |
| Titulaire changé | Contrôle d'accès |
| Billet réémis au nouveau titulaire | Contrôle d'accès |
| Vague close / Vague ouverte | Organisateur (suivi des ventes) |
| Commission de revente prélevée | Organisateur (bilan de l'édition) |

## Questions ouvertes

- Quelle règle fixe le prix d'une vague rouverte ? (« prix augmente : trouver un paramètre »)
- Si le paiement est refusé, l'acheteur peut-il réessayer dans le même délai, ou la réservation est-elle annulée tout de suite ?
- La revente est-elle possible après J-7, puisque le changement de nom ne l'est plus ? (hotspot du mur)
- Le quota est-il fixé par type de pass ou global pour la vague ? (hotspot du mur)
