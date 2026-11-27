import { Commande } from "../../domaine/commande/Commande";
import { CommandeId } from "../../domaine/commun/Identifiants";

/** Port : le dépôt des commandes. */
export interface Commandes {
  sauver(commande: Commande): Promise<void>;
  parId(id: CommandeId): Promise<Commande | undefined>;
  enAttenteDePaiement(): Promise<Commande[]>;
}
