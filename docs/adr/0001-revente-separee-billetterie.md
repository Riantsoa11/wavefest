# ADR 001 : La Revente officielle est un contexte séparé de la Billetterie

- **Statut :** accepté
- **Date :** TP2

## Contexte

Au TP1 (Miro, cadre 03), la Revente officielle était classée **Supporting**, avec la mention : « À débattre : sous-domaine à part ou partie de la Billetterie ? ».

La revente touche au billet : un titulaire met son billet en annonce, un racheteur l'achète au prix plafond (prix d'achat), WaveFest prélève 5 % de commission, et le billet change de titulaire. Mais elle a aussi ses propres acteurs (vendeur, racheteur), son propre objet (l'**annonce de revente**) et sa propre finalité : combattre le marché noir.

## Options envisagées

1. **La Revente dans la Billetterie** : annonces, rachat et commission dans le même modèle que les vagues et les commandes.
2. **La Revente comme contexte séparé**, en aval de la Billetterie : elle reçoit *Billets émis* (OHS + Published Language) et publie *Billet revendu*.

## Décision

**Option 2 : contexte séparé.**

- **Le langage change** : dans la Billetterie, on parle de vague, quota, commande et acheteur ; dans la Revente, d'annonce, vendeur, racheteur, prix plafond et commission. Un même mot, « prix », n'y a pas la même règle (prix de vague contre prix plafond).
- **Les règles changent** : la commission de 5 % et le plafond n'existent que dans la revente.
- **Les acteurs changent** : l'acheteur d'une vague n'est pas le vendeur ou le racheteur d'une annonce.
- **Le rythme de changement diffère** : les vagues changent à chaque édition, les règles de revente rarement.
- La revente est **différenciante** (lutte contre le marché noir, commission) : on la classe **Core**, au même titre que la Billetterie.

## Compromis assumé

On accepte que **le titulaire d'un billet soit modifié par un autre contexte** que celui qui le détient. Pour garder une seule source de vérité, la Billetterie reste propriétaire du billet : la Revente ne change jamais le billet elle-même, elle publie *Billet revendu*, et la Billetterie réémet le billet au nom du racheteur (événement *Billet réémis au nouveau titulaire* du TP1).

> ⚠️ Ce lien *Revente → Billetterie (Billet revendu)* n'est pas encore dessiné sur la Context Map du Miro (cadre 07) : à ajouter.

## Conséquences

**Plus simple :**
- chaque modèle reste petit et lisible : la Billetterie ne connaît pas les annonces ni la commission ;
- la revente peut évoluer seule (plafond, commission) sans toucher à la vente ;
- l'annulation d'un concert retire les annonces de la journée par un simple échange entre Remboursements et Revente.

**Plus difficile :**
- un délai existe entre *Billet revendu* et la réémission du billet : pendant ce délai, le Contrôle d'accès pourrait encore accepter l'ancien billet ; il faut que l'ancien billet soit invalidé au plus vite ;
- il faut maintenir le contrat publié *Billets émis* / *Billet revendu* entre deux équipes ;
- la question « qui est remboursé si un billet revendu est annulé ? » traverse trois contextes (Revente, Remboursements, Billetterie).
