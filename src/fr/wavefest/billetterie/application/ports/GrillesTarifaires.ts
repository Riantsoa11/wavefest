import { GrilleTarifaire } from "../../domaine/offre/GrilleTarifaire";

/** Port : le dépôt de la grille tarifaire de l'édition. */
export interface GrillesTarifaires {
  grilleActuelle(): Promise<GrilleTarifaire>;
  sauver(grille: GrilleTarifaire): Promise<void>;
}
