/**
 * Contexte Revente officielle (core) : permettre à un titulaire de revendre son billet à
 * un autre festivalier, au prix plafond (vérifié par la Billetterie, R6), avec 5 % de
 * commission. Elle combat le marché noir.
 */
export class ErreurRevente extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class SeulLeTitulairePeutRevendreException extends ErreurRevente {
  constructor(billet: string) {
    super(`Seul le titulaire du billet ${billet} peut le mettre en revente.`);
  }
}

export class AnnonceNonDisponibleException extends ErreurRevente {
  constructor(billet: string, statut: string) {
    super(`L'annonce du billet ${billet} n'est pas disponible (${statut}).`);
  }
}

export class RachatParLeVendeurException extends ErreurRevente {
  constructor() {
    super("Le vendeur ne peut pas racheter son propre billet.");
  }
}

export const StatutAnnonce = { OUVERTE: "OUVERTE", VENDUE: "VENDUE", RETIREE: "RETIREE" } as const;
export type StatutAnnonce = (typeof StatutAnnonce)[keyof typeof StatutAnnonce];

export interface Personne {
  readonly prenom: string;
  readonly nom: string;
  readonly email: string;
}

/**
 * Agrégat : l'annonce de revente d'un billet (une seule annonce ouverte par billet :
 * l'annonce est identifiée par le billet).
 */
export class AnnonceDeRevente {
  private statutActuel: StatutAnnonce = StatutAnnonce.OUVERTE;
  private acheteur: Personne | undefined;

  private constructor(
    readonly billet: string,
    readonly vendeur: Personne,
    readonly prixEnCentimes: number,
    readonly commissionEnCentimes: number,
    readonly netVendeurEnCentimes: number,
    readonly joursValables: readonly number[],
  ) {}

  /** Seul le titulaire actuel du billet peut le revendre. */
  static verifierQueLeVendeurEstLeTitulaire(billet: string, vendeur: Personne, titulaireActuel: Personne): void {
    if (vendeur.email.toLowerCase() !== titulaireActuel.email.toLowerCase()) {
      throw new SeulLeTitulairePeutRevendreException(billet);
    }
  }

  static publier(params: {
    billet: string;
    vendeur: Personne;
    titulaireActuel: Personne;
    prixEnCentimes: number;
    commissionEnCentimes: number;
    netVendeurEnCentimes: number;
    joursValables: readonly number[];
  }): AnnonceDeRevente {
    AnnonceDeRevente.verifierQueLeVendeurEstLeTitulaire(params.billet, params.vendeur, params.titulaireActuel);
    return new AnnonceDeRevente(
      params.billet,
      params.vendeur,
      params.prixEnCentimes,
      params.commissionEnCentimes,
      params.netVendeurEnCentimes,
      [...params.joursValables],
    );
  }

  statut(): StatutAnnonce {
    return this.statutActuel;
  }

  racheteur(): Personne | undefined {
    return this.acheteur;
  }

  estOuverte(): boolean {
    return this.statutActuel === StatutAnnonce.OUVERTE;
  }

  concerneLeJour(jour: number): boolean {
    return this.joursValables.includes(jour);
  }

  racheter(racheteur: Personne): void {
    this.exigerOuverte();
    if (racheteur.email.toLowerCase() === this.vendeur.email.toLowerCase()) throw new RachatParLeVendeurException();
    this.acheteur = racheteur;
    this.statutActuel = StatutAnnonce.VENDUE;
  }

  retirer(): void {
    this.exigerOuverte();
    this.statutActuel = StatutAnnonce.RETIREE;
  }

  private exigerOuverte(): void {
    if (!this.estOuverte()) throw new AnnonceNonDisponibleException(this.billet, this.statutActuel);
  }
}
