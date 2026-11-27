import { GenerateurIdentifiants } from "../../application/ports";
import { BilletId, CommandeId } from "../../domaine/commun/Identifiants";

/** Adapter : identifiants lisibles et prévisibles (CMD-1, BIL-1…), pratiques pour les tests. */
export class IdentifiantsSequentiels implements GenerateurIdentifiants {
  private commandes = 0;
  private billets = 0;

  nouvelleCommande(): CommandeId {
    this.commandes += 1;
    return CommandeId.de(`CMD-${this.commandes}`);
  }

  nouveauBillet(): BilletId {
    this.billets += 1;
    return BilletId.de(`BIL-${this.billets}`);
  }
}
