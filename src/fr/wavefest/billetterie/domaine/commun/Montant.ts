import { ErreurMetier } from "./ErreurMetier";

export class MontantInvalideException extends ErreurMetier {
  constructor(raison: string) {
    super(`Montant invalide : ${raison}`);
  }
}

/**
 * Value Object : une somme d'argent en euros.
 * Stockée en centimes entiers : jamais de nombre à virgule pour l'argent (0,1 + 0,2 ≠ 0,3).
 */
export class Montant {
  private constructor(private readonly enCentimes: number) {
    if (!Number.isSafeInteger(enCentimes)) {
      throw new MontantInvalideException("un montant se compte en centimes entiers");
    }
    if (enCentimes < 0) {
      throw new MontantInvalideException("un montant ne peut pas être négatif");
    }
  }

  static euros(euros: number): Montant {
    return new Montant(Math.round(euros * 100));
  }

  static centimes(centimes: number): Montant {
    return new Montant(centimes);
  }

  static zero(): Montant {
    return new Montant(0);
  }

  centimes(): number {
    return this.enCentimes;
  }

  plus(autre: Montant): Montant {
    return new Montant(this.enCentimes + autre.enCentimes);
  }

  moins(autre: Montant): Montant {
    return new Montant(this.enCentimes - autre.enCentimes);
  }

  fois(quantite: number): Montant {
    return new Montant(this.enCentimes * quantite);
  }

  /** Pourcentage arrondi au centime le plus proche (ex. 5 % de commission). */
  pourcentage(pourcent: number): Montant {
    return new Montant(Math.round((this.enCentimes * pourcent) / 100));
  }

  depasse(autre: Montant): boolean {
    return this.enCentimes > autre.enCentimes;
  }

  egale(autre: Montant): boolean {
    return this.enCentimes === autre.enCentimes;
  }

  toString(): string {
    return `${(this.enCentimes / 100).toFixed(2).replace(".", ",")} €`;
  }
}
