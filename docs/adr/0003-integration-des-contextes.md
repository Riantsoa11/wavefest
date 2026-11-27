# ADR 003 : Comment les 6 bounded contexts communiquent

- **Statut :** accepté
- **Date :** TP3 (intégration des contextes)

## Contexte

La Context Map (TP2, [context-map.md](../context-map.md)) définit 6 contextes et leurs relations : OHS + Published Language, Customer / Supplier, Partnership, ACL et Conformist. Il faut les implémenter dans un même dépôt sans qu'un contexte dépende du modèle d'un autre.

## Options envisagées

1. **Appels directs entre domaines** : la Revente manipule l'agrégat `Billet` de la Billetterie. Simple, mais les modèles se mélangent : c'est l'inverse des Bounded Contexts.
2. **Un modèle partagé (Shared Kernel)** pour tous : Montant, Titulaire, Billet communs. Moins de code, mais chaque changement casse tous les contextes ; la Context Map ne prévoit aucun Shared Kernel.
3. **Langage publié + bus d'événements + Open Host Service** : les contextes n'échangent que des messages simples (`integration/LangagePublie.ts`) ; la Billetterie expose une API publique (`integration/ApiBilletterie.ts`) ; les systèmes externes passent par une ACL ou en Conformist.

## Décision

**Option 3.** Chaque contexte a son propre modèle (`domaine/`), même pour des notions proches : le Cashless a ses `Centimes`, la Revente sa `Personne`, le Contrôle d'accès son `Identite`.

| Relation (Context Map) | Implémentation |
|---|---|
| Billetterie → Contrôle d'accès, Revente, Remboursements : **OHS + PL** | Messages `BilletEmis`, `TitulaireChange` sur le bus ; `ServiceOuvertBilletterie` implémente `ApiBilletterie` |
| Programmation → Remboursements : **Customer / Supplier** | Message `ConcertAnnule` |
| Programmation → Billetterie : **Customer / Supplier** | Message `LineUpPublie` (publié ; aucun traitement côté Billetterie pour l'instant) |
| Revente → Remboursements : **Customer / Supplier** | Message `BilletRevendu` (le prix de rachat sert à calculer les 50 %) |
| Contrôle d'accès ↔ Cashless : **Partnership** | Message `BilletEchangeContreBracelet` : le Cashless ouvre le solde du bracelet |
| PSP → Billetterie, Cashless, Remboursements : **ACL** | Une ACL par contexte dans `infrastructure/psp/` |
| Prestataire e-mail → Billetterie, Remboursements : **Conformist** | Adapters `ConfirmationsParEmail`, `AvisParEmail` |

Le seul endroit qui connaît tous les contextes est le **composition root** `src/fr/wavefest/Festival.ts` : il crée les contextes et branche les abonnements du bus.

## Conséquences

**Plus simple :**
- un contexte peut changer son modèle sans toucher aux autres, tant que le langage publié ne change pas ;
- les tests d'architecture vérifient automatiquement ces frontières (aucun import d'un contexte vers un autre, systèmes externes seulement depuis l'infrastructure) ;
- le scénario de bout en bout (`tests/integration`) montre la Context Map en action.

**Plus difficile :**
- certaines données sont recopiées d'un contexte à l'autre (titulaire du billet au Contrôle d'accès, prix de rachat aux Remboursements) : il faut maintenir ces copies par les messages ;
- le bus est en mémoire et synchrone : en production, ce serait un vrai bus avec une cohérence à terme, des messages perdus ou en double à gérer ;
- une incohérence entre contextes reste possible : par exemple, un billet revendu après avoir été échangé contre un bracelet (question ouverte : la revente est-elle possible après J-7 ?).
