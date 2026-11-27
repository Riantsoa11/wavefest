/**
 * Identifiants typés : on ne peut pas passer un identifiant de billet là où on attend
 * un identifiant de commande.
 */
abstract class Identifiant<Marque extends string> {
  protected abstract readonly marque: Marque;

  protected constructor(private readonly brut: string) {
    if (brut.trim() === "") {
      throw new Error("Un identifiant ne peut pas être vide.");
    }
  }

  valeur(): string {
    return this.brut;
  }

  egale(autre: Identifiant<Marque>): boolean {
    return this.brut === autre.brut;
  }

  toString(): string {
    return this.brut;
  }
}

export class CommandeId extends Identifiant<"CommandeId"> {
  protected readonly marque = "CommandeId" as const;
  static de(valeur: string): CommandeId {
    return new CommandeId(valeur);
  }
}

export class BilletId extends Identifiant<"BilletId"> {
  protected readonly marque = "BilletId" as const;
  static de(valeur: string): BilletId {
    return new BilletId(valeur);
  }
}

export class VagueId extends Identifiant<"VagueId"> {
  protected readonly marque = "VagueId" as const;
  static de(valeur: string): VagueId {
    return new VagueId(valeur);
  }
}
