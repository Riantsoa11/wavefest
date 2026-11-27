import { describe, expect, it } from "vitest";
import { Email, EmailInvalideException } from "../../../src/fr/wavefest/billetterie/domaine/commun/Email";
import { Montant, MontantInvalideException } from "../../../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { Quantite, QuantiteInvalideException } from "../../../src/fr/wavefest/billetterie/domaine/commun/Quantite";
import { Titulaire, TitulaireInvalideException } from "../../../src/fr/wavefest/billetterie/domaine/commun/Titulaire";

describe("Montant", () => {
  it("additionne sans erreur d'arrondi (0,10 € + 0,20 € = 0,30 €)", () => {
    expect(Montant.euros(0.1).plus(Montant.euros(0.2)).egale(Montant.euros(0.3))).toBe(true);
  });

  it("refuse un montant négatif", () => {
    expect(() => Montant.euros(-1)).toThrow(MontantInvalideException);
  });

  it("calcule 5 % arrondi au centime", () => {
    expect(Montant.euros(149).pourcentage(5).centimes()).toBe(745);
  });

  it("multiplie par une quantité", () => {
    expect(Montant.euros(149).fois(4).egale(Montant.euros(596))).toBe(true);
  });

  it("s'affiche en euros", () => {
    expect(Montant.euros(149.5).toString()).toBe("149,50 €");
  });
});

describe("Quantite", () => {
  it("accepte un entier d'au moins 1", () => {
    expect(Quantite.de(1).valeur()).toBe(1);
    expect(Quantite.de(6).valeur()).toBe(6);
  });

  it.each([0, -2, 1.5, Number.NaN])("refuse %s", (valeur) => {
    expect(() => Quantite.de(valeur)).toThrow(QuantiteInvalideException);
  });

  it("s'additionne", () => {
    expect(Quantite.de(2).plus(Quantite.de(3)).egale(Quantite.de(5))).toBe(true);
  });
});

describe("Email et Titulaire", () => {
  it("normalise l'adresse e-mail", () => {
    expect(Email.de("  Alice@WaveFest.fr ").valeur()).toBe("alice@wavefest.fr");
  });

  it("refuse une adresse sans @", () => {
    expect(() => Email.de("alice.wavefest.fr")).toThrow(EmailInvalideException);
  });

  it("un titulaire a un nom et un prénom", () => {
    expect(() => Titulaire.nomme("", "Martin", "alice@wavefest.fr")).toThrow(TitulaireInvalideException);
  });
});
