import { CampagneDeRemboursement, ouvreUneCampagne } from "../domaine/CampagneDeRemboursement";
import { ApiBilletterie } from "../../integration/ApiBilletterie";
import { Bus } from "../../integration/Bus";
import { BilletRevendu, ConcertAnnule } from "../../integration/LangagePublie";

/** Port : les campagnes de remboursement et les reventes connues (prix de rachat). */
export interface Campagnes {
  sauver(campagne: CampagneDeRemboursement): Promise<void>;
  duJour(jour: number): Promise<CampagneDeRemboursement | undefined>;
  ouvertes(): Promise<CampagneDeRemboursement[]>;
  memoriserUneRevente(billet: string, prixDeRachatEnCentimes: number): Promise<void>;
  prixDeRachat(billet: string): Promise<number | undefined>;
}

/** Port : verser un remboursement (implémenté par l'ACL du PSP). */
export interface Virements {
  rembourser(billet: string, montantEnCentimes: number): Promise<{ verse: boolean }>;
}

/** Port : prévenir les festivaliers (implémenté en Conformist avec le prestataire e-mail). */
export interface Avis {
  annulationSansRemboursement(email: string, artiste: string, jour: number): Promise<void>;
  remboursementEffectue(email: string, montantEnCentimes: number, artiste: string): Promise<boolean>;
}

export class RemboursementsUseCases {
  constructor(
    private readonly campagnes: Campagnes,
    private readonly billetterie: ApiBilletterie,
    private readonly virements: Virements,
    private readonly avis: Avis,
    private readonly bus: Bus,
  ) {}

  /** Revente → Remboursements (Customer / Supplier) : on retient le prix de rachat. */
  async quandUnBilletEstRevendu(message: BilletRevendu): Promise<void> {
    await this.campagnes.memoriserUneRevente(message.billet, message.prixDeReventeEnCentimes);
  }

  /** Programmation → Remboursements (Customer / Supplier) : un concert est annulé. */
  async quandUnConcertEstAnnule(message: ConcertAnnule): Promise<void> {
    const pass1Jour = await this.billetterie.pass1JourDuJour(message.jour);

    if (!ouvreUneCampagne(message)) {
      for (const billet of pass1Jour) {
        await this.avis.annulationSansRemboursement(billet.titulaire.email, message.artiste, message.jour);
      }
      return;
    }

    const campagne = new CampagneDeRemboursement(message.jour, message.concert);
    await this.bus.publier({ type: "CampagneDeRemboursementOuverte", jour: message.jour });

    for (const billet of pass1Jour) {
      campagne.ajouter(billet.billet, billet.titulaire, billet.prixAchatEnCentimes, await this.campagnes.prixDeRachat(billet.billet));
    }
    await this.campagnes.sauver(campagne);
    await this.effectuerLesRemboursements(campagne, message.artiste);
  }

  /** Lancé toutes les heures : relance les remboursements en échec (3 essais au plus). */
  async relancerLesRemboursements(artiste = "le concert annulé"): Promise<void> {
    for (const campagne of await this.campagnes.ouvertes()) {
      await this.effectuerLesRemboursements(campagne, artiste);
    }
  }

  private async effectuerLesRemboursements(campagne: CampagneDeRemboursement, artiste: string): Promise<void> {
    for (const remboursement of campagne.aEffectuer()) {
      const resultat = await this.virements.rembourser(remboursement.billet, remboursement.montantEnCentimes);
      if (!resultat.verse) {
        campagne.remboursementEchoue(remboursement.billet);
        continue;
      }
      campagne.remboursementEffectue(remboursement.billet);
      await this.billetterie.marquerRembourse(remboursement.billet);
      await this.avis.remboursementEffectue(remboursement.beneficiaire.email, remboursement.montantEnCentimes, artiste);
    }
    if (campagne.estTerminee()) campagne.clore();
    await this.campagnes.sauver(campagne);
  }
}
