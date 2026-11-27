import { beforeEach, describe, expect, it } from "vitest";
import { AcheterPassUseCase } from "../../../src/fr/wavefest/billetterie/application/AcheterPassUseCase";
import { ExpirerCommandesUseCase } from "../../../src/fr/wavefest/billetterie/application/ExpirerCommandesUseCase";
import { ChangerTitulaireUseCase, MettreEnReventeUseCase } from "../../../src/fr/wavefest/billetterie/application/GererBilletUseCases";
import { PayerCommandeUseCase } from "../../../src/fr/wavefest/billetterie/application/PayerCommandeUseCase";
import { StatutCommande, LimiteDeBilletsDepasseeException } from "../../../src/fr/wavefest/billetterie/domaine/commande/Commande";
import { ChangementDeNomTropTardException } from "../../../src/fr/wavefest/billetterie/domaine/billet/Billet";
import { CommandeId } from "../../../src/fr/wavefest/billetterie/domaine/commun/Identifiants";
import { Formule } from "../../../src/fr/wavefest/billetterie/domaine/offre/Formule";
import { HorlogeFixe } from "../../../src/fr/wavefest/billetterie/infrastructure/horloge/Horloges";
import {
  BilletsEnMemoire,
  CommandesEnMemoire,
  GrillesTarifairesEnMemoire,
} from "../../../src/fr/wavefest/billetterie/infrastructure/persistance/EnMemoire";
import { IdentifiantsSequentiels } from "../../../src/fr/wavefest/billetterie/infrastructure/persistance/IdentifiantsSequentiels";
import { ApiPspSimulee } from "../../../src/fr/wavefest/externe/psp/ApiPspSimulee";
import { PspPaiementAdapter } from "../../../src/fr/wavefest/billetterie/infrastructure/psp/PspPaiementAdapter";
import { PublicationIgnoree } from "../../../src/fr/wavefest/billetterie/infrastructure/integration/PublicationSurLeBus";
import { ConfirmationsIgnorees } from "../../../src/fr/wavefest/billetterie/infrastructure/email/ConfirmationsParEmail";
import { Montant } from "../../../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { JourDuPassInvalideException } from "../../../src/fr/wavefest/billetterie/domaine/offre/Formule";
import { DEBUT_DU_FESTIVAL, EARLY, grilleWaveFest, joursAvant, MAINTENANT, REGULAR } from "../fixtures";

const personnes = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ prenom: `P${i}`, nom: `N${i}`, email: `p${i}@wavefest.fr` }));

