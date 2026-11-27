import { Billets, Commandes, GrillesTarifaires } from "../../application/ports";
import { Billet } from "../../domaine/billet/Billet";
import { Commande, StatutCommande } from "../../domaine/commande/Commande";
import { BilletId, CommandeId } from "../../domaine/commun/Identifiants";
import { GrilleTarifaire } from "../../domaine/offre/GrilleTarifaire";

/** Adapter de persistance en mémoire (pour les tests et la démo). */
export class CommandesEnMemoire implements Commandes {
  private readonly parIdentifiant = new Map<string, Commande>();

  async sauver(commande: Commande): Promise<void> {
    this.parIdentifiant.set(commande.id.valeur(), commande);
  }

  async parId(id: CommandeId): Promise<Commande | undefined> {
    return this.parIdentifiant.get(id.valeur());
  }

  async enAttenteDePaiement(): Promise<Commande[]> {
    return [...this.parIdentifiant.values()].filter((c) => c.statut() === StatutCommande.EN_COURS);
  }
}

export class BilletsEnMemoire implements Billets {
  private readonly parIdentifiant = new Map<string, Billet>();

  async sauver(billet: Billet): Promise<void> {
    this.parIdentifiant.set(billet.id.valeur(), billet);
  }

  async parId(id: BilletId): Promise<Billet | undefined> {
    return this.parIdentifiant.get(id.valeur());
  }

  async deLaCommande(commande: CommandeId): Promise<Billet[]> {
    return [...this.parIdentifiant.values()].filter((b) => b.commande.egale(commande));
  }

  async tous(): Promise<Billet[]> {
    return [...this.parIdentifiant.values()];
  }
}

export class GrillesTarifairesEnMemoire implements GrillesTarifaires {
  constructor(private grille: GrilleTarifaire) {}

  async grilleActuelle(): Promise<GrilleTarifaire> {
    return this.grille;
  }

  async sauver(grille: GrilleTarifaire): Promise<void> {
    this.grille = grille;
  }
}
