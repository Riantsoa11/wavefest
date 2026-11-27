import { CommandePayee } from "../../domaine/commande/CommandePayee";

/** Port : prévenir l'acheteur que sa commande est payée (via le prestataire e-mail). */
export interface ConfirmationsDAchat {
  confirmer(commande: CommandePayee): Promise<void>;
}
