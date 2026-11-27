import { BilletId, CommandeId } from "../domaine/commun/Identifiants";

export class CommandeIntrouvableException extends Error {
  constructor(commande: CommandeId) {
    super(`La commande ${commande.valeur()} est introuvable.`);
    this.name = "CommandeIntrouvableException";
  }
}

export class BilletIntrouvableException extends Error {
  constructor(billet: BilletId) {
    super(`Le billet ${billet.valeur()} est introuvable.`);
    this.name = "BilletIntrouvableException";
  }
}
