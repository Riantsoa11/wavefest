import { Acces } from "../application/ControleDAccesUseCases";
import { BilletDAcces, Bracelet } from "../domaine/BilletDAcces";

export class AccesEnMemoire implements Acces {
  private readonly billets = new Map<string, BilletDAcces>();
  private readonly bracelets = new Map<string, Bracelet>();
  private compteur = 0;

  async sauverBillet(billet: BilletDAcces): Promise<void> {
    this.billets.set(billet.billet, billet);
  }

  async billet(billet: string): Promise<BilletDAcces | undefined> {
    return this.billets.get(billet);
  }

  async sauverBracelet(bracelet: Bracelet): Promise<void> {
    this.bracelets.set(bracelet.id, bracelet);
  }

  async bracelet(bracelet: string): Promise<Bracelet | undefined> {
    return this.bracelets.get(bracelet);
  }

  nouveauBracelet(): string {
    this.compteur += 1;
    return `BRA-${this.compteur}`;
  }
}
