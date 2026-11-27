import {
  CederBilletUseCase,
  ListerPass1JourDuJourUseCase,
  MarquerBilletRembourseUseCase,
  MettreEnReventeUseCase,
  RetirerDeLaReventeUseCase,
} from "../../application/GererBilletUseCases";
import { Billets, PublicationBilletterie } from "../../application/ports";
import { BilletId } from "../../domaine/commun/Identifiants";
import { Montant } from "../../domaine/commun/Montant";
import { ApiBilletterie, BilletPublie, OffreDeReventePubliee } from "../../../integration/ApiBilletterie";
import { TitulairePublie } from "../../../integration/LangagePublie";
import { billetPublie, offrePubliee } from "./TraductionVersLangagePublie";

/**
 * Open Host Service : la porte d'entrée publique de la Billetterie pour les autres
 * contextes. Il traduit le langage publié vers nos cas d'usage, et inversement.
 */
export class ServiceOuvertBilletterie implements ApiBilletterie {
  constructor(
    private readonly billets: Billets,
    private readonly publication: PublicationBilletterie,
  ) {}

  async billet(id: string): Promise<BilletPublie | undefined> {
    const billet = await this.billets.parId(BilletId.de(id));
    return billet ? billetPublie(billet) : undefined;
  }

  async pass1JourDuJour(jour: number): Promise<BilletPublie[]> {
    return (await new ListerPass1JourDuJourUseCase(this.billets).executer(jour)).map(billetPublie);
  }

  async mettreEnRevente(billet: string, prixDeReventeEnCentimes: number): Promise<OffreDeReventePubliee> {
    const offre = await new MettreEnReventeUseCase(this.billets).executer(
      BilletId.de(billet),
      Montant.centimes(prixDeReventeEnCentimes),
    );
    return offrePubliee(offre);
  }

  async retirerDeLaRevente(billet: string): Promise<void> {
    await new RetirerDeLaReventeUseCase(this.billets).executer(BilletId.de(billet));
  }

  async ceder(billet: string, racheteur: TitulairePublie): Promise<OffreDeReventePubliee> {
    const offre = await new CederBilletUseCase(this.billets, this.publication).executer(BilletId.de(billet), racheteur);
    return offrePubliee(offre);
  }

  async marquerRembourse(billet: string): Promise<void> {
    await new MarquerBilletRembourseUseCase(this.billets).executer(BilletId.de(billet));
  }
}
