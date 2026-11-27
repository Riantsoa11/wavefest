import { describe, expect, it } from "vitest";
import { Montant } from "../../../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { Quantite } from "../../../src/fr/wavefest/billetterie/domaine/commun/Quantite";
import { Formule } from "../../../src/fr/wavefest/billetterie/domaine/offre/Formule";
import {
  FestivalCompletException,
  GrilleTarifaire,
  PlacesInsuffisantesException,
} from "../../../src/fr/wavefest/billetterie/domaine/offre/GrilleTarifaire";
import { FormuleNonProposeeException, Vague } from "../../../src/fr/wavefest/billetterie/domaine/offre/Vague";
import { EARLY, grilleWaveFest, LAST_MINUTE, MAINTENANT, REGULAR } from "../fixtures";

describe("GrilleTarifaire · R2 : le prix dépend de la vague active", () => {
  it("R2_le_prix_est_celui_de_la_vague_early_tant_qu_elle_a_des_places", () => {
    expect(grilleWaveFest().prixActuel(Formule.PASS_3_JOURS, MAINTENANT).egale(Montant.euros(149))).toBe(true);
  });

  it("R2_le_prix_passe_a_regular_quand_early_est_epuisee", () => {
    const grille = grilleWaveFest();
    grille.reserver(Formule.PASS_1_JOUR, Quantite.de(3), MAINTENANT);
    expect(grille.vagueActive(MAINTENANT).id.egale(REGULAR)).toBe(true);
    expect(grille.prixActuel(Formule.PASS_3_JOURS, MAINTENANT).egale(Montant.euros(169))).toBe(true);
  });

  it("R2_le_prix_passe_a_la_vague_suivante_quand_la_date_de_fin_est_atteinte", () => {
    const grille = GrilleTarifaire.avecLesVagues(
      Vague.ouverte({ id: "EARLY", nom: "Early", quota: 100, fin: MAINTENANT, prix: { VIP: Montant.euros(299) } }),
      Vague.ouverte({ id: "REGULAR", nom: "Regular", quota: 100, prix: { VIP: Montant.euros(349) } }),
    );
    expect(grille.prixActuel(Formule.VIP, MAINTENANT).egale(Montant.euros(349))).toBe(true);
  });

  it("une formule absente de la vague est refusée", () => {
    const grille = GrilleTarifaire.avecLesVagues(
      Vague.ouverte({ id: "EARLY", nom: "Early", quota: 10, prix: { VIP: Montant.euros(299) } }),
    );
    expect(() => grille.prixActuel(Formule.PASS_1_JOUR, MAINTENANT)).toThrow(FormuleNonProposeeException);
  });
});

describe("GrilleTarifaire · R3 : quota épuisé, vague suivante", () => {
  it("R3_reserve_dans_la_vague_active_au_prix_de_la_vague", () => {
    const grille = grilleWaveFest();
    const tranches = grille.reserver(Formule.PASS_3_JOURS, Quantite.de(2), MAINTENANT);
    expect(tranches).toHaveLength(1);
    expect(tranches[0]?.vague.egale(EARLY)).toBe(true);
    expect(grille.placesRestantes(EARLY)).toBe(1);
  });

  it("R3_une_commande_a_cheval_sur_deux_vagues_est_decoupee", () => {
    // Given : il reste 3 places en Early
    const grille = grilleWaveFest();
    // When : on demande 5 pass 3 jours
    const tranches = grille.reserver(Formule.PASS_3_JOURS, Quantite.de(5), MAINTENANT);
    // Then : 3 au prix Early, 2 au prix Regular
    expect(tranches.map((t) => [t.vague.valeur(), t.quantite.valeur(), t.prixUnitaire.centimes()])).toEqual([
      ["EARLY", 3, 14900],
      ["REGULAR", 2, 16900],
    ]);
    expect(grille.placesRestantes(EARLY)).toBe(0);
    expect(grille.placesRestantes(REGULAR)).toBe(3);
  });

  it("R3_pas_assez_de_places_au_total_rien_n_est_reserve", () => {
    const grille = grilleWaveFest({ early: 1, regular: 1, lastMinute: 1 });
    expect(() => grille.reserver(Formule.VIP, Quantite.de(4), MAINTENANT)).toThrow(PlacesInsuffisantesException);
    expect(grille.placesRestantes(EARLY)).toBe(1);
    expect(grille.placesRestantes(REGULAR)).toBe(1);
    expect(grille.placesRestantes(LAST_MINUTE)).toBe(1);
  });

  it("R3_quand_toutes_les_vagues_sont_epuisees_le_festival_est_complet", () => {
    const grille = grilleWaveFest({ early: 1, regular: 1, lastMinute: 1 });
    grille.reserver(Formule.VIP, Quantite.de(3), MAINTENANT);
    expect(() => grille.vagueActive(MAINTENANT)).toThrow(FestivalCompletException);
  });
});

describe("GrilleTarifaire · R4 : les places libérées retournent dans leur vague d'origine", () => {
  it("R4_les_places_liberees_retournent_dans_le_quota_de_leur_vague_d_origine", () => {
    const grille = grilleWaveFest();
    const tranches = grille.reserver(Formule.PASS_3_JOURS, Quantite.de(5), MAINTENANT);
    grille.liberer(tranches);
    expect(grille.placesRestantes(EARLY)).toBe(3);
    expect(grille.placesRestantes(REGULAR)).toBe(5);
    expect(grille.vagueActive(MAINTENANT).id.egale(EARLY)).toBe(true);
  });
});
