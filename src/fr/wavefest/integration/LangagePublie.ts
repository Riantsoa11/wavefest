/**
 * Published Language : les messages échangés entre bounded contexts.
 * Uniquement des données simples (texte, nombres, dates ISO) : aucun objet du domaine
 * d'un contexte ne traverse la frontière. Les montants sont en centimes.
 */

export interface TitulairePublie {
  readonly prenom: string;
  readonly nom: string;
  readonly email: string;
}

/** Billetterie → Contrôle d'accès, Revente (OHS + PL). */
export interface BilletEmis {
  readonly type: "BilletEmis";
  readonly billet: string;
  readonly formule: "PASS_1_JOUR" | "PASS_3_JOURS" | "VIP";
  /** Jours de festival pour lesquels le billet est valable (1, 2, 3). */
  readonly joursValables: readonly number[];
  readonly titulaire: TitulairePublie;
  readonly prixAchatEnCentimes: number;
}

/** Billetterie → Contrôle d'accès : le nom sur le billet a changé (changement de nom ou revente). */
export interface TitulaireChange {
  readonly type: "TitulaireChange";
  readonly billet: string;
  readonly titulaire: TitulairePublie;
}

/** Programmation → Billetterie (Customer / Supplier). */
export interface LineUpPublie {
  readonly type: "LineUpPublie";
  readonly concerts: readonly { concert: string; artiste: string; jour: number; teteDAffiche: boolean }[];
}

/** Programmation → Remboursements (Customer / Supplier). */
export interface ConcertAnnule {
  readonly type: "ConcertAnnule";
  readonly concert: string;
  readonly artiste: string;
  readonly jour: number;
  readonly teteDAffiche: boolean;
}

/** Revente → Remboursements (Customer / Supplier). */
export interface BilletRevendu {
  readonly type: "BilletRevendu";
  readonly billet: string;
  readonly racheteur: TitulairePublie;
  readonly prixDeReventeEnCentimes: number;
}

/** Remboursements → Revente : la campagne est ouverte, il faut retirer les annonces de la journée. */
export interface CampagneDeRemboursementOuverte {
  readonly type: "CampagneDeRemboursementOuverte";
  readonly jour: number;
}

/** Contrôle d'accès → Cashless (Partnership). */
export interface BilletEchangeContreBracelet {
  readonly type: "BilletEchangeContreBracelet";
  readonly billet: string;
  readonly bracelet: string;
  readonly titulaire: TitulairePublie;
}

export type MessagePublie =
  | BilletEmis
  | TitulaireChange
  | LineUpPublie
  | ConcertAnnule
  | BilletRevendu
  | CampagneDeRemboursementOuverte
  | BilletEchangeContreBracelet;
