import { ErreurMetier } from "../commun/ErreurMetier";
import { VagueId } from "../commun/Identifiants";
import { Montant } from "../commun/Montant";
import { Quantite } from "../commun/Quantite";
import { Formule } from "./Formule";
import { Tranche } from "./Tranche";
import { Vague } from "./Vague";

export class FestivalCompletException extends ErreurMetier {
  constructor() {
    super("Le festival est complet : plus aucune vague n'est ouverte.");
  }
}

export class PlacesInsuffisantesException extends ErreurMetier {
  constructor(demandees: number, disponibles: number) {
    super(
      `Pas assez de places : ${demandees} demandées, ${disponibles} disponibles. Rien n'a été réservé.`,
    );
  }
}

export class VagueInconnueException extends ErreurMetier {
  constructor(vague: VagueId) {
    super(`La vague ${vague.valeur()} n'existe pas dans la grille tarifaire.`);
  }
}

/**
 * Agrégat : la grille tarifaire d'une édition, c'est-à-dire ses vagues dans l'ordre de vente.
 * Elle protège R2 (le prix dépend de la vague active) et R3 (quota épuisé : vague suivante).
 */
export class GrilleTarifaire {
  private vagues: Vague[];

  private constructor(vagues: Vague[]) {
    if (vagues.length === 0) throw new Error("Une grille tarifaire contient au moins une vague.");
    this.vagues = [...vagues];
  }

  /** Les vagues sont données dans l'ordre de vente : Early, puis Regular, puis Last minute. */
  static avecLesVagues(...vagues: Vague[]): GrilleTarifaire {
    return new GrilleTarifaire(vagues);
  }

  /** La vague active est la première vague encore ouverte (ni épuisée, ni terminée). */
  vagueActive(maintenant: Date): Vague {
    const active = this.vagues.find((vague) => vague.estOuverteA(maintenant));
    if (!active) throw new FestivalCompletException();
    return active;
  }

  /** R2 : le prix d'un pass est celui de la vague active. */
  prixActuel(formule: Formule, maintenant: Date): Montant {
    return this.vagueActive(maintenant).prixDe(formule);
  }

  /**
   * R3 : on prend les places dans la vague active ; si son quota est épuisé, on continue
   * dans la vague suivante, à son prix. Tout ou rien : s'il n'y a pas assez de places au
   * total, rien n'est réservé.
   */
  reserver(formule: Formule, quantite: Quantite, maintenant: Date): Tranche[] {
    const ouvertes = this.vagues.filter((vague) => vague.estOuverteA(maintenant));
    const disponibles = ouvertes.reduce((total, vague) => total + vague.placesRestantes(), 0);
    if (quantite.depasse(disponibles)) {
      throw new PlacesInsuffisantesException(quantite.valeur(), disponibles);
    }

    const tranches: Tranche[] = [];
    let resteAReserver = quantite.valeur();
    for (const vague of ouvertes) {
      if (resteAReserver === 0) break;
      const prises = Math.min(resteAReserver, vague.placesRestantes());
      tranches.push(new Tranche(vague.id, Quantite.de(prises), vague.prixDe(formule)));
      resteAReserver -= prises;
    }

    for (const tranche of tranches) {
      this.remplacer(this.vague(tranche.vague).avecPlacesPrises(tranche.quantite));
    }
    return tranches;
  }

  /** R4 : les places libérées retournent dans le quota de leur vague d'origine. */
  liberer(tranches: readonly Tranche[]): void {
    for (const tranche of tranches) {
      this.remplacer(this.vague(tranche.vague).avecPlacesRendues(tranche.quantite));
    }
  }

  placesRestantes(vague: VagueId): number {
    return this.vague(vague).placesRestantes();
  }

  private vague(id: VagueId): Vague {
    const trouvee = this.vagues.find((vague) => vague.id.egale(id));
    if (!trouvee) throw new VagueInconnueException(id);
    return trouvee;
  }

  private remplacer(nouvelle: Vague): void {
    this.vagues = this.vagues.map((vague) => (vague.id.egale(nouvelle.id) ? nouvelle : vague));
  }
}
