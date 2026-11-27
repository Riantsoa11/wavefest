import { CommandeId } from "../../domaine/commun/Identifiants";
import { Montant } from "../../domaine/commun/Montant";

/** Résultat d'un paiement, dans NOTRE langage. Le vocabulaire du PSP reste dans l'ACL. */
export type ResultatPaiement =
  | { readonly issue: "PAIEMENT_ACCEPTE" }
  | { readonly issue: "PAIEMENT_REFUSE"; readonly motif: string };

/** Port : encaisser le paiement d'une commande. Implémenté par l'ACL PspPaiementAdapter. */
export interface PortPaiement {
  payer(commande: CommandeId, montant: Montant): Promise<ResultatPaiement>;
}
