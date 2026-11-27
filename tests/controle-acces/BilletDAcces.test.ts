import { describe, expect, it } from "vitest";
import {
  BilletDAcces,
  BilletDejaEchangeException,
  BilletRefuseDejaUtiliseException,
  BilletRefuseMauvaisJourException,
  EntreeRefuseeException,
  IdentiteNonConformeException,
} from "../../src/fr/wavefest/controle-acces/domaine/BilletDAcces";

const alice = { prenom: "Alice", nom: "Martin", email: "alice@wavefest.fr" };
const bob = { prenom: "Bob", nom: "Durand", email: "bob@wavefest.fr" };

describe("Contrôle d'accès · BilletDAcces et Bracelet", () => {
  it("le titulaire échange son billet contre un bracelet le bon jour", () => {
    const billet = new BilletDAcces("BIL-1", alice, [2]);
    const bracelet = billet.echangerContreBracelet(2, alice, "BRA-1");
    expect(bracelet.id).toBe("BRA-1");
    expect(billet.estEchange()).toBe(true);
  });

  it("billet refusé le mauvais jour", () => {
    expect(() => new BilletDAcces("BIL-1", alice, [2]).echangerContreBracelet(1, alice, "BRA-1")).toThrow(
      BilletRefuseMauvaisJourException,
    );
  });

  it("billet refusé s'il est déjà utilisé", () => {
    const billet = new BilletDAcces("BIL-1", alice, [1, 2, 3]);
    billet.echangerContreBracelet(1, alice, "BRA-1");
    expect(() => billet.echangerContreBracelet(1, alice, "BRA-2")).toThrow(BilletRefuseDejaUtiliseException);
  });

  it("billet refusé si la personne n'est pas le titulaire", () => {
    expect(() => new BilletDAcces("BIL-1", alice, [1]).echangerContreBracelet(1, bob, "BRA-1")).toThrow(
      IdentiteNonConformeException,
    );
  });

  it("le nouveau titulaire peut entrer après un changement de nom", () => {
    const billet = new BilletDAcces("BIL-1", alice, [1]);
    billet.changerDeTitulaire(bob);
    expect(billet.echangerContreBracelet(1, bob, "BRA-1").titulaire).toEqual(bob);
  });

  it("le titulaire ne change plus une fois le bracelet remis", () => {
    const billet = new BilletDAcces("BIL-1", alice, [1]);
    billet.echangerContreBracelet(1, alice, "BRA-1");
    expect(() => billet.changerDeTitulaire(bob)).toThrow(BilletDejaEchangeException);
  });

  it("un bracelet 3 jours ouvre le portique chaque jour, sorties et retours compris", () => {
    const bracelet = new BilletDAcces("BIL-1", alice, [1, 2, 3]).echangerContreBracelet(1, alice, "BRA-1");
    bracelet.passerLePortique(1);
    bracelet.passerLePortique(1);
    bracelet.passerLePortique(3);
    expect(bracelet.nombreDEntrees()).toBe(3);
  });

  it("un bracelet 1 jour refuse l'entrée un autre jour", () => {
    const bracelet = new BilletDAcces("BIL-1", alice, [2]).echangerContreBracelet(2, alice, "BRA-1");
    expect(() => bracelet.passerLePortique(3)).toThrow(EntreeRefuseeException);
  });
});
