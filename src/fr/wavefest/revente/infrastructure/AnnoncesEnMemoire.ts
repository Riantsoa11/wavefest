import { Annonces } from "../application/ReventeUseCases";
import { AnnonceDeRevente } from "../domaine/AnnonceDeRevente";

export class AnnoncesEnMemoire implements Annonces {
  private readonly parBillet = new Map<string, AnnonceDeRevente>();

  async sauver(annonce: AnnonceDeRevente): Promise<void> {
    this.parBillet.set(annonce.billet, annonce);
  }

  async duBillet(billet: string): Promise<AnnonceDeRevente | undefined> {
    return this.parBillet.get(billet);
  }

  async ouvertes(): Promise<AnnonceDeRevente[]> {
    return [...this.parBillet.values()].filter((a) => a.estOuverte());
  }
}
