import { ErreurMetier } from "../commun/ErreurMetier";
import { VagueId } from "../commun/Identifiants";
import { Montant } from "../commun/Montant";
import { Quantite } from "../commun/Quantite";
import { Formule, libelleDe } from "./Formule";

export class FormuleNonProposeeException extends ErreurMetier {
  constructor(vague: string, formule: Formule) {
    super(`${libelleDe(formule)} n'est pas proposé dans la vague ${vague}.`);
  }
}

export class QuotaDepasseException extends ErreurMetier {
  constructor(vague: string) {
    super(`La vague ${vague} n'a plus assez de places.`);
  }
}

/**
 * Entité de l'agrégat GrilleTarifaire : une période de vente à prix fixe.
 * Immuable : prendre ou rendre des places donne une nouvelle Vague, que seule la
 * GrilleTarifaire conserve. Aucun code extérieur ne peut modifier le quota.
 */
export class Vague {
  private constructor(
    readonly id: VagueId,
    readonly nom: string,
    private readonly prix: ReadonlyMap<Formule, Montant>,
    readonly quota: Quantite,
    private readonly vendues: number,
    readonly fin: Date | undefined,
  ) {}

  static ouverte(params: {
    id: string;
    nom: string;
    prix: Partial<Record<Formule, Montant>>;
    quota: number;
    fin?: Date;
  }): Vague {
    const prix = new Map<Formule, Montant>();
    for (const [formule, montant] of Object.entries(params.prix)) {
      if (montant) prix.set(formule as Formule, montant);
    }
    return new Vague(VagueId.de(params.id), params.nom, prix, Quantite.de(params.quota), 0, params.fin);
  }

  /** R2 : le prix d'une formule dans cette vague. */
  prixDe(formule: Formule): Montant {
    const montant = this.prix.get(formule);
    if (!montant) throw new FormuleNonProposeeException(this.nom, formule);
    return montant;
  }

  placesRestantes(): number {
    return this.quota.valeur() - this.vendues;
  }

  estEpuisee(): boolean {
    return this.placesRestantes() === 0;
  }

  /** Une vague est terminée quand sa date de fin est atteinte (même si elle a encore des places). */
  estTermineeA(maintenant: Date): boolean {
    return this.fin !== undefined && maintenant.getTime() >= this.fin.getTime();
  }

  estOuverteA(maintenant: Date): boolean {
    return !this.estEpuisee() && !this.estTermineeA(maintenant);
  }

  avecPlacesPrises(quantite: Quantite): Vague {
    if (quantite.depasse(this.placesRestantes())) throw new QuotaDepasseException(this.nom);
    return new Vague(this.id, this.nom, this.prix, this.quota, this.vendues + quantite.valeur(), this.fin);
  }

  avecPlacesRendues(quantite: Quantite): Vague {
    const vendues = Math.max(0, this.vendues - quantite.valeur());
    return new Vague(this.id, this.nom, this.prix, this.quota, vendues, this.fin);
  }
}
