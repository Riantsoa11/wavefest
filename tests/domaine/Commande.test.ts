import { describe, expect, it } from "vitest";
import {
  CommandeVideException,
  DelaiDePaiementDepasseException,
  DelaiDePaiementNonEcouleException,
  LimiteDeBilletsDepasseeException,
  StatutCommande,
  StatutDeCommandeInattenduException,
  TitulairesManquantsException,
} from "../../src/fr/wavefest/billetterie/domaine/commande/Commande";
import { Montant } from "../../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { Formule } from "../../src/fr/wavefest/billetterie/domaine/offre/Formule";
import { MAINTENANT, minutesApres, titulaires, tranche, uneCommandeDe, uneCommandeOuverteA } from "../fixtures";

describe("Commande · R1 : 6 billets maximum par commande", () => {
  it("R1_refuse_plus_de_6_billets", () => {
    // Given
    const commande = uneCommandeOuverteA(MAINTENANT);
    commande.ajouterBillets(Formule.PASS_3_JOURS, [tranche(4, 149)], titulaires(4));
    // When / Then
    expect(() => commande.ajouterBillets(Formule.VIP, [tranche(3, 299)], titulaires(3))).toThrow(
      LimiteDeBilletsDepasseeException,
    );
    expect(commande.nombreDeBillets()).toBe(4);
  });

  it("R1_accepte_6_billets_pile", () => {
    const commande = uneCommandeOuverteA(MAINTENANT);
    commande.ajouterBillets(Formule.PASS_3_JOURS, [tranche(4, 149)], titulaires(4));
    commande.ajouterBillets(Formule.VIP, [tranche(2, 299)], titulaires(2));
    expect(commande.nombreDeBillets()).toBe(6);
  });

  it("R1_compte_les_billets_de_toutes_les_tranches", () => {
    const commande = uneCommandeOuverteA(MAINTENANT);
    expect(() =>
      commande.ajouterBillets(Formule.PASS_1_JOUR, [tranche(5, 59), tranche(2, 69)], titulaires(7)),
    ).toThrow(LimiteDeBilletsDepasseeException);
    expect(commande.nombreDeBillets()).toBe(0);
  });

  it("chaque billet est nominatif : autant de titulaires que de billets", () => {
    const commande = uneCommandeOuverteA(MAINTENANT);
    expect(() => commande.ajouterBillets(Formule.PASS_3_JOURS, [tranche(3, 149)], titulaires(2))).toThrow(
      TitulairesManquantsException,
    );
  });

  it("le total additionne les tranches à leur prix", () => {
    const commande = uneCommandeOuverteA(MAINTENANT);
    commande.ajouterBillets(Formule.PASS_3_JOURS, [tranche(2, 149), tranche(1, 169)], titulaires(3));
    expect(commande.total().egale(Montant.euros(467))).toBe(true);
  });
});

describe("Commande · R4 : non payée sous 15 min, places libérées", () => {
  it("R4_n_expire_pas_avant_15_minutes", () => {
    const commande = uneCommandeDe(2);
    const a14min59 = new Date(minutesApres(MAINTENANT, 15).getTime() - 1000);
    expect(commande.doitExpirerA(a14min59)).toBe(false);
    expect(() => commande.expirer(a14min59)).toThrow(DelaiDePaiementNonEcouleException);
  });

  it("R4_expire_a_15_minutes_pile_et_rend_ses_places", () => {
    const commande = uneCommandeDe(2);
    const a15min = minutesApres(MAINTENANT, 15);
    expect(commande.doitExpirerA(a15min)).toBe(true);
    const placesRendues = commande.expirer(a15min);
    expect(commande.statut()).toBe(StatutCommande.EXPIREE);
    expect(placesRendues.reduce((n, t) => n + t.quantite.valeur(), 0)).toBe(2);
  });

  it("R4_le_minuteur_est_suspendu_des_que_le_paiement_est_initie", () => {
    const commande = uneCommandeDe(2);
    commande.initierPaiement(minutesApres(MAINTENANT, 10));
    expect(commande.doitExpirerA(minutesApres(MAINTENANT, 30))).toBe(false);
  });

  it("R4_refuse_d_initier_le_paiement_apres_15_minutes", () => {
    const commande = uneCommandeDe(2);
    expect(() => commande.initierPaiement(minutesApres(MAINTENANT, 15))).toThrow(DelaiDePaiementDepasseException);
  });
});

describe("Commande · paiement", () => {
  it("une commande payée produit l'événement CommandePayee avec une place par billet", () => {
    const commande = uneCommandeDe(3);
    commande.initierPaiement(MAINTENANT);
    const evenement = commande.confirmerPaiement(minutesApres(MAINTENANT, 1));
    expect(commande.statut()).toBe(StatutCommande.PAYEE);
    expect(evenement.places).toHaveLength(3);
    expect(evenement.total.egale(Montant.euros(447))).toBe(true);
  });

  it("un paiement refusé annule la commande et rend ses places", () => {
    const commande = uneCommandeDe(2);
    commande.initierPaiement(MAINTENANT);
    const placesRendues = commande.refuserPaiement();
    expect(commande.statut()).toBe(StatutCommande.ANNULEE);
    expect(placesRendues).toHaveLength(1);
  });

  it("on ne peut pas payer une commande vide", () => {
    expect(() => uneCommandeOuverteA(MAINTENANT).initierPaiement(MAINTENANT)).toThrow(CommandeVideException);
  });

  it("on ne peut plus ajouter de billets une fois le paiement initié", () => {
    const commande = uneCommandeDe(1);
    commande.initierPaiement(MAINTENANT);
    expect(() => commande.ajouterBillets(Formule.VIP, [tranche(1, 299)], titulaires(1))).toThrow(
      StatutDeCommandeInattenduException,
    );
  });
});
