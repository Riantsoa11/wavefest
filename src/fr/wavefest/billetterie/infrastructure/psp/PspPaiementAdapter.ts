import { PortPaiement, ResultatPaiement } from "../../application/ports";
import { CommandeId } from "../../domaine/commun/Identifiants";
import { Montant } from "../../domaine/commun/Montant";
import { ApiPspSimulee, PaymentIntent } from "./ApiPspSimulee";

/**
 * Anticorruption Layer (ACL) : traduit notre langage (Montant, CommandeId, paiement
 * accepté/refusé) vers celui du PSP, et inversement. Aucun mot du PSP n'en sort.
 */
export class PspPaiementAdapter implements PortPaiement {
  constructor(private readonly psp: ApiPspSimulee) {}

  async payer(commande: CommandeId, montant: Montant): Promise<ResultatPaiement> {
    const intent = await this.psp.createPaymentIntent({
      amount_cents: montant.centimes(),
      currency: "eur",
      reference: commande.valeur(),
    });
    return this.traduire(intent);
  }

  private traduire(intent: PaymentIntent): ResultatPaiement {
    if (intent.status === "succeeded") return { issue: "PAIEMENT_ACCEPTE" };
    return { issue: "PAIEMENT_REFUSE", motif: this.motifEnFrancais(intent.last_error?.code) };
  }

  private motifEnFrancais(code: string | undefined): string {
    switch (code) {
      case "card_declined":
        return "Carte refusée";
      case "insufficient_funds":
        return "Fonds insuffisants";
      default:
        return "Paiement refusé par le prestataire";
    }
  }
}
