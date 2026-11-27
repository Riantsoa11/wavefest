import { Commande } from "../domaine/commande/Commande";
import { Email } from "../domaine/commun/Email";
import { CommandeId } from "../domaine/commun/Identifiants";
import { Quantite } from "../domaine/commun/Quantite";
import { Titulaire } from "../domaine/commun/Titulaire";
import { Formule } from "../domaine/offre/Formule";
import { Commandes, GenerateurIdentifiants, GrillesTarifaires, Horloge } from "./ports";

export interface DemandeAchatPass {
  readonly acheteur: string;
  readonly formule: Formule;
  /** Pour un pass 1 jour : le jour choisi (1, 2 ou 3). */
  readonly jour?: number;
  readonly titulaires: readonly { prenom: string; nom: string; email: string }[];
}

/**
 * Application service : l'acheteur achète des pass. Il orchestre, il ne décide rien :
 * les règles R1 (6 billets), R2 (prix de la vague) et R3 (vague suivante) sont dans le domaine.
 */
export class AcheterPassUseCase {
  constructor(
    private readonly grilles: GrillesTarifaires,
    private readonly commandes: Commandes,
    private readonly identifiants: GenerateurIdentifiants,
    private readonly horloge: Horloge,
  ) {}

  async executer(demande: DemandeAchatPass): Promise<CommandeId> {
    const maintenant = this.horloge.maintenant();
    const titulaires = demande.titulaires.map((t) => Titulaire.nomme(t.prenom, t.nom, t.email));
    const commande = Commande.ouvrir(this.identifiants.nouvelleCommande(), Email.de(demande.acheteur), maintenant);

    const grille = await this.grilles.grilleActuelle();
    const tranches = grille.reserver(demande.formule, Quantite.de(titulaires.length), maintenant);
    try {
      commande.ajouterBillets(demande.formule, tranches, titulaires, demande.jour);
    } catch (erreur) {
      // Annulation technique de la réservation : aucune règle métier ici.
      grille.liberer(tranches);
      throw erreur;
    }

    await this.grilles.sauver(grille);
    await this.commandes.sauver(commande);
    return commande.id;
  }
}
