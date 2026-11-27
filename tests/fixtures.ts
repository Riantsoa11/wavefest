import { Billet } from "../src/fr/wavefest/billetterie/domaine/billet/Billet";
import { Commande } from "../src/fr/wavefest/billetterie/domaine/commande/Commande";
import { BilletId, CommandeId, VagueId } from "../src/fr/wavefest/billetterie/domaine/commun/Identifiants";
import { Montant } from "../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { Quantite } from "../src/fr/wavefest/billetterie/domaine/commun/Quantite";
import { Titulaire } from "../src/fr/wavefest/billetterie/domaine/commun/Titulaire";
import { Email } from "../src/fr/wavefest/billetterie/domaine/commun/Email";
import { Formule } from "../src/fr/wavefest/billetterie/domaine/offre/Formule";
import { GrilleTarifaire } from "../src/fr/wavefest/billetterie/domaine/offre/GrilleTarifaire";
import { Tranche } from "../src/fr/wavefest/billetterie/domaine/offre/Tranche";
import { Vague } from "../src/fr/wavefest/billetterie/domaine/offre/Vague";

export const MAINTENANT = new Date("2027-03-01T10:00:00Z");
export const DEBUT_DU_FESTIVAL = new Date("2027-07-09T00:00:00Z");

export const minutesApres = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60_000);
export const joursAvant = (date: Date, jours: number): Date => new Date(date.getTime() - jours * 24 * 60 * 60_000);

export const EARLY = VagueId.de("EARLY");
export const REGULAR = VagueId.de("REGULAR");
export const LAST_MINUTE = VagueId.de("LAST_MINUTE");

/** Grille de WaveFest : Early (quota 3), Regular (quota 5), Last minute (quota 10). */
export function grilleWaveFest(quotas = { early: 3, regular: 5, lastMinute: 10 }): GrilleTarifaire {
  return GrilleTarifaire.avecLesVagues(
    Vague.ouverte({
      id: "EARLY",
      nom: "Early",
      quota: quotas.early,
      prix: { PASS_1_JOUR: Montant.euros(59), PASS_3_JOURS: Montant.euros(149), VIP: Montant.euros(299) },
    }),
    Vague.ouverte({
      id: "REGULAR",
      nom: "Regular",
      quota: quotas.regular,
      prix: { PASS_1_JOUR: Montant.euros(69), PASS_3_JOURS: Montant.euros(169), VIP: Montant.euros(349) },
    }),
    Vague.ouverte({
      id: "LAST_MINUTE",
      nom: "Last minute",
      quota: quotas.lastMinute,
      prix: { PASS_1_JOUR: Montant.euros(79), PASS_3_JOURS: Montant.euros(189), VIP: Montant.euros(399) },
    }),
  );
}

export function titulaires(nombre: number): Titulaire[] {
  return Array.from({ length: nombre }, (_, i) => Titulaire.nomme(`Prénom${i + 1}`, `Nom${i + 1}`, `titulaire${i + 1}@wavefest.fr`));
}

export const tranche = (quantite: number, prixEnEuros: number, vague: VagueId = EARLY): Tranche =>
  new Tranche(vague, Quantite.de(quantite), Montant.euros(prixEnEuros));

export const uneCommandeOuverteA = (maintenant: Date, id = "CMD-1"): Commande =>
  Commande.ouvrir(CommandeId.de(id), Email.de("acheteur@wavefest.fr"), maintenant);

/** Une commande de `nombre` pass 3 jours en Early, prête à être payée. */
export function uneCommandeDe(nombre: number, maintenant = MAINTENANT): Commande {
  const commande = uneCommandeOuverteA(maintenant);
  commande.ajouterBillets(Formule.PASS_3_JOURS, [tranche(nombre, 149)], titulaires(nombre));
  return commande;
}

export function unBilletAchete(prixEnEuros = 149): Billet {
  return Billet.emettre({
    id: BilletId.de("BIL-1"),
    commande: CommandeId.de("CMD-1"),
    formule: Formule.PASS_3_JOURS,
    titulaire: Titulaire.nomme("Alice", "Martin", "alice@wavefest.fr"),
    prixAchat: Montant.euros(prixEnEuros),
    debutDuFestival: DEBUT_DU_FESTIVAL,
  });
}

export const bob = (): Titulaire => Titulaire.nomme("Bob", "Durand", "bob@wavefest.fr");
