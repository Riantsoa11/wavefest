import { BilletId, CommandeId } from "../../domaine/commun/Identifiants";

/** Port : fabriquer de nouveaux identifiants. */
export interface GenerateurIdentifiants {
  nouvelleCommande(): CommandeId;
  nouveauBillet(): BilletId;
}
