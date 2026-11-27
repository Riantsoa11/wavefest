/**
 * Simulation de l'API du PSP (prestataire de paiement). Équivalent du « ApiPspSimulee »
 * fourni par le squelette : c'est un système externe, son modèle n'est pas le nôtre.
 * Son vocabulaire (payment_intent, succeeded, amount_cents…) ne doit JAMAIS sortir de
 * l'infrastructure : c'est le rôle de l'ACL PspPaiementAdapter.
 */
export interface PaymentIntentRequest {
  amount_cents: number;
  currency: "eur";
  reference: string;
}

export interface PaymentIntent {
  id: string;
  status: "succeeded" | "requires_payment_method" | "canceled";
  amount_cents: number;
  last_error?: { code: string; message: string };
}

export class ApiPspSimulee {
  private compteur = 0;
  private readonly referencesRefusees = new Set<string>();

  /** Pour les tests : le prochain paiement de cette référence sera refusé (carte refusée). */
  refuserLaReference(reference: string): void {
    this.referencesRefusees.add(reference);
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntent> {
    this.compteur += 1;
    const id = `pi_${this.compteur.toString().padStart(6, "0")}`;
    if (this.referencesRefusees.has(request.reference)) {
      return {
        id,
        status: "requires_payment_method",
        amount_cents: request.amount_cents,
        last_error: { code: "card_declined", message: "Your card was declined." },
      };
    }
    return { id, status: "succeeded", amount_cents: request.amount_cents };
  }
}
