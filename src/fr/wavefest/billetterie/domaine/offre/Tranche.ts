import { VagueId } from "../commun/Identifiants";
import { Montant } from "../commun/Montant";
import { Quantite } from "../commun/Quantite";

/**
 * Value Object : une partie d'une réservation, prise dans une seule vague, à son prix.
 * Une commande à cheval sur deux vagues donne deux tranches (réponse de l'expert, R3).
 */
export class Tranche {
  constructor(
    readonly vague: VagueId,
    readonly quantite: Quantite,
    readonly prixUnitaire: Montant,
  ) {}

  sousTotal(): Montant {
    return this.prixUnitaire.fois(this.quantite.valeur());
  }
}
