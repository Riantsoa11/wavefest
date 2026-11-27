/**
 * Contexte Remboursements (supporting) : appliquer les règles maison quand un concert
 * est annulé. Si c'est la tête d'affiche du jour : 50 % du prix payé, rendu au titulaire
 * actuel des pass 1 jour de ce jour. Elle pilote les campagnes et les relances du PSP.
 */
export class ErreurRemboursements extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BilletDejaDansLaCampagneException extends ErreurRemboursements {
  constructor(billet: string) {
    super(`Le billet ${billet} a déjà son remboursement dans la campagne.`);
  }
}

export class CampagneDejaCloseException extends ErreurRemboursements {
  constructor(jour: number) {
    super(`La campagne du jour ${jour} est close.`);
  }
}

export class CampagneIncompleteException extends ErreurRemboursements {
  constructor(jour: number) {
    super(`La campagne du jour ${jour} ne peut pas être close : des remboursements restent à faire.`);
  }
}

export class RemboursementInconnuException extends ErreurRemboursements {
  constructor(billet: string) {
    super(`Aucun remboursement pour le billet ${billet} dans cette campagne.`);
  }
}

export interface Beneficiaire {
  readonly prenom: string;
  readonly nom: string;
  readonly email: string;
}

/** Seule l'annulation de la tête d'affiche du jour ouvre une campagne de remboursement. */
export function ouvreUneCampagne(annulation: { teteDAffiche: boolean }): boolean {
  return annulation.teteDAffiche;
}

/**
 * Le montant rendu : 50 % du prix payé par le titulaire actuel. Si le billet a été
 * revendu, c'est 50 % de son prix de rachat (réponse de l'expert, Q1). Arrondi au centime.
 */
export function montantARembourser(prixAchatEnCentimes: number, prixDeRachatEnCentimes?: number): number {
  const prixPayeParLeTitulaire = prixDeRachatEnCentimes ?? prixAchatEnCentimes;
  return Math.round(prixPayeParLeTitulaire / 2);
}

export const StatutRemboursement = {
  A_EFFECTUER: "A_EFFECTUER",
  EFFECTUE: "EFFECTUE",
  A_TRAITER: "A_TRAITER",
} as const;
export type StatutRemboursement = (typeof StatutRemboursement)[keyof typeof StatutRemboursement];

/** Entité de la campagne : le remboursement d'un billet (un seul par billet). */
export class Remboursement {
  static readonly ESSAIS_MAXIMUM = 3;
  private statutActuel: StatutRemboursement = StatutRemboursement.A_EFFECTUER;
  private echecs = 0;

  constructor(
    readonly billet: string,
    readonly beneficiaire: Beneficiaire,
    readonly montantEnCentimes: number,
  ) {}

  statut(): StatutRemboursement {
    return this.statutActuel;
  }

  nombreDEchecs(): number {
    return this.echecs;
  }

  marquerEffectue(): void {
    this.statutActuel = StatutRemboursement.EFFECTUE;
  }

  /** Après 3 échecs du PSP, le remboursement passe en traitement manuel. */
  enregistrerUnEchec(): void {
    this.echecs += 1;
    if (this.echecs >= Remboursement.ESSAIS_MAXIMUM) this.statutActuel = StatutRemboursement.A_TRAITER;
  }
}

/** Agrégat : la campagne de remboursement d'une journée dont la tête d'affiche est annulée. */
export class CampagneDeRemboursement {
  private readonly remboursements: Remboursement[] = [];
  private close = false;

  constructor(
    readonly jour: number,
    readonly concertAnnule: string,
  ) {}

  ajouter(billet: string, beneficiaire: Beneficiaire, prixAchatEnCentimes: number, prixDeRachatEnCentimes?: number): void {
    this.exigerOuverte();
    if (this.remboursements.some((r) => r.billet === billet)) throw new BilletDejaDansLaCampagneException(billet);
    this.remboursements.push(
      new Remboursement(billet, beneficiaire, montantARembourser(prixAchatEnCentimes, prixDeRachatEnCentimes)),
    );
  }

  aEffectuer(): readonly Remboursement[] {
    return this.remboursements.filter((r) => r.statut() === StatutRemboursement.A_EFFECTUER);
  }

  aTraiterALaMain(): readonly Remboursement[] {
    return this.remboursements.filter((r) => r.statut() === StatutRemboursement.A_TRAITER);
  }

  tous(): readonly Remboursement[] {
    return [...this.remboursements];
  }

  remboursementEffectue(billet: string): void {
    this.remboursement(billet).marquerEffectue();
  }

  remboursementEchoue(billet: string): void {
    this.remboursement(billet).enregistrerUnEchec();
  }

  /** Quand tous les billets sont remboursés, la campagne est close. */
  estTerminee(): boolean {
    return this.remboursements.every((r) => r.statut() === StatutRemboursement.EFFECTUE);
  }

  clore(): void {
    this.exigerOuverte();
    if (!this.estTerminee()) throw new CampagneIncompleteException(this.jour);
    this.close = true;
  }

  estClose(): boolean {
    return this.close;
  }

  private remboursement(billet: string): Remboursement {
    const trouve = this.remboursements.find((r) => r.billet === billet);
    if (!trouve) throw new RemboursementInconnuException(billet);
    return trouve;
  }

  private exigerOuverte(): void {
    if (this.close) throw new CampagneDejaCloseException(this.jour);
  }
}
