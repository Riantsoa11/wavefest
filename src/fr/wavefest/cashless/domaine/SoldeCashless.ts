/**
 * Contexte Cashless (supporting) : gérer le solde du bracelet (recharges, consommations,
 * remboursement du solde). Le mot « billet » n'existe pas ici : on parle de bracelet.
 */
export class ErreurCashless extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class MontantCashlessInvalideException extends ErreurCashless {
  constructor() {
    super("Un montant cashless est un nombre entier de centimes, strictement positif.");
  }
}

export class SoldeInsuffisantException extends ErreurCashless {
  constructor(bracelet: string) {
    super(`Paiement cashless refusé : solde insuffisant sur le bracelet ${bracelet}.`);
  }
}

export class RemboursementHorsDelaiException extends ErreurCashless {
  constructor() {
    super("Remboursement du solde refusé : la période de remboursement (J+15) est close.");
  }
}

export class RemboursementAvantLaFinException extends ErreurCashless {
  constructor() {
    super("Le remboursement du solde ouvre à la fin du festival.");
  }
}

export class SoldeTropFaiblePourEtreRembourseException extends ErreurCashless {
  constructor() {
    super("Le solde ne couvre pas les frais de remboursement de 1,50 €.");
  }
}

export class SoldeDejaRembourseException extends ErreurCashless {
  constructor(bracelet: string) {
    super(`Le solde du bracelet ${bracelet} a déjà été remboursé.`);
  }
}

/** Value Object : une somme en centimes entiers (jamais de nombre à virgule). */
export class Centimes {
  private constructor(readonly valeur: number) {}

  static de(valeur: number): Centimes {
    if (!Number.isSafeInteger(valeur) || valeur < 0) throw new MontantCashlessInvalideException();
    return new Centimes(valeur);
  }

  static positif(valeur: number): Centimes {
    if (!Number.isSafeInteger(valeur) || valeur <= 0) throw new MontantCashlessInvalideException();
    return new Centimes(valeur);
  }

  plus(autre: Centimes): Centimes {
    return new Centimes(this.valeur + autre.valeur);
  }

  moins(autre: Centimes): Centimes {
    return new Centimes(this.valeur - autre.valeur);
  }

  depasse(autre: Centimes): boolean {
    return this.valeur > autre.valeur;
  }
}

/**
 * Agrégat : le solde cashless d'un bracelet.
 * Règles : on ne paie pas au-delà du solde ; remboursement du solde de la fin du festival
 * jusqu'à J+15, une seule fois, avec 1,50 € de frais retenus.
 */
export class SoldeCashless {
  static readonly FRAIS_DE_REMBOURSEMENT = Centimes.de(150);
  static readonly JOURS_POUR_DEMANDER_LE_REMBOURSEMENT = 15;

  private solde = Centimes.de(0);
  private rembourse = false;

  private constructor(
    readonly bracelet: string,
    readonly titulaireEmail: string,
  ) {}

  static ouvrir(bracelet: string, titulaireEmail: string): SoldeCashless {
    return new SoldeCashless(bracelet, titulaireEmail);
  }

  montant(): Centimes {
    return this.solde;
  }

  recharger(montant: Centimes): void {
    this.exigerNonRembourse();
    this.solde = this.solde.plus(montant);
  }

  payerUneConsommation(prix: Centimes): void {
    this.exigerNonRembourse();
    if (prix.depasse(this.solde)) throw new SoldeInsuffisantException(this.bracelet);
    this.solde = this.solde.moins(prix);
  }

  /**
   * Le montant à verser : le solde moins 1,50 € de frais. On peut le demander de la fin
   * du festival jusqu'à J+15, une seule fois. Ne change rien tant que le versement
   * n'est pas confirmé.
   */
  montantARembourser(maintenant: Date, finDuFestival: Date): Centimes {
    this.exigerNonRembourse();
    const limite = finDuFestival.getTime() + SoldeCashless.JOURS_POUR_DEMANDER_LE_REMBOURSEMENT * 24 * 60 * 60_000;
    if (maintenant.getTime() < finDuFestival.getTime()) throw new RemboursementAvantLaFinException();
    if (maintenant.getTime() > limite) throw new RemboursementHorsDelaiException();
    if (!this.solde.depasse(SoldeCashless.FRAIS_DE_REMBOURSEMENT)) throw new SoldeTropFaiblePourEtreRembourseException();
    return this.solde.moins(SoldeCashless.FRAIS_DE_REMBOURSEMENT);
  }

  /** Le versement est fait : le solde est remis à zéro et ne bouge plus. */
  confirmerLeRemboursement(): void {
    this.exigerNonRembourse();
    this.solde = Centimes.de(0);
    this.rembourse = true;
  }

  estRembourse(): boolean {
    return this.rembourse;
  }

  private exigerNonRembourse(): void {
    if (this.rembourse) throw new SoldeDejaRembourseException(this.bracelet);
  }
}
