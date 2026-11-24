# Sous-domaines

## Vue d'ensemble

| Sous-domaine | Classement | Justification courte |
|---|---|---|
| Billetterie | 🟥 **Core** | Porte le chiffre d'affaires, règles propres à WaveFest. |
| Cashless | 🟥 **Core** | Rapporte sur place, bracelet = porte-monnaie spécifique. |
| Revente officielle | 🟧 **Supporting** | Combat le marché noir, rapporte une commission. |
| Contrôle d'accès | 🟧 **Supporting** | Propre à notre organisation, mais pas différenciant. |
| Annulations et remboursements | 🟧 **Supporting** | Règles maison simples, sans avantage concurrentiel. |
| Programmation | 🟧 **Supporting** | Décidée par l'organisateur, publiée par le système. |
| Paiement | 🟩 **Generic** | Confié au PSP, problème commun à tous. |
| Notifications | 🟩 **Generic** | E-mails envoyés par un prestataire du marché. |
| Comptes festivaliers | 🟩 **Generic** | Inscription et connexion, besoin commun à tous les sites. |
| Fourniture des bracelets | 🟩 **Generic** | Fabrication et encodage achetés à un fabricant. |

---

## 🟥 Core

> Ce qui nous différencie, à faire sur mesure, DDD complet.

### Billetterie

La vente en vagues avec quotas, la réservation de 15 min et les billets nominatifs sont propres à WaveFest et portent le chiffre d'affaires.

**Événements**

- Vague ouverte
- Places réservées
- Commande payée
- Billets émis

### Cashless

Indispensable sur site et spécifique (le bracelet est un porte-monnaie), mais le principe existe partout. Défendable en Core car il rapporte sur place.

**Événements**

- Solde rechargé
- Consommation débitée
- Solde remboursé

---

## 🟧 Supporting

> Nécessaire et spécifique à nous, mais pas différenciant. À faire maison, simple.

### Revente officielle

Revente encadrée (prix plafonné, 5 %) : elle combat le marché noir et rapporte une commission.
*À débattre : sous-domaine à part ou partie de la Billetterie ?*

**Événements**

- Billet mis en revente
- Billet revendu
- Commission prélevée

### Contrôle d'accès

Échange du billet contre un bracelet et contrôle au portique : nécessaire et propre à notre organisation, mais pas différenciant.

**Événements**

- Billet vérifié
- Billet échangé contre bracelet
- Entrée validée

### Annulations et remboursements

Règles maison (50 %, J+15, 1,50 €) simples à appliquer, sans avantage concurrentiel.

**Événements**

- Tête d'affiche annulée
- Pass remboursés à 50 %
- Solde remboursé

### Programmation

Le line-up est décidé par l'organisateur ; le système ne fait que le publier.

**Événements**

- Line-up publié
- Horaires de passage publiés

---

## 🟩 Generic

> Problème commun à tout le monde. À acheter ou prendre en SaaS.

### Paiement

Confié au PSP, dont l'API ne peut pas être modifiée. Tout le monde a ce problème.

**Événements**

- Paiement confirmé
- Paiement refusé

### Notifications

Envoi d'e-mails par un prestataire du marché.

**Événements**

- Confirmation d'achat envoyée
- Rappel envoyé

### Comptes festivaliers

Inscription et connexion : un besoin commun à tous les sites.

**Événements**

- Compte festivalier créé

### Fourniture des bracelets

Fabrication et encodage RFID achetés à un fabricant.

**Événements**

- Bracelets commandés
- Bracelets livrés
