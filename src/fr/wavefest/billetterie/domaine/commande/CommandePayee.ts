import { Email } from "../commun/Email";
import { CommandeId } from "../commun/Identifiants";
import { Montant } from "../commun/Montant";
import { Titulaire } from "../commun/Titulaire";
import { Formule } from "../offre/Formule";

/** Ce qu'il faut savoir pour émettre un billet : un par place payée. */
export interface PlacePayee {
  readonly formule: Formule;
  readonly titulaire: Titulaire;
  readonly prixPaye: Montant;
  readonly joursValables: readonly number[];
}

/** Événement métier : la commande est payée, les billets peuvent être émis. */
export class CommandePayee {
  constructor(
    readonly commande: CommandeId,
    readonly acheteur: Email,
    readonly places: readonly PlacePayee[],
    readonly total: Montant,
    readonly payeeLe: Date,
  ) {}
}
