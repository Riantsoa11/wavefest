import { Campagnes } from "../application/RemboursementsUseCases";
import { CampagneDeRemboursement } from "../domaine/CampagneDeRemboursement";

export class CampagnesEnMemoire implements Campagnes {
  private readonly parJour = new Map<number, CampagneDeRemboursement>();
  private readonly reventes = new Map<string, number>();

  async sauver(campagne: CampagneDeRemboursement): Promise<void> {
    this.parJour.set(campagne.jour, campagne);
  }

  async duJour(jour: number): Promise<CampagneDeRemboursement | undefined> {
    return this.parJour.get(jour);
  }

  async ouvertes(): Promise<CampagneDeRemboursement[]> {
    return [...this.parJour.values()].filter((c) => !c.estClose());
  }

  async memoriserUneRevente(billet: string, prixDeRachatEnCentimes: number): Promise<void> {
    this.reventes.set(billet, prixDeRachatEnCentimes);
  }

  async prixDeRachat(billet: string): Promise<number | undefined> {
    return this.reventes.get(billet);
  }
}
