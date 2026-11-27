import { ErreurMetier } from "./ErreurMetier";

export class QuantiteInvalideException extends ErreurMetier {
  constructor(valeur: number) {
    super(`Quantité invalide : ${valeur}. Une quantité est un nombre entier d'au moins 1.`);
  }
}

/** Value Object : un nombre de billets ou de places, toujours entier et au moins égal à 1. */
export class Quantite {
  private constructor(private readonly nombre: number) {}

  static de(valeur: number): Quantite {
    if (!Number.isInteger(valeur) || valeur < 1) {
      throw new QuantiteInvalideException(valeur);
    }
    return new Quantite(valeur);
  }

  valeur(): number {
    return this.nombre;
  }

  plus(autre: Quantite): Quantite {
    return new Quantite(this.nombre + autre.nombre);
  }

  depasse(limite: number): boolean {
    return this.nombre > limite;
  }

  egale(autre: Quantite): boolean {
    return this.nombre === autre.nombre;
  }
}
