/**
 * Système externe simulé : l'API du PSP (prestataire de paiement), à ne pas modifier.
 * Son modèle n'est pas le nôtre : chaque contexte qui l'utilise passe par sa propre ACL.
 * Son vocabulaire (payment_intent, refund, succeeded, amount_cents…) ne doit pas
 * apparaître ailleurs que dans les dossiers infrastructure/psp des contextes.
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

export interface RefundRequest {
  amount_cents: number;
  currency: "eur";
  reference: string;
}

export interface Refund {
  id: string;
  status: "succeeded" | "failed" | "pending";
  amount_cents: number;
  failure_reason?: string;
}

export class ApiPspSimulee {
  private compteur = 0;
  private readonly referencesRefusees = new Set<string>();
  private readonly pannesDeRemboursement = new Map<string, number>();
  private readonly remboursementsEffectues: Refund[] = [];

  /** Pour les tests : les paiements de cette référence seront refusés (carte refusée). */
  refuserLaReference(reference: string): void {
    this.referencesRefusees.add(reference);
  }

  /** Pour les tests : les `nombre` prochains remboursements de cette référence échouent. */
  fairEchouerLesRemboursements(reference: string, nombre: number): void {
    this.pannesDeRemboursement.set(reference, nombre);
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntent> {
    const id = this.nouvelId("pi");
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

  async createRefund(request: RefundRequest): Promise<Refund> {
    const id = this.nouvelId("re");
    const pannes = this.pannesDeRemboursement.get(request.reference) ?? 0;
    if (pannes > 0) {
      this.pannesDeRemboursement.set(request.reference, pannes - 1);
      return { id, status: "failed", amount_cents: request.amount_cents, failure_reason: "processor_unavailable" };
    }
    const refund: Refund = { id, status: "succeeded", amount_cents: request.amount_cents };
    this.remboursementsEffectues.push(refund);
    return refund;
  }

  totalRembourseEnCentimes(): number {
    return this.remboursementsEffectues.reduce((total, r) => total + r.amount_cents, 0);
  }

  private nouvelId(prefixe: string): string {
    this.compteur += 1;
    return `${prefixe}_${this.compteur.toString().padStart(6, "0")}`;
  }
}
