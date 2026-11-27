import { Montant } from "../commun/Montant";
import { Titulaire } from "../commun/Titulaire";
import { Formule } from "../offre/Formule";
import { Tranche } from "../offre/Tranche";

/**
 * Value Object de l'agrégat Commande : des billets d'une même formule, pris dans une
 * même vague (une tranche), chacun au nom d'un titulaire.
 */
export class LigneCommande {
  constructor(
    readonly formule: Formule,
    readonly tranche: Tranche,
    readonly titulaires: readonly Titulaire[],
    readonly joursValables: readonly number[],
  ) {}

  nombreDeBillets(): number {
    return this.tranche.quantite.valeur();
  }

  sousTotal(): Montant {
    return this.tranche.sousTotal();
  }
}
