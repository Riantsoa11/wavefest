import { Email } from "../commun/Email";
import { ErreurMetier } from "../commun/ErreurMetier";
import { CommandeId } from "../commun/Identifiants";
import { Montant } from "../commun/Montant";
import { Titulaire } from "../commun/Titulaire";
import { Formule, joursValablesPour } from "../offre/Formule";
import { Tranche } from "../offre/Tranche";
import { CommandePayee, PlacePayee } from "./CommandePayee";
import { LigneCommande } from "./LigneCommande";

export const StatutCommande = {
  EN_COURS: "EN_COURS",
  PAIEMENT_INITIE: "PAIEMENT_INITIE",
  PAYEE: "PAYEE",
  ANNULEE: "ANNULEE",
  EXPIREE: "EXPIREE",
} as const;
export type StatutCommande = (typeof StatutCommande)[keyof typeof StatutCommande];

export class LimiteDeBilletsDepasseeException extends ErreurMetier {
  constructor(commande: CommandeId, limite: number) {
    super(`La commande ${commande.valeur()} ne peut pas dépasser ${limite} billets.`);
  }
}

export class TitulairesManquantsException extends ErreurMetier {
  constructor(billets: number, titulaires: number) {
    super(`Chaque billet est nominatif : ${billets} billets mais ${titulaires} titulaires renseignés.`);
  }
}

export class StatutDeCommandeInattenduException extends ErreurMetier {
  constructor(commande: CommandeId, attendu: StatutCommande, reel: StatutCommande) {
    super(`La commande ${commande.valeur()} est ${reel} : cette action demande une commande ${attendu}.`);
  }
}

export class CommandeVideException extends ErreurMetier {
  constructor(commande: CommandeId) {
    super(`La commande ${commande.valeur()} ne contient aucun billet.`);
  }
}

export class DelaiDePaiementDepasseException extends ErreurMetier {
  constructor(commande: CommandeId) {
    super(`La commande ${commande.valeur()} n'a pas été payée dans les 15 minutes : elle a expiré.`);
  }
}

export class DelaiDePaiementNonEcouleException extends ErreurMetier {
  constructor(commande: CommandeId) {
    super(`La commande ${commande.valeur()} est encore dans son délai de paiement.`);
  }
}

/**
 * Agrégat : l'achat de 1 à 6 billets par un acheteur, en un seul paiement.
 * Il protège R1 (6 billets maximum) et R4 (non payée sous 15 min : expirée).
 * Pas de setter : l'état ne change que par des actions métier.
 */
export class Commande {
  static readonly BILLETS_MAXIMUM = 6;
  static readonly DELAI_DE_PAIEMENT_EN_MINUTES = 15;

  private readonly lignes: LigneCommande[] = [];
  private statutActuel: StatutCommande = StatutCommande.EN_COURS;

  private constructor(
    readonly id: CommandeId,
    readonly acheteur: Email,
    readonly ouverteLe: Date,
  ) {}

  static ouvrir(id: CommandeId, acheteur: Email, maintenant: Date): Commande {
    return new Commande(id, acheteur, new Date(maintenant.getTime()));
  }

  /**
   * R1 : une commande ne contient jamais plus de 6 billets.
   * Un pass 1 jour indique son jour (1, 2 ou 3) ; les autres pass valent pour les 3 jours.
   */
  ajouterBillets(
    formule: Formule,
    tranches: readonly Tranche[],
    titulaires: readonly Titulaire[],
    jour?: number,
  ): void {
    this.exigerStatut(StatutCommande.EN_COURS);
    const demandes = tranches.reduce((total, tranche) => total + tranche.quantite.valeur(), 0);
    if (this.nombreDeBillets() + demandes > Commande.BILLETS_MAXIMUM) {
      throw new LimiteDeBilletsDepasseeException(this.id, Commande.BILLETS_MAXIMUM);
    }
    if (titulaires.length !== demandes) {
      throw new TitulairesManquantsException(demandes, titulaires.length);
    }
    const joursValables = joursValablesPour(formule, jour);

    let premier = 0;
    for (const tranche of tranches) {
      const titulairesDeLaTranche = titulaires.slice(premier, premier + tranche.quantite.valeur());
      this.lignes.push(new LigneCommande(formule, tranche, titulairesDeLaTranche, joursValables));
      premier += tranche.quantite.valeur();
    }
  }

  nombreDeBillets(): number {
    return this.lignes.reduce((total, ligne) => total + ligne.nombreDeBillets(), 0);
  }

  total(): Montant {
    return this.lignes.reduce((total, ligne) => total.plus(ligne.sousTotal()), Montant.zero());
  }

  statut(): StatutCommande {
    return this.statutActuel;
  }

  /** Les places réservées par la commande, pour les rendre à leur vague d'origine. */
  tranches(): readonly Tranche[] {
    return this.lignes.map((ligne) => ligne.tranche);
  }

  lignesDeCommande(): readonly LigneCommande[] {
    return [...this.lignes];
  }

  /**
   * R4 : une commande non payée sous 15 minutes doit expirer.
   * Le minuteur est suspendu dès que le paiement est initié (réponse de l'expert, Q2).
   */
  doitExpirerA(maintenant: Date): boolean {
    return this.statutActuel === StatutCommande.EN_COURS && maintenant.getTime() >= this.limiteDePaiement().getTime();
  }

  limiteDePaiement(): Date {
    return new Date(this.ouverteLe.getTime() + Commande.DELAI_DE_PAIEMENT_EN_MINUTES * 60_000);
  }

  /** R4 : la commande expire et rend ses places (les tranches) à leur vague d'origine. */
  expirer(maintenant: Date): readonly Tranche[] {
    if (!this.doitExpirerA(maintenant)) throw new DelaiDePaiementNonEcouleException(this.id);
    this.statutActuel = StatutCommande.EXPIREE;
    return this.tranches();
  }

  initierPaiement(maintenant: Date): Montant {
    this.exigerStatut(StatutCommande.EN_COURS);
    if (this.nombreDeBillets() === 0) throw new CommandeVideException(this.id);
    if (this.doitExpirerA(maintenant)) throw new DelaiDePaiementDepasseException(this.id);
    this.statutActuel = StatutCommande.PAIEMENT_INITIE;
    return this.total();
  }

  confirmerPaiement(maintenant: Date): CommandePayee {
    this.exigerStatut(StatutCommande.PAIEMENT_INITIE);
    this.statutActuel = StatutCommande.PAYEE;
    const places: PlacePayee[] = this.lignes.flatMap((ligne) =>
      ligne.titulaires.map((titulaire) => ({
        formule: ligne.formule,
        titulaire,
        prixPaye: ligne.tranche.prixUnitaire,
        joursValables: ligne.joursValables,
      })),
    );
    return new CommandePayee(this.id, this.acheteur, places, this.total(), new Date(maintenant.getTime()));
  }

  /** Paiement refusé : la commande est annulée et rend ses places. */
  refuserPaiement(): readonly Tranche[] {
    this.exigerStatut(StatutCommande.PAIEMENT_INITIE);
    this.statutActuel = StatutCommande.ANNULEE;
    return this.tranches();
  }

  private exigerStatut(attendu: StatutCommande): void {
    if (this.statutActuel !== attendu) {
      throw new StatutDeCommandeInattenduException(this.id, attendu, this.statutActuel);
    }
  }
}
