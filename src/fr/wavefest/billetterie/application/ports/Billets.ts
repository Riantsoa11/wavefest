import { Billet } from "../../domaine/billet/Billet";
import { BilletId, CommandeId } from "../../domaine/commun/Identifiants";

/** Port : le dépôt des billets. */
export interface Billets {
  sauver(billet: Billet): Promise<void>;
  parId(id: BilletId): Promise<Billet | undefined>;
  deLaCommande(commande: CommandeId): Promise<Billet[]>;
  tous(): Promise<Billet[]>;
}
