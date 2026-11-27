import { Virements } from "../../application/RemboursementsUseCases";
import { ApiPspSimulee } from "../../../externe/psp/ApiPspSimulee";

/** ACL des Remboursements : traduit un virement vers le modèle du PSP. */
export class PspRemboursementAdapter implements Virements {
  constructor(private readonly psp: ApiPspSimulee) {}

  async rembourser(billet: string, montantEnCentimes: number): Promise<{ verse: boolean }> {
    const refund = await this.psp.createRefund({ amount_cents: montantEnCentimes, currency: "eur", reference: billet });
    return { verse: refund.status === "succeeded" };
  }
}
