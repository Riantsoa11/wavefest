import { AnnonceDeRevente, ErreurRevente, Personne } from "../domaine/AnnonceDeRevente";
import { ApiBilletterie } from "../../integration/ApiBilletterie";
import { Bus } from "../../integration/Bus";

export class BilletInconnuDeLaBilletterieException extends ErreurRevente {
  constructor(billet: string) {
    super(`La Billetterie ne connaît pas le billet ${billet}.`);
  }
}

export class AnnonceIntrouvableException extends ErreurRevente {
  constructor(billet: string) {
    super(`Aucune annonce pour le billet ${billet}.`);
  }
}

/** Port : le dépôt des annonces. */
export interface Annonces {
  sauver(annonce: AnnonceDeRevente): Promise<void>;
  duBillet(billet: string): Promise<AnnonceDeRevente | undefined>;
  ouvertes(): Promise<AnnonceDeRevente[]>;
}

/**
 * Cas d'usage de la Revente. Elle est en aval de la Billetterie (OHS + PL) : c'est la
 * Billetterie qui vérifie le prix plafond (R6) et réémet le billet au nom du racheteur.
 */
export class ReventeUseCases {
  constructor(
    private readonly billetterie: ApiBilletterie,
    private readonly annonces: Annonces,
    private readonly bus: Bus,
  ) {}

  async mettreEnRevente(billet: string, vendeur: Personne, prixEnCentimes: number): Promise<AnnonceDeRevente> {
    const publie = await this.billetterie.billet(billet);
    if (!publie) throw new BilletInconnuDeLaBilletterieException(billet);
    AnnonceDeRevente.verifierQueLeVendeurEstLeTitulaire(billet, vendeur, publie.titulaire);
    const offre = await this.billetterie.mettreEnRevente(billet, prixEnCentimes);
    const annonce = AnnonceDeRevente.publier({
      billet,
      vendeur,
      titulaireActuel: publie.titulaire,
      prixEnCentimes: offre.prixDeReventeEnCentimes,
      commissionEnCentimes: offre.commissionEnCentimes,
      netVendeurEnCentimes: offre.netVendeurEnCentimes,
      joursValables: publie.joursValables,
    });
    await this.annonces.sauver(annonce);
    return annonce;
  }

  /** Revente → Remboursements (Customer / Supplier) : Billet revendu. */
  async racheter(billet: string, racheteur: Personne): Promise<AnnonceDeRevente> {
    const annonce = await this.annonce(billet);
    annonce.racheter(racheteur);
    await this.billetterie.ceder(billet, racheteur);
    await this.annonces.sauver(annonce);
    await this.bus.publier({
      type: "BilletRevendu",
      billet,
      racheteur,
      prixDeReventeEnCentimes: annonce.prixEnCentimes,
    });
    return annonce;
  }

  async retirer(billet: string): Promise<void> {
    const annonce = await this.annonce(billet);
    annonce.retirer();
    await this.billetterie.retirerDeLaRevente(billet);
    await this.annonces.sauver(annonce);
  }

  /** Demande des Remboursements : retirer les annonces ouvertes de la journée annulée. */
  async retirerLesAnnoncesDuJour(jour: number): Promise<number> {
    const concernees = (await this.annonces.ouvertes()).filter((annonce) => annonce.concerneLeJour(jour));
    for (const annonce of concernees) await this.retirer(annonce.billet);
    return concernees.length;
  }

  private async annonce(billet: string): Promise<AnnonceDeRevente> {
    const annonce = await this.annonces.duBillet(billet);
    if (!annonce) throw new AnnonceIntrouvableException(billet);
    return annonce;
  }
}