describe("Cas d'usage de la Billetterie", () => {
  let horloge: HorlogeFixe;
  let grilles: GrillesTarifairesEnMemoire;
  let commandes: CommandesEnMemoire;
  let billets: BilletsEnMemoire;
  let psp: ApiPspSimulee;
  let acheter: AcheterPassUseCase;
  let payer: PayerCommandeUseCase;
  let expirer: ExpirerCommandesUseCase;

  beforeEach(() => {
    horloge = new HorlogeFixe(MAINTENANT);
    grilles = new GrillesTarifairesEnMemoire(grilleWaveFest());
    commandes = new CommandesEnMemoire();
    billets = new BilletsEnMemoire();
    psp = new ApiPspSimulee();
    const identifiants = new IdentifiantsSequentiels();
    acheter = new AcheterPassUseCase(grilles, commandes, identifiants, horloge);
    payer = new PayerCommandeUseCase(
      commandes,
      billets,
      grilles,
      new PspPaiementAdapter(psp),
      identifiants,
      horloge,
      DEBUT_DU_FESTIVAL,
      new PublicationIgnoree(),
      new ConfirmationsIgnorees(),
    );
    expirer = new ExpirerCommandesUseCase(commandes, grilles, horloge);
  });

  const placesRestantes = async (vague = EARLY) => (await grilles.grilleActuelle()).placesRestantes(vague);

  it("acheter des pass réserve les places et ouvre une commande", async () => {
    const id = await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.PASS_3_JOURS, titulaires: personnes(2) });
    const commande = await commandes.parId(id);
    expect(commande?.statut()).toBe(StatutCommande.EN_COURS);
    expect(await placesRestantes()).toBe(1);
  });

  it("R1 : un achat de 7 billets est refusé et ne garde aucune place", async () => {
    await expect(
      acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.PASS_1_JOUR, jour: 2, titulaires: personnes(7) }),
    ).rejects.toThrow(LimiteDeBilletsDepasseeException);
    expect(await placesRestantes(EARLY)).toBe(3);
    expect(await placesRestantes(REGULAR)).toBe(5);
  });

  it("payer une commande émet un billet nominatif par place, au prix payé", async () => {
    const id = await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.PASS_3_JOURS, titulaires: personnes(4) });
    const issue = await payer.executer(id);
    expect(issue.issue).toBe("COMMANDE_PAYEE");
    const emis = await billets.deLaCommande(id);
    expect(emis).toHaveLength(4);
    expect(emis.map((b) => b.prixAchat.centimes())).toEqual([14900, 14900, 14900, 16900]);
    expect((await commandes.parId(id))?.statut()).toBe(StatutCommande.PAYEE);
  });

  it("un paiement refusé annule la commande et rend les places à leur vague", async () => {
    const id = await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.VIP, titulaires: personnes(2) });
    psp.refuserLaReference(id.valeur());
    const issue = await payer.executer(id);
    expect(issue).toEqual({ issue: "PAIEMENT_REFUSE", motif: "Carte refusée" });
    expect((await commandes.parId(id))?.statut()).toBe(StatutCommande.ANNULEE);
    expect(await placesRestantes()).toBe(3);
    expect(await billets.deLaCommande(id)).toHaveLength(0);
  });

  it("R4 : les commandes non payées sous 15 min expirent et rendent leurs places", async () => {
    const aPayer = await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.VIP, titulaires: personnes(1) });
    horloge.avancerDe(5);
    const oubliee = await acheter.executer({ acheteur: "b@wavefest.fr", formule: Formule.VIP, titulaires: personnes(2) });
    await payer.executer(aPayer);

    horloge.avancerDe(15);
    expect(await expirer.executer()).toBe(1);
    expect((await commandes.parId(oubliee))?.statut()).toBe(StatutCommande.EXPIREE);
    expect((await commandes.parId(aPayer))?.statut()).toBe(StatutCommande.PAYEE);
    expect(await placesRestantes()).toBe(2);
  });

  it("R4 : rien n'expire avant 15 minutes", async () => {
    await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.VIP, titulaires: personnes(1) });
    horloge.avancerDe(14);
    expect(await expirer.executer()).toBe(0);
  });

  it("R5 : changer de titulaire passe par l'agrégat Billet", async () => {
    const id = await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.VIP, titulaires: personnes(1) });
    const issue = await payer.executer(id);
    if (issue.issue !== "COMMANDE_PAYEE") throw new Error("paiement attendu");
    const billet = issue.billets[0]!;
    const changer = new ChangerTitulaireUseCase(billets, new HorlogeFixe(joursAvant(DEBUT_DU_FESTIVAL, 7)), new PublicationIgnoree());
    await expect(changer.executer(billet, { prenom: "Bob", nom: "Durand", email: "bob@wavefest.fr" })).rejects.toThrow(
      ChangementDeNomTropTardException,
    );
  });

  it("R6 : mettre en revente renvoie l'offre avec la commission", async () => {
    const id = await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.VIP, titulaires: personnes(1) });
    const issue = await payer.executer(id);
    if (issue.issue !== "COMMANDE_PAYEE") throw new Error("paiement attendu");
    const offre = await new MettreEnReventeUseCase(billets).executer(issue.billets[0]!, Montant.euros(200));
    expect(offre.commission.centimes()).toBe(1000);
  });

  it("un pass 1 jour sans jour est refusé et ne garde aucune place", async () => {
    await expect(
      acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.PASS_1_JOUR, titulaires: personnes(2) }),
    ).rejects.toThrow(JourDuPassInvalideException);
    expect(await placesRestantes()).toBe(3);
  });

  it("un pass 1 jour n'est valable que le jour choisi", async () => {
    const id = await acheter.executer({ acheteur: "a@wavefest.fr", formule: Formule.PASS_1_JOUR, jour: 2, titulaires: personnes(1) });
    await payer.executer(id);
    const [billet] = await billets.deLaCommande(id);
    expect([1, 2, 3].map((jour) => billet!.estValableLe(jour))).toEqual([false, true, false]);
  });

  it("une commande inconnue est signalée", async () => {
    await expect(payer.executer(CommandeId.de("CMD-404"))).rejects.toThrow("introuvable");
  });
});
