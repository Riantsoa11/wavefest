import { BanqueCashless } from "../../application/CashlessUseCases";
import { Centimes } from "../../domaine/SoldeCashless";
import { ApiPspSimulee } from "../../../externe/psp/ApiPspSimulee";

/** ACL du Cashless : traduit recharges et remboursements vers le modèle du PSP. */
export class PspCashlessAdapter implements BanqueCashless {
  constructor(private readonly psp: ApiPspSimulee) {}

  async encaisserUneRecharge(bracelet: string, montant: Centimes): Promise<{ accepte: boolean; motif?: string }> {
    const intent = await this.psp.createPaymentIntent({ amount_cents: montant.valeur, currency: "eur", reference: bracelet });
    return intent.status === "succeeded" ? { accepte: true } : { accepte: false, motif: "carte refusée" };
  }

  async verserUnRemboursement(bracelet: string, montant: Centimes): Promise<{ verse: boolean; motif?: string }> {
    const refund = await this.psp.createRefund({ amount_cents: montant.valeur, currency: "eur", reference: bracelet });
    return refund.status === "succeeded" ? { verse: true } : { verse: false, motif: "prestataire indisponible" };
  }
}
