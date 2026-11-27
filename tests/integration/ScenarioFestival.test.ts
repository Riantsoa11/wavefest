import { beforeEach, describe, expect, it } from "vitest";
import { Montant } from "../../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { BilletId } from "../../src/fr/wavefest/billetterie/domaine/commun/Identifiants";
import { Formule } from "../../src/fr/wavefest/billetterie/domaine/offre/Formule";
import { GrilleTarifaire } from "../../src/fr/wavefest/billetterie/domaine/offre/GrilleTarifaire";
import { Vague } from "../../src/fr/wavefest/billetterie/domaine/offre/Vague";
import { IdentiteNonConformeException } from "../../src/fr/wavefest/controle-acces/domaine/BilletDAcces";
import { assemblerLeFestival, Festival } from "../../src/fr/wavefest/Festival";
import { StatutAnnonce } from "../../src/fr/wavefest/revente/domaine/AnnonceDeRevente";

const MAINTENANT = new Date("2027-03-01T10:00:00Z");
const DEBUT = new Date("2027-07-09T00:00:00Z");
const FIN = new Date("2027-07-12T00:00:00Z");

const alice = { prenom: "Alice", nom: "Martin", email: "alice@wavefest.fr" };
const claire = { prenom: "Claire", nom: "Petit", email: "claire@wavefest.fr" };
const bob = { prenom: "Bob", nom: "Durand", email: "bob@wavefest.fr" };
const david = { prenom: "David", nom: "Roux", email: "david@wavefest.fr" };

const grille = () =>
  GrilleTarifaire.avecLesVagues(
    Vague.ouverte({
      id: "EARLY",
      nom: "Early",
      quota: 100,
      prix: { PASS_1_JOUR: Montant.euros(59), PASS_3_JOURS: Montant.euros(149), VIP: Montant.euros(299) },
    }),
  );

async function acheterEtPayer(festival: Festival, acheteur: string, formule: Formule, titulaires: typeof alice[], jour?: number) {
  const commande = await festival.billetterie.acheterPass.executer({
    acheteur,
    formule,
    titulaires,
    ...(jour === undefined ? {} : { jour }),
  });
  const issue = await festival.billetterie.payerCommande.executer(commande);
  if (issue.issue !== "COMMANDE_PAYEE") throw new Error("paiement attendu");
  return issue.billets.map((b) => b.valeur());
}

