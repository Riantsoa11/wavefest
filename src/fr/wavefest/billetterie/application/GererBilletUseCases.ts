import { Billet } from "../domaine/billet/Billet";
import { OffreDeRevente } from "../domaine/billet/OffreDeRevente";
import { BilletId } from "../domaine/commun/Identifiants";
import { Montant } from "../domaine/commun/Montant";
import { Titulaire } from "../domaine/commun/Titulaire";
import { Formule } from "../domaine/offre/Formule";
import { BilletIntrouvableException } from "./ErreursApplication";
import { Billets, Horloge, PublicationBilletterie } from "./ports";

type Personne = { prenom: string; nom: string; email: string };

async function charger(billets: Billets, id: BilletId): Promise<Billet> {
  const billet = await billets.parId(id);
  if (!billet) throw new BilletIntrouvableException(id);
  return billet;
}

/** R5 : changer le nom du titulaire d'un billet (gratuit jusqu'à J-7). */
export class ChangerTitulaireUseCase {
  constructor(
    private readonly billets: Billets,
    private readonly horloge: Horloge,
    private readonly publication: PublicationBilletterie,
  ) {}

  async executer(id: BilletId, nouveau: Personne): Promise<void> {
    const billet = await charger(this.billets, id);
    billet.changerTitulaire(Titulaire.nomme(nouveau.prenom, nouveau.nom, nouveau.email), this.horloge.maintenant());
    await this.billets.sauver(billet);
    await this.publication.titulaireChange(billet);
  }
}

/** R6 : mettre un billet en revente au prix d'achat au plus. */
export class MettreEnReventeUseCase {
  constructor(private readonly billets: Billets) {}

  async executer(id: BilletId, prix: Montant): Promise<OffreDeRevente> {
    const billet = await charger(this.billets, id);
    const offre = billet.mettreEnRevente(prix);
    await this.billets.sauver(billet);
    return offre;
  }
}

export class RetirerDeLaReventeUseCase {
  constructor(private readonly billets: Billets) {}

  async executer(id: BilletId): Promise<void> {
    const billet = await charger(this.billets, id);
    billet.retirerDeLaRevente();
    await this.billets.sauver(billet);
  }
}

/** Le billet revendu est réémis au nom du racheteur (demande du contexte Revente). */
export class CederBilletUseCase {
  constructor(
    private readonly billets: Billets,
    private readonly publication: PublicationBilletterie,
  ) {}

  async executer(id: BilletId, racheteur: Personne): Promise<OffreDeRevente> {
    const billet = await charger(this.billets, id);
    const offre = billet.revendreA(Titulaire.nomme(racheteur.prenom, racheteur.nom, racheteur.email));
    await this.billets.sauver(billet);
    await this.publication.titulaireChange(billet);
    return offre;
  }
}

/** Demande du contexte Remboursements : le billet a été remboursé (il reste valable). */
export class MarquerBilletRembourseUseCase {
  constructor(private readonly billets: Billets) {}

  async executer(id: BilletId): Promise<void> {
    const billet = await charger(this.billets, id);
    billet.marquerRembourse();
    await this.billets.sauver(billet);
  }
}

/** Requête : les pass 1 jour valables un jour donné (pour les Remboursements). */
export class ListerPass1JourDuJourUseCase {
  constructor(private readonly billets: Billets) {}

  async executer(jour: number): Promise<Billet[]> {
    return (await this.billets.tous()).filter(
      (billet) => billet.formule === Formule.PASS_1_JOUR && billet.estValableLe(jour),
    );
  }
}
