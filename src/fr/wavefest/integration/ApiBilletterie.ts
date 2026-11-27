import { TitulairePublie } from "./LangagePublie";

/**
 * Open Host Service de la Billetterie : ce qu'elle offre aux autres contextes, dans le
 * langage publié. Les contextes en aval (Revente, Remboursements) n'utilisent que ça.
 */
export interface BilletPublie {
  readonly billet: string;
  readonly formule: "PASS_1_JOUR" | "PASS_3_JOURS" | "VIP";
  readonly joursValables: readonly number[];
  readonly titulaire: TitulairePublie;
  readonly prixAchatEnCentimes: number;
  readonly rembourse: boolean;
}

export interface OffreDeReventePubliee {
  readonly billet: string;
  readonly prixDeReventeEnCentimes: number;
  readonly commissionEnCentimes: number;
  readonly netVendeurEnCentimes: number;
}

export interface ApiBilletterie {
  billet(billet: string): Promise<BilletPublie | undefined>;
  /** Pass 1 jour valables ce jour-là. */
  pass1JourDuJour(jour: number): Promise<BilletPublie[]>;
  /** R6 vérifiée par la Billetterie : prix de revente ≤ prix d'achat, commission 5 %. */
  mettreEnRevente(billet: string, prixDeReventeEnCentimes: number): Promise<OffreDeReventePubliee>;
  retirerDeLaRevente(billet: string): Promise<void>;
  /** Le racheteur devient le titulaire (billet réémis à son nom). */
  ceder(billet: string, racheteur: TitulairePublie): Promise<OffreDeReventePubliee>;
  marquerRembourse(billet: string): Promise<void>;
}
