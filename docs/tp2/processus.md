# Processus · Event Storming niveau process

Grammaire : **Acteur** → **Commande** → **Agrégat** → **Événement** → **Politique** → Commande… ; un **Read model** informe l'acteur ; les **Systèmes externes** passent par une ACL ou en Conformist.

## Process 1 · Achat d'un pass avec vagues

![Process achat](process-achat.jpg)

**Cas nominal :** l'acheteur consulte la grille des prix, passe une commande (1 à 6 billets) → *Places réservées* → il paie → *Paiement demandé* (le délai de 15 min est suspendu, réponse Q2) → *Paiement confirmé* → *Billets émis* → *Confirmation d'achat envoyée*.

**Cas d'échec :**
- **Quota épuisé** → *Commande refusée*, puis la vague est close et la suivante s'ouvre.
- **Plus de 6 billets** → *Commande refusée*.
- **Paiement refusé** → les places sont libérées.
- **Expiration** : sans paiement sous 15 min → *Réservation expirée* → *Places libérées* → si la vague était close, elle rouvre à prix majoré (réponse Q3).

**Agrégats :** Vague (protège le quota), Commande (protège le délai et le paiement), Billet (protège le titulaire).

## Process 2 · Annulation d'un concert

![Process annulation](process-annulation.jpg)

**Cas nominal :** l'organisateur annule un concert → *Annulation annoncée* (e-mail à tous). Si c'est une tête d'affiche → *Tête d'affiche annulée* → identification des pass 1 jour concernés (read model fourni par la Billetterie) → remboursement de 50 % au titulaire actuel → *Pass remboursé à 50 %* → avis de remboursement envoyé.

**Cas d'échec :**
- **PSP en échec** → *Remboursement échoué* → relance ; après 3 échecs → *Remboursement en anomalie*, signalé à l'organisateur.
- **Billet déjà revendu** → on rembourse le racheteur, titulaire actuel ; la commission de revente n'est pas rendue (réponse Q1).
- **E-mail non délivré** → le remboursement reste valable, seul l'e-mail est relancé (à confirmer).

## Questions pour l'expert métier

1. Les pass 3 jours et VIP sont-ils remboursés en cas d'annulation d'une tête d'affiche ?
2. Combien de relances au PSP avant de signaler une anomalie ?
3. Après un paiement refusé, l'acheteur peut-il réessayer dans le délai de réservation ?
4. Quelle règle fixe le prix d'une vague rouverte ?
