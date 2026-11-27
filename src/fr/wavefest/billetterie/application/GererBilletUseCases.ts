import { OffreDeRevente } from "../domaine/billet/OffreDeRevente";
import { BilletId } from "../domaine/commun/Identifiants";
import { Montant } from "../domaine/commun/Montant";
import { Titulaire } from "../domaine/commun/Titulaire";
import { BilletIntrouvableException } from "./ErreursApplication";
import { Billets, Horloge } from "./ports";

/** R5 : changer le nom du titulaire d'un billet (gratuit jusqu'à J-7). */
export class ChangerTitulaireUseCase {
  constructor(
    private readonly billets: Billets,
    private readonly horloge: Horloge,
  ) {}

  async executer(id: BilletId, nouveau: { prenom: string; nom: string; email: string }): Promise<void> {
    const billet = await this.billets.parId(id);
    if (!billet) throw new BilletIntrouvableException(id);
    billet.changerTitulaire(Titulaire.nomme(nouveau.prenom, nouveau.nom, nouveau.email), this.horloge.maintenant());
    await this.billets.sauver(billet);
  }
}

/** R6 : mettre un billet en revente au prix d'achat au plus. */
export class MettreEnReventeUseCase {
  constructor(private readonly billets: Billets) {}

  async executer(id: BilletId, prixEnEuros: number): Promise<OffreDeRevente> {
    const billet = await this.billets.parId(id);
    if (!billet) throw new BilletIntrouvableException(id);
    const offre = billet.mettreEnRevente(Montant.euros(prixEnEuros));
    await this.billets.sauver(billet);
    return offre;
  }
}
