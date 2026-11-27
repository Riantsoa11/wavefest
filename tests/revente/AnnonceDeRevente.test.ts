import { describe, expect, it } from "vitest";
import {
  AnnonceDeRevente,
  AnnonceNonDisponibleException,
  RachatParLeVendeurException,
  SeulLeTitulairePeutRevendreException,
  StatutAnnonce,
} from "../../src/fr/wavefest/revente/domaine/AnnonceDeRevente";

const alice = { prenom: "Alice", nom: "Martin", email: "alice@wavefest.fr" };
const bob = { prenom: "Bob", nom: "Durand", email: "bob@wavefest.fr" };

const uneAnnonce = () =>
  AnnonceDeRevente.publier({
    billet: "BIL-1",
    vendeur: alice,
    titulaireActuel: alice,
    prixEnCentimes: 12000,
    commissionEnCentimes: 600,
    netVendeurEnCentimes: 11400,
    joursValables: [2],
  });

describe("Revente · AnnonceDeRevente", () => {
  it("seul le titulaire peut mettre son billet en revente", () => {
    expect(() =>
      AnnonceDeRevente.publier({
        billet: "BIL-1",
        vendeur: bob,
        titulaireActuel: alice,
        prixEnCentimes: 12000,
        commissionEnCentimes: 600,
        netVendeurEnCentimes: 11400,
        joursValables: [2],
      }),
    ).toThrow(SeulLeTitulairePeutRevendreException);
  });

  it("un racheteur achète une annonce ouverte", () => {
    const annonce = uneAnnonce();
    annonce.racheter(bob);
    expect(annonce.statut()).toBe(StatutAnnonce.VENDUE);
    expect(annonce.racheteur()).toEqual(bob);
  });

  it("le vendeur ne rachète pas son propre billet", () => {
    expect(() => uneAnnonce().racheter(alice)).toThrow(RachatParLeVendeurException);
  });

  it("une annonce vendue ou retirée n'est plus disponible", () => {
    const vendue = uneAnnonce();
    vendue.racheter(bob);
    expect(() => vendue.retirer()).toThrow(AnnonceNonDisponibleException);
    const retiree = uneAnnonce();
    retiree.retirer();
    expect(() => retiree.racheter(bob)).toThrow(AnnonceNonDisponibleException);
  });

  it("une annonce concerne les jours de validité du billet", () => {
    expect([1, 2, 3].map((jour) => uneAnnonce().concerneLeJour(jour))).toEqual([false, true, false]);
  });
});
