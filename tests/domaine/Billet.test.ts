import { describe, expect, it } from "vitest";
import {
  BilletEnReventeException,
  BilletPasEnReventeException,
  ChangementDeNomTropTardException,
  PrixDeReventeTropEleveException,
  StatutBillet,
} from "../../src/fr/wavefest/billetterie/domaine/billet/Billet";
import { Montant } from "../../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { bob, DEBUT_DU_FESTIVAL, joursAvant, unBilletAchete } from "../fixtures";

describe("Billet · R5 : changement de nom gratuit jusqu'à J-7", () => {
  it("R5_accepte_le_changement_de_nom_a_J_8", () => {
    const billet = unBilletAchete();
    billet.changerTitulaire(bob(), joursAvant(DEBUT_DU_FESTIVAL, 8));
    expect(billet.titulaire().estLeMemeQue(bob())).toBe(true);
  });

  it("R5_accepte_le_changement_de_nom_une_seconde_avant_J_7", () => {
    const billet = unBilletAchete();
    const justeAvant = new Date(joursAvant(DEBUT_DU_FESTIVAL, 7).getTime() - 1000);
    billet.changerTitulaire(bob(), justeAvant);
    expect(billet.titulaire().estLeMemeQue(bob())).toBe(true);
  });

  it("R5_refuse_le_changement_de_nom_a_J_7_pile", () => {
    const billet = unBilletAchete();
    expect(() => billet.changerTitulaire(bob(), joursAvant(DEBUT_DU_FESTIVAL, 7))).toThrow(
      ChangementDeNomTropTardException,
    );
    expect(billet.titulaire().toString()).toBe("Alice Martin");
  });

  it("R5_refuse_le_changement_de_nom_apres_J_7", () => {
    const billet = unBilletAchete();
    expect(() => billet.changerTitulaire(bob(), joursAvant(DEBUT_DU_FESTIVAL, 2))).toThrow(
      ChangementDeNomTropTardException,
    );
  });
});

describe("Billet · R6 : revente au prix d'achat au plus, commission de 5 %", () => {
  it("R6_refuse_un_prix_de_revente_superieur_au_prix_d_achat", () => {
    const billet = unBilletAchete(149);
    expect(() => billet.mettreEnRevente(Montant.euros(149.01))).toThrow(PrixDeReventeTropEleveException);
    expect(billet.statut()).toBe(StatutBillet.VALIDE);
  });

  it("R6_accepte_un_prix_de_revente_egal_au_prix_d_achat", () => {
    const billet = unBilletAchete(149);
    const offre = billet.mettreEnRevente(Montant.euros(149));
    expect(offre.prixDeRevente.egale(Montant.euros(149))).toBe(true);
    expect(billet.statut()).toBe(StatutBillet.EN_REVENTE);
  });

  it("R6_la_commission_vaut_5_pourcent_du_prix_de_revente_retenus_sur_le_net_du_vendeur", () => {
    const offre = unBilletAchete(149).mettreEnRevente(Montant.euros(120));
    expect(offre.commission.egale(Montant.euros(6))).toBe(true);
    expect(offre.netVendeur.egale(Montant.euros(114))).toBe(true);
  });

  it("R6_le_racheteur_devient_le_titulaire", () => {
    const billet = unBilletAchete(149);
    billet.mettreEnRevente(Montant.euros(100));
    const offre = billet.revendreA(bob());
    expect(billet.titulaire().estLeMemeQue(bob())).toBe(true);
    expect(billet.statut()).toBe(StatutBillet.VALIDE);
    expect(offre.netVendeur.egale(Montant.euros(95))).toBe(true);
  });

  it("un billet en revente ne peut pas changer de nom", () => {
    const billet = unBilletAchete();
    billet.mettreEnRevente(Montant.euros(100));
    expect(() => billet.changerTitulaire(bob(), joursAvant(DEBUT_DU_FESTIVAL, 30))).toThrow(BilletEnReventeException);
  });

  it("on ne peut pas racheter un billet qui n'est pas en revente", () => {
    expect(() => unBilletAchete().revendreA(bob())).toThrow(BilletPasEnReventeException);
  });

  it("un billet retiré de la revente redevient valide", () => {
    const billet = unBilletAchete();
    billet.mettreEnRevente(Montant.euros(100));
    billet.retirerDeLaRevente();
    expect(billet.statut()).toBe(StatutBillet.VALIDE);
    expect(billet.offreDeRevente()).toBeUndefined();
  });
});
