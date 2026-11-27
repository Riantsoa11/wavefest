import { ErreurMetier } from "../commun/ErreurMetier";
import { BilletId, CommandeId } from "../commun/Identifiants";
import { Montant } from "../commun/Montant";
import { Titulaire } from "../commun/Titulaire";
import { Formule } from "../offre/Formule";
import { OffreDeRevente } from "./OffreDeRevente";

export const StatutBillet = {
  VALIDE: "VALIDE",
  EN_REVENTE: "EN_REVENTE",
} as const;
export type StatutBillet = (typeof StatutBillet)[keyof typeof StatutBillet];

export class ChangementDeNomTropTardException extends ErreurMetier {
  constructor(billet: BilletId) {
    super(`Le nom du billet ${billet.valeur()} ne peut plus changer : la date limite J-7 est atteinte.`);
  }
}

export class PrixDeReventeTropEleveException extends ErreurMetier {
  constructor(prixDeRevente: Montant, prixAchat: Montant) {
    super(`Prix de revente refusé : ${prixDeRevente} dépasse le prix d'achat (${prixAchat}).`);
  }
}

export class BilletEnReventeException extends ErreurMetier {
  constructor(billet: BilletId) {
    super(`Le billet ${billet.valeur()} est en revente : retirez-le de la revente d'abord.`);
  }
}

export class BilletDejaRembourseException extends ErreurMetier {
  constructor(billet: BilletId) {
    super(`Le billet ${billet.valeur()} a déjà été remboursé.`);
  }
}

export class BilletPasEnReventeException extends ErreurMetier {
  constructor(billet: BilletId) {
    super(`Le billet ${billet.valeur()} n'est pas en revente.`);
  }
}

/**
 * Agrégat : un exemplaire de pass acheté, au nom d'un titulaire.
 * Il protège R5 (changement de nom gratuit jusqu'à J-7) et R6 (revente au prix d'achat
 * au plus, commission de 5 %).
 */
export class Billet {
  static readonly JOURS_AVANT_LE_FESTIVAL_POUR_CHANGER_DE_NOM = 7;

  private titulaireActuel: Titulaire;
  private statutActuel: StatutBillet = StatutBillet.VALIDE;
  private offreEnCours: OffreDeRevente | undefined;
  private dejaRembourse = false;

  private constructor(
    readonly id: BilletId,
    readonly commande: CommandeId,
    readonly formule: Formule,
    titulaire: Titulaire,
    readonly prixAchat: Montant,
    readonly debutDuFestival: Date,
    readonly joursValables: readonly number[],
  ) {
    this.titulaireActuel = titulaire;
  }

  static emettre(params: {
    id: BilletId;
    commande: CommandeId;
    formule: Formule;
    titulaire: Titulaire;
    prixAchat: Montant;
    debutDuFestival: Date;
    joursValables: readonly number[];
  }): Billet {
    return new Billet(
      params.id,
      params.commande,
      params.formule,
      params.titulaire,
      params.prixAchat,
      new Date(params.debutDuFestival.getTime()),
      [...params.joursValables],
    );
  }

  titulaire(): Titulaire {
    return this.titulaireActuel;
  }

  statut(): StatutBillet {
    return this.statutActuel;
  }

  estValableLe(jour: number): boolean {
    return this.joursValables.includes(jour);
  }

  estRembourse(): boolean {
    return this.dejaRembourse;
  }

  /**
   * Après l'annulation d'une tête d'affiche, le billet est remboursé une seule fois,
   * et il reste valable (réponse de l'expert, TP2).
   */
  marquerRembourse(): void {
    if (this.dejaRembourse) throw new BilletDejaRembourseException(this.id);
    this.dejaRembourse = true;
  }

  offreDeRevente(): OffreDeRevente | undefined {
    return this.offreEnCours;
  }

  /** J-7 : la date limite du changement de nom. À J-7 pile, c'est déjà trop tard. */
  dateLimiteDeChangementDeNom(): Date {
    const septJours = Billet.JOURS_AVANT_LE_FESTIVAL_POUR_CHANGER_DE_NOM * 24 * 60 * 60_000;
    return new Date(this.debutDuFestival.getTime() - septJours);
  }

  /** R5 : le changement de nom est gratuit, et refusé à partir de J-7. */
  changerTitulaire(nouveauTitulaire: Titulaire, maintenant: Date): void {
    if (this.statutActuel === StatutBillet.EN_REVENTE) throw new BilletEnReventeException(this.id);
    if (maintenant.getTime() >= this.dateLimiteDeChangementDeNom().getTime()) {
      throw new ChangementDeNomTropTardException(this.id);
    }
    this.titulaireActuel = nouveauTitulaire;
  }

  /** R6 : le prix de revente ne dépasse jamais le prix d'achat. */
  mettreEnRevente(prixDeRevente: Montant): OffreDeRevente {
    if (this.statutActuel === StatutBillet.EN_REVENTE) throw new BilletEnReventeException(this.id);
    if (prixDeRevente.depasse(this.prixAchat)) {
      throw new PrixDeReventeTropEleveException(prixDeRevente, this.prixAchat);
    }
    this.offreEnCours = new OffreDeRevente(this.id, prixDeRevente);
    this.statutActuel = StatutBillet.EN_REVENTE;
    return this.offreEnCours;
  }

  retirerDeLaRevente(): void {
    if (this.statutActuel !== StatutBillet.EN_REVENTE) throw new BilletPasEnReventeException(this.id);
    this.offreEnCours = undefined;
    this.statutActuel = StatutBillet.VALIDE;
  }

  /** Le racheteur devient le titulaire ; l'offre indique la commission et le net du vendeur. */
  revendreA(racheteur: Titulaire): OffreDeRevente {
    const offre = this.offreEnCours;
    if (this.statutActuel !== StatutBillet.EN_REVENTE || !offre) {
      throw new BilletPasEnReventeException(this.id);
    }
    this.titulaireActuel = racheteur;
    this.offreEnCours = undefined;
    this.statutActuel = StatutBillet.VALIDE;
    return offre;
  }
}
