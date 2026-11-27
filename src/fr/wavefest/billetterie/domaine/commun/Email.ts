import { ErreurMetier } from "./ErreurMetier";

export class EmailInvalideException extends ErreurMetier {
  constructor(valeur: string) {
    super(`Adresse e-mail invalide : « ${valeur} »`);
  }
}

/** Value Object : l'adresse e-mail d'un acheteur ou d'un titulaire. */
export class Email {
  private static readonly FORME = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly adresse: string) {}

  static de(valeur: string): Email {
    const adresse = valeur.trim().toLowerCase();
    if (!Email.FORME.test(adresse)) {
      throw new EmailInvalideException(valeur);
    }
    return new Email(adresse);
  }

  valeur(): string {
    return this.adresse;
  }

  egale(autre: Email): boolean {
    return this.adresse === autre.adresse;
  }
}