describe("Scénario WaveFest : les 6 bounded contexts ensemble", () => {
  let festival: Festival;

  beforeEach(async () => {
    festival = assemblerLeFestival({ grille: grille(), maintenant: MAINTENANT, debutDuFestival: DEBUT, finDuFestival: FIN });
    festival.programmation.programmer("C1", "Air", 1, false);
    festival.programmation.programmer("C2", "Daft Punk", 2, true);
    await festival.programmation.publierLeLineUp();
  });

  const messages = (type: string) => festival.bus.messagesPublies().filter((m) => m.type === type);
  const billet = async (id: string) => (await festival.billetterie.billets.parId(BilletId.de(id)))!;

  it("Billetterie → Contrôle d'accès : un billet payé peut être échangé contre un bracelet, qui ouvre un solde Cashless", async () => {
    const [billetDeBob] = await acheterEtPayer(festival, "bob@wavefest.fr", Formule.PASS_3_JOURS, [bob]);

    expect(messages("BilletEmis")).toHaveLength(1);
    expect(festival.email.messagesEnvoyes()[0]?.to).toBe("bob@wavefest.fr"); // confirmation (Conformist)

    const bracelet = await festival.controleDAcces.echangerContreBracelet(billetDeBob!, 1, bob);
    await festival.controleDAcces.passerLePortique(bracelet.id, 3);
    expect(messages("BilletEchangeContreBracelet")).toHaveLength(1);

    // Partnership Contrôle d'accès ↔ Cashless : le solde existe, on recharge et on consomme
    expect(await festival.cashless.recharger(bracelet.id, 2000)).toBe(2000);
    expect(await festival.cashless.payerUneConsommation(bracelet.id, 650)).toBe(1350);

    // Après le festival : remboursement du solde moins 1,50 € (via l'ACL du PSP)
    festival.horloge.avancerDe(((FIN.getTime() - MAINTENANT.getTime()) / 60_000) + 60 * 24);
    expect(await festival.cashless.rembourserLeSolde(bracelet.id)).toBe(1200);
  });

  it("Revente : le racheteur devient titulaire dans la Billetterie et au Contrôle d'accès", async () => {
    const [, billetDeClaire] = await acheterEtPayer(festival, "alice@wavefest.fr", Formule.PASS_1_JOUR, [alice, claire], 2);

    await festival.revente.mettreEnRevente(billetDeClaire!, claire, 5000);
    await festival.revente.racheter(billetDeClaire!, david);

    expect((await billet(billetDeClaire!)).titulaire().prenom).toBe("David");
    expect(messages("TitulaireChange")).toHaveLength(1);
    expect(messages("BilletRevendu")).toEqual([
      { type: "BilletRevendu", billet: billetDeClaire, racheteur: david, prixDeReventeEnCentimes: 5000 },
    ]);
    // L'ancienne titulaire n'entre plus, le racheteur oui
    await expect(festival.controleDAcces.echangerContreBracelet(billetDeClaire!, 2, claire)).rejects.toThrow(
      IdentiteNonConformeException,
    );
    expect((await festival.controleDAcces.echangerContreBracelet(billetDeClaire!, 2, david)).titulaire.prenom).toBe("David");
  });

  it("R6 reste vérifiée par la Billetterie quand la Revente publie une annonce", async () => {
    const [billetDAlice] = await acheterEtPayer(festival, "alice@wavefest.fr", Formule.PASS_1_JOUR, [alice], 2);
    await expect(festival.revente.mettreEnRevente(billetDAlice!, alice, 6000)).rejects.toThrow("Prix de revente refusé");
  });

  it("Annulation d'un concert qui n'est pas la tête d'affiche : pas de campagne, les titulaires sont informés", async () => {
    await acheterEtPayer(festival, "alice@wavefest.fr", Formule.PASS_1_JOUR, [alice], 1);
    await festival.programmation.annulerLeConcert("C1");
    expect(messages("CampagneDeRemboursementOuverte")).toHaveLength(0);
    expect(festival.email.messagesEnvoyes().at(-1)?.subject).toContain("Air annulé");
  });

  it("Annulation de la tête d'affiche : Programmation → Remboursements → Revente, PSP et Billetterie", async () => {
    const [billetDAlice, billetDeClaire] = await acheterEtPayer(
      festival,
      "alice@wavefest.fr",
      Formule.PASS_1_JOUR,
      [alice, claire],
      2,
    );
    await acheterEtPayer(festival, "bob@wavefest.fr", Formule.PASS_3_JOURS, [bob]); // pas concerné (question ouverte)

    // Claire revend à David pour 50 € ; Alice a une annonce encore ouverte
    await festival.revente.mettreEnRevente(billetDeClaire!, claire, 5000);
    await festival.revente.racheter(billetDeClaire!, david);
    const annonceDAlice = await festival.revente.mettreEnRevente(billetDAlice!, alice, 5900);

    await festival.programmation.annulerLeConcert("C2");

    // Les annonces du jour sont retirées
    expect(annonceDAlice.statut()).toBe(StatutAnnonce.RETIREE);
    // 50 % du prix payé par le titulaire actuel : 29,50 € pour Alice, 25 € pour David (prix de rachat)
    expect(festival.psp.totalRembourseEnCentimes()).toBe(2950 + 2500);
    expect((await billet(billetDAlice!)).estRembourse()).toBe(true);
    expect((await billet(billetDeClaire!)).estRembourse()).toBe(true);
    expect((await billet(billetDAlice!)).estValableLe(2)).toBe(true);
    const destinataires = festival.email.messagesEnvoyes().filter((m) => m.subject.includes("remboursement")).map((m) => m.to);
    expect(destinataires).toEqual(["alice@wavefest.fr", "david@wavefest.fr"]);
  });

  it("PSP en échec : relance, puis traitement manuel après 3 échecs", async () => {
    const [billetDAlice] = await acheterEtPayer(festival, "alice@wavefest.fr", Formule.PASS_1_JOUR, [alice], 2);
    festival.psp.fairEchouerLesRemboursements(billetDAlice!, 3);

    await festival.programmation.annulerLeConcert("C2"); // 1er échec
    await festival.remboursements.relancerLesRemboursements(); // 2e échec
    await festival.remboursements.relancerLesRemboursements(); // 3e échec : à traiter
    await festival.remboursements.relancerLesRemboursements(); // plus rien à relancer

    expect(festival.psp.totalRembourseEnCentimes()).toBe(0);
    expect((await billet(billetDAlice!)).estRembourse()).toBe(false);
  });
});
