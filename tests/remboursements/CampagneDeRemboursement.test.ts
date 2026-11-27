import { describe, expect, it } from "vitest";
import {
  BilletDejaDansLaCampagneException,
  CampagneDeRemboursement,
  CampagneIncompleteException,
  montantARembourser,
  ouvreUneCampagne,
  StatutRemboursement,
} from "../../src/fr/wavefest/remboursements/domaine/CampagneDeRemboursement";

const alice = { prenom: "Alice", nom: "Martin", email: "alice@wavefest.fr" };

describe("Remboursements · règles maison", () => {
  it("seule l'annulation de la tête d'affiche ouvre une campagne", () => {
    expect(ouvreUneCampagne({ teteDAffiche: true })).toBe(true);
    expect(ouvreUneCampagne({ teteDAffiche: false })).toBe(false);
  });

  it("on rend 50 % du prix payé", () => {
    expect(montantARembourser(5900)).toBe(2950);
  });

  it("billet revendu : on rend 50 % du prix de rachat au racheteur", () => {
    expect(montantARembourser(5900, 5000)).toBe(2500);
  });

  it("un seul remboursement par billet", () => {
    const campagne = new CampagneDeRemboursement(2, "C1");
    campagne.ajouter("BIL-1", alice, 5900);
    expect(() => campagne.ajouter("BIL-1", alice, 5900)).toThrow(BilletDejaDansLaCampagneException);
  });

  it("après 3 échecs du PSP, le remboursement passe en traitement manuel", () => {
    const campagne = new CampagneDeRemboursement(2, "C1");
    campagne.ajouter("BIL-1", alice, 5900);
    campagne.remboursementEchoue("BIL-1");
    campagne.remboursementEchoue("BIL-1");
    expect(campagne.aEffectuer()).toHaveLength(1);
    campagne.remboursementEchoue("BIL-1");
    expect(campagne.aEffectuer()).toHaveLength(0);
    expect(campagne.aTraiterALaMain()[0]?.statut()).toBe(StatutRemboursement.A_TRAITER);
  });

  it("la campagne n'est close que quand tous les billets sont remboursés", () => {
    const campagne = new CampagneDeRemboursement(2, "C1");
    campagne.ajouter("BIL-1", alice, 5900);
    campagne.ajouter("BIL-2", alice, 5900);
    campagne.remboursementEffectue("BIL-1");
    expect(() => campagne.clore()).toThrow(CampagneIncompleteException);
    campagne.remboursementEffectue("BIL-2");
    campagne.clore();
    expect(campagne.estClose()).toBe(true);
  });
});
