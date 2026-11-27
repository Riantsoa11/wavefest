import { BilletDAcces, Bracelet, ErreurControleDAcces, Identite } from "../domaine/BilletDAcces";
import { BilletEmis, TitulaireChange } from "../../integration/LangagePublie";
import { Bus } from "../../integration/Bus";

export class BilletInconnuAuPortiqueException extends ErreurControleDAcces {
  constructor(billet: string) {
    super(`Billet ${billet} refusé : il est inconnu (faux billet ?).`);
  }
}

export class BraceletInconnuException extends ErreurControleDAcces {
  constructor(bracelet: string) {
    super(`Le bracelet ${bracelet} est inconnu.`);
  }
}

/** Port : les billets d'accès et les bracelets. */
export interface Acces {
  sauverBillet(billet: BilletDAcces): Promise<void>;
  billet(billet: string): Promise<BilletDAcces | undefined>;
  sauverBracelet(bracelet: Bracelet): Promise<void>;
  bracelet(bracelet: string): Promise<Bracelet | undefined>;
  nouveauBracelet(): string;
}

export class ControleDAccesUseCases {
  constructor(
    private readonly acces: Acces,
    private readonly bus: Bus,
  ) {}

  /** Billetterie → Contrôle d'accès (OHS + PL) : un billet est émis. */
  async quandUnBilletEstEmis(message: BilletEmis): Promise<void> {
    await this.acces.sauverBillet(new BilletDAcces(message.billet, message.titulaire, message.joursValables));
  }

  /** Billetterie → Contrôle d'accès : le titulaire a changé. */
  async quandLeTitulaireChange(message: TitulaireChange): Promise<void> {
    const billet = await this.chargerBillet(message.billet);
    billet.changerDeTitulaire(message.titulaire);
    await this.acces.sauverBillet(billet);
  }

  /** Contrôle d'accès → Cashless (Partnership) : billet échangé contre bracelet. */
  async echangerContreBracelet(billetPresente: string, jour: number, personnePresente: Identite): Promise<Bracelet> {
    const billet = await this.chargerBillet(billetPresente);
    const bracelet = billet.echangerContreBracelet(jour, personnePresente, this.acces.nouveauBracelet());
    await this.acces.sauverBillet(billet);
    await this.acces.sauverBracelet(bracelet);
    await this.bus.publier({
      type: "BilletEchangeContreBracelet",
      billet: billet.billet,
      bracelet: bracelet.id,
      titulaire: bracelet.titulaire,
    });
    return bracelet;
  }

  async passerLePortique(bracelet: string, jour: number): Promise<void> {
    const trouve = await this.acces.bracelet(bracelet);
    if (!trouve) throw new BraceletInconnuException(bracelet);
    trouve.passerLePortique(jour);
    await this.acces.sauverBracelet(trouve);
  }

  private async chargerBillet(id: string): Promise<BilletDAcces> {
    const billet = await this.acces.billet(id);
    if (!billet) throw new BilletInconnuAuPortiqueException(id);
    return billet;
  }
}
