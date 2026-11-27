import { Centimes, ErreurCashless, SoldeCashless } from "../domaine/SoldeCashless";
import { BilletEchangeContreBracelet } from "../../integration/LangagePublie";

export class SoldeInconnuException extends ErreurCashless {
  constructor(bracelet: string) {
    super(`Aucun solde cashless pour le bracelet ${bracelet}.`);
  }
}

export class OperationBancaireRefuseeException extends ErreurCashless {
  constructor(motif: string) {
    super(`Opération refusée par le prestataire de paiement : ${motif}.`);
  }
}

/** Port : les soldes cashless. */
export interface Soldes {
  sauver(solde: SoldeCashless): Promise<void>;
  duBracelet(bracelet: string): Promise<SoldeCashless | undefined>;
}

/** Port : encaisser une recharge et verser un remboursement (implémenté par l'ACL du PSP). */
export interface BanqueCashless {
  encaisserUneRecharge(bracelet: string, montant: Centimes): Promise<{ accepte: boolean; motif?: string }>;
  verserUnRemboursement(bracelet: string, montant: Centimes): Promise<{ verse: boolean; motif?: string }>;
}

export interface Horloge {
  maintenant(): Date;
}

export class CashlessUseCases {
  constructor(
    private readonly soldes: Soldes,
    private readonly banque: BanqueCashless,
    private readonly horloge: Horloge,
    private readonly finDuFestival: Date,
  ) {}

  /** Contrôle d'accès → Cashless (Partnership) : un bracelet est remis, on ouvre son solde. */
  async quandUnBilletEstEchange(message: BilletEchangeContreBracelet): Promise<void> {
    await this.soldes.sauver(SoldeCashless.ouvrir(message.bracelet, message.titulaire.email));
  }

  async recharger(bracelet: string, centimes: number): Promise<number> {
    const solde = await this.charger(bracelet);
    const montant = Centimes.positif(centimes);
    const resultat = await this.banque.encaisserUneRecharge(bracelet, montant);
    if (!resultat.accepte) throw new OperationBancaireRefuseeException(resultat.motif ?? "refus");
    solde.recharger(montant);
    await this.soldes.sauver(solde);
    return solde.montant().valeur;
  }

  async payerUneConsommation(bracelet: string, centimes: number): Promise<number> {
    const solde = await this.charger(bracelet);
    solde.payerUneConsommation(Centimes.positif(centimes));
    await this.soldes.sauver(solde);
    return solde.montant().valeur;
  }

  async rembourserLeSolde(bracelet: string): Promise<number> {
    const solde = await this.charger(bracelet);
    const aVerser = solde.montantARembourser(this.horloge.maintenant(), this.finDuFestival);
    const resultat = await this.banque.verserUnRemboursement(bracelet, aVerser);
    if (!resultat.verse) throw new OperationBancaireRefuseeException(resultat.motif ?? "échec");
    solde.confirmerLeRemboursement();
    await this.soldes.sauver(solde);
    return aVerser.valeur;
  }

  private async charger(bracelet: string): Promise<SoldeCashless> {
    const solde = await this.soldes.duBracelet(bracelet);
    if (!solde) throw new SoldeInconnuException(bracelet);
    return solde;
  }
}
