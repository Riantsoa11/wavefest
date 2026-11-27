import { BilletId } from "../commun/Identifiants";
import { Montant } from "../commun/Montant";

/**
 * Value Object : la mise en revente d'un billet à un prix donné.
 * R6 : WaveFest retient 5 % du prix de revente sur le net versé au vendeur
 * (réponse de l'expert).
 */
export class OffreDeRevente {
  static readonly TAUX_DE_COMMISSION_EN_POURCENT = 5;

  readonly commission: Montant;
  readonly netVendeur: Montant;

  constructor(
    readonly billet: BilletId,
    readonly prixDeRevente: Montant,
  ) {
    this.commission = prixDeRevente.pourcentage(OffreDeRevente.TAUX_DE_COMMISSION_EN_POURCENT);
    this.netVendeur = prixDeRevente.moins(this.commission);
  }
}
