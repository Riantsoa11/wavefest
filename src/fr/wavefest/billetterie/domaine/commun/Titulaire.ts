import { Email } from "./Email";
import { ErreurMetier } from "./ErreurMetier";

export class TitulaireInvalideException extends ErreurMetier {
  constructor() {
    super("Un titulaire doit avoir un nom et un prénom.");
  }
}

/** Value Object : la personne dont le nom figure sur le billet. Elle seule peut entrer avec. */
export class Titulaire {
  private constructor(
    readonly prenom: string,
    readonly nom: string,
    readonly email: Email,
  ) {}

  static nomme(prenom: string, nom: string, email: string): Titulaire {
    if (prenom.trim() === "" || nom.trim() === "") {
      throw new TitulaireInvalideException();
    }
    return new Titulaire(prenom.trim(), nom.trim(), Email.de(email));
  }

  estLeMemeQue(autre: Titulaire): boolean {
    return (
      this.prenom.toLowerCase() === autre.prenom.toLowerCase() &&
      this.nom.toLowerCase() === autre.nom.toLowerCase() &&
      this.email.egale(autre.email)
    );
  }

  toString(): string {
    return `${this.prenom} ${this.nom}`;
  }
}
