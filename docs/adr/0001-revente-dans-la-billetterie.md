# ADR 001 : La Revente reste dans la Billetterie

- **Statut :** accepté
- **Date :** TP2

## Contexte

Au TP1, la Revente officielle a été classée en sous-domaine **Supporting**, distinct de la Billetterie (Core), avec la note : « À débattre : sous-domaine à part ou partie de la Billetterie ? ».

Arguments pour la séparer :
- d'autres acteurs (vendeur, racheteur) et une règle propre (commission de 5 %) ;
- une finalité différente : combattre le marché noir plutôt que vendre des places neuves.

Arguments pour la garder :
- une revente **change le titulaire du billet**, exactement comme le changement de nom ;
- le **prix plafond** est égal au prix d'achat du billet, une donnée de la Billetterie ;
- la règle « un billet = un seul titulaire valable » doit rester vraie à tout instant ; si deux contextes peuvent modifier le titulaire, l'un des deux risque de valider un billet déjà revendu au portique.

## Options envisagées

1. **Un contexte « Revente » séparé**, aval de la Billetterie (Customer/Supplier) : il gère les annonces et les rachats, puis demande à la Billetterie de réémettre le billet.
2. **La Revente comme module de la Billetterie** : annonces, rachat, commission et réémission du billet dans le même modèle.

## Décision

**Option 2**, parce que la revente est avant tout une modification du **billet** (son titulaire et son prix), et que les invariants du billet (titulaire unique, prix plafond, J-7) ne peuvent être protégés que là où vit le billet. Le vocabulaire est d'ailleurs le même : billet, titulaire, prix d'achat.

La revente reste un module identifiable dans la Billetterie, pour pouvoir l'extraire plus tard si elle prend de l'ampleur.

## Conséquences

**Plus simple :**
- une seule source de vérité pour le titulaire d'un billet ;
- pas de double écriture ni de cohérence à terme entre « billet revendu » et « billet réémis » ;
- le Contrôle d'accès ne lit qu'un seul flux d'événements.

**Plus difficile :**
- la Billetterie, déjà le contexte le plus gros, grossit encore ;
- les évolutions de la revente (commission, plafond) se livrent au rythme de la Billetterie ;
- la commission de revente doit être isolée dans le module pour rester lisible.

**Compromis assumé :** on accepte une Billetterie plus grosse en échange d'une cohérence forte sur le titulaire du billet. Si la revente devient un produit à part (marketplace, autres festivals), on rouvrira cette décision.
