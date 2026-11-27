import { PublicationBilletterie } from "../../application/ports";
import { Billet } from "../../domaine/billet/Billet";
import { Bus } from "../../../integration/Bus";
import { titulairePublie } from "./TraductionVersLangagePublie";

/** Adapter : publie les événements de la Billetterie sur le bus, dans le langage publié. */
export class PublicationSurLeBus implements PublicationBilletterie {
  constructor(private readonly bus: Bus) {}

  async billetsEmis(billets: readonly Billet[]): Promise<void> {
    for (const billet of billets) {
      await this.bus.publier({
        type: "BilletEmis",
        billet: billet.id.valeur(),
        formule: billet.formule,
        joursValables: [...billet.joursValables],
        titulaire: titulairePublie(billet.titulaire()),
        prixAchatEnCentimes: billet.prixAchat.centimes(),
      });
    }
  }

  async titulaireChange(billet: Billet): Promise<void> {
    await this.bus.publier({
      type: "TitulaireChange",
      billet: billet.id.valeur(),
      titulaire: titulairePublie(billet.titulaire()),
    });
  }
}

/** Adapter neutre, quand aucun autre contexte n'écoute (tests unitaires de la Billetterie). */
export class PublicationIgnoree implements PublicationBilletterie {
  async billetsEmis(): Promise<void> {}
  async titulaireChange(): Promise<void> {}
}
