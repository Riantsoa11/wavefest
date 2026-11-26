# Bounded Context Canvas · Billetterie

> Sources : Miro cadre 06 (objectif, classification), cadre 08 (entrées, sorties), cadres 04-05 et glossaire (langage, règles).

## 1. Nom et objectif

**Billetterie**

Vendre les pass en vagues à prix croissant et émettre des billets nominatifs. Elle est la source de vérité sur qui détient quel billet et à quel prix.

## 2. Classification

| Axe | Valeur |
|---|---|
| Domaine | 🟥 **Core** : porte le chiffre d'affaires ; vagues, quotas, réservation de 15 min et billets nominatifs sont propres à WaveFest. |
| Modèle d'affaires | Génère le revenu principal (vente des pass). |
| Évolution | Sur mesure : vagues et prix changent à chaque édition. |

## 3. Rôle

**Moteur** (*execution*) et **fournisseur** : elle exécute la vente et publie *Billets émis* pour le Contrôle d'accès, la Revente et les Remboursements (OHS + Published Language).

## 4. Langage ubiquitaire (10 termes)

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
| Grille des prix | Prix et places disponibles de la vague ouverte, consultés par l'acheteur. |

## 5. Règles métier (invariants)

1. Une vague ne vend jamais plus de billets que son quota.
2. Quand le quota atteint 0 ou que la date de fin est atteinte, la vague est close et la vague suivante s'ouvre à un prix supérieur.
3. Une commande contient de 1 à 6 billets, payés en un seul paiement.
4. Une commande non payée sous 15 minutes expire et ses places sont libérées ; le minuteur est suspendu dès que le paiement est initié (Q2).
5. Un paiement confirmé sur une commande expirée est remboursé à l'acheteur.
6. Places libérées : elles reviennent dans la vague ouverte, à son prix.
7. Un billet a un seul titulaire à la fois ; le changement de nom est possible jusqu'à J-7.
8. Un billet remboursé à 50 % après annulation reste valable.

## 6. Entrées (commandes et requêtes reçues)

| Type | Nom | Venant de |
|---|---|---|
| Requête | Consulter la grille des prix | Acheteur |
| Commande | Acheter un pass | Acheteur |
| Événement | Paiement confirmé / Paiement refusé | PSP (via ACL) |
| Événement | Line-up publié | Programmation (Customer / Supplier) |
| Requête | Billets valides de la journée | Remboursements |
| Commande | Marquer le billet remboursé | Remboursements (via l'API publiée) |

## 7. Sorties (événements publiés)

| Événement | Pour qui |
|---|---|
| Billets émis | Contrôle d'accès, Revente, Remboursements (OHS + PL) |
| Commande payée | interne (déclenche l'émission des billets) |
| Vague close / Vague suivante ouverte | Grille des prix (read model) |
| Confirmation d'achat envoyée | Acheteur, via le Prestataire e-mail (Conformist) |

## 8. Questions ouvertes

- Combien de temps attendre le PSP une fois le paiement initié ? (Q2)
- Le quota est-il fixé par type de pass ou global pour la vague ?
- La limite de 6 billets est-elle par commande ou par personne ?
- Quelle hausse de prix appliquer quand la vague suivante s'ouvre ?
