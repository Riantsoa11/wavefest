import { Soldes } from "../application/CashlessUseCases";
import { SoldeCashless } from "../domaine/SoldeCashless";

export class SoldesEnMemoire implements Soldes {
  private readonly parBracelet = new Map<string, SoldeCashless>();

  async sauver(solde: SoldeCashless): Promise<void> {
    this.parBracelet.set(solde.bracelet, solde);
  }

  async duBracelet(bracelet: string): Promise<SoldeCashless | undefined> {
    return this.parBracelet.get(bracelet);
  }
}
