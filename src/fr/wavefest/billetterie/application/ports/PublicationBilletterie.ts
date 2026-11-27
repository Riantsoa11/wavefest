import { Billet } from "../../domaine/billet/Billet";

/**
 * Port : ce que la Billetterie annonce aux autres contextes (Open Host Service +
 * Published Language). L'adapter traduit nos agrégats en messages publiés.
 */
export interface PublicationBilletterie {
  billetsEmis(billets: readonly Billet[]): Promise<void>;
  titulaireChange(billet: Billet): Promise<void>;
}
