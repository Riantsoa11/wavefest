/**
 * Contexte Contrôle d'accès (supporting) : vérifier le billet au portique et l'échanger
 * contre un bracelet. Ici, un billet n'est qu'une preuve à présenter, valable ou non.
 */
export class ErreurControleDAcces extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BilletRefuseMauvaisJourException extends ErreurControleDAcces {
  constructor(billet: string, jour: number) {
    super(`Billet ${billet} refusé : il n'est pas valable le jour ${jour}.`);
  }
}

export class BilletRefuseDejaUtiliseException extends ErreurControleDAcces {
  constructor(billet: string) {
    super(`Billet ${billet} refusé : il a déjà été échangé contre un bracelet.`);
  }
}

export class IdentiteNonConformeException extends ErreurControleDAcces {
  constructor(billet: string) {
    super(`Billet ${billet} refusé : la personne présente n'est pas le titulaire.`);
  }
}

export class BilletDejaEchangeException extends ErreurControleDAcces {
  constructor(billet: string) {
    super(`Le billet ${billet} est déjà échangé : son titulaire ne peut plus changer.`);
  }
}

export class EntreeRefuseeException extends ErreurControleDAcces {
  constructor(bracelet: string, jour: number) {
    super(`Entrée refusée : le bracelet ${bracelet} n'est pas valable le jour ${jour}.`);
  }
}

export interface Identite {
  readonly prenom: string;
  readonly nom: string;
  readonly email: string;
}

const memePersonne = (a: Identite, b: Identite): boolean =>
  a.prenom.toLowerCase() === b.prenom.toLowerCase() && a.nom.toLowerCase() === b.nom.toLowerCase();

/** Agrégat : la preuve d'accès que la Billetterie a émise. */
export class BilletDAcces {
  private echange = false;

  constructor(
    readonly billet: string,
    private titulaireActuel: Identite,
    readonly joursValables: readonly number[],
  ) {}

  titulaire(): Identite {
    return this.titulaireActuel;
  }

  estEchange(): boolean {
    return this.echange;
  }

  /** Le nom a changé dans la Billetterie (changement de nom ou revente). */
  changerDeTitulaire(nouveau: Identite): void {
    if (this.echange) throw new BilletDejaEchangeException(this.billet);
    this.titulaireActuel = nouveau;
  }

  /**
   * Au portique : le billet doit être valable ce jour-là, présenté par son titulaire,
   * et n'être échangé qu'une seule fois contre un bracelet.
   */
  echangerContreBracelet(jour: number, personnePresente: Identite, bracelet: string): Bracelet {
    if (!this.joursValables.includes(jour)) throw new BilletRefuseMauvaisJourException(this.billet, jour);
    if (this.echange) throw new BilletRefuseDejaUtiliseException(this.billet);
    if (!memePersonne(personnePresente, this.titulaireActuel)) throw new IdentiteNonConformeException(this.billet);
    this.echange = true;
    return new Bracelet(bracelet, this.billet, this.titulaireActuel, this.joursValables);
  }
}

/** Agrégat : le bracelet remis contre le billet ; il ouvre le portique les jours valables. */
export class Bracelet {
  private readonly entrees: number[] = [];

  constructor(
    readonly id: string,
    readonly billet: string,
    readonly titulaire: Identite,
    readonly joursValables: readonly number[],
  ) {}

  /** Sorties et retours : on peut repasser le portique les jours valables. */
  passerLePortique(jour: number): void {
    if (!this.joursValables.includes(jour)) throw new EntreeRefuseeException(this.id, jour);
    this.entrees.push(jour);
  }

  nombreDEntrees(): number {
    return this.entrees.length;
  }
}
