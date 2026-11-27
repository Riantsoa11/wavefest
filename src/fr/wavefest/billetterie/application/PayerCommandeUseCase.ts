import { Billet } from "../domaine/billet/Billet";
import { CommandeId, BilletId } from "../domaine/commun/Identifiants";
import { CommandeIntrouvableException } from "./ErreursApplication";
import {
  Billets,
  Commandes,
  GenerateurIdentifiants,
  GrillesTarifaires,
  Horloge,
  PortPaiement,
} from "./ports";

export type IssueDuPaiement =
  | { readonly issue: "COMMANDE_PAYEE"; readonly billets: readonly BilletId[] }
  | { readonly issue: "PAIEMENT_REFUSE"; readonly motif: string };

/**
 * Application service : payer une commande.
 * Paiement accepté : la commande est payée et un billet est émis par place.
 * Paiement refusé : la commande est annulée et ses places retournent dans leur vague.
 */
export class PayerCommandeUseCase {
  constructor(
    private readonly commandes: Commandes,
    private readonly billets: Billets,
    private readonly grilles: GrillesTarifaires,
    private readonly paiement: PortPaiement,
    private readonly identifiants: GenerateurIdentifiants,
    private readonly horloge: Horloge,
    private readonly debutDuFestival: Date,
  ) {}

  async executer(id: CommandeId): Promise<IssueDuPaiement> {
    const commande = await this.commandes.parId(id);
    if (!commande) throw new CommandeIntrouvableException(id);

    const montant = commande.initierPaiement(this.horloge.maintenant());
    await this.commandes.sauver(commande);

    const resultat = await this.paiement.payer(commande.id, montant);

    if (resultat.issue === "PAIEMENT_REFUSE") {
      const placesRendues = commande.refuserPaiement();
      const grille = await this.grilles.grilleActuelle();
      grille.liberer(placesRendues);
      await this.grilles.sauver(grille);
      await this.commandes.sauver(commande);
      return { issue: "PAIEMENT_REFUSE", motif: resultat.motif };
    }

    const commandePayee = commande.confirmerPaiement(this.horloge.maintenant());
    const billets = commandePayee.places.map((place) =>
      Billet.emettre({
        id: this.identifiants.nouveauBillet(),
        commande: commande.id,
        formule: place.formule,
        titulaire: place.titulaire,
        prixAchat: place.prixPaye,
        debutDuFestival: this.debutDuFestival,
      }),
    );
    for (const billet of billets) await this.billets.sauver(billet);
    await this.commandes.sauver(commande);
    return { issue: "COMMANDE_PAYEE", billets: billets.map((billet) => billet.id) };
  }
}
