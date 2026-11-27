import { describe, expect, it } from "vitest";
import {
  ConcertDejaAnnuleException,
  ConcertInconnuException,
  DeuxTetesDAfficheLeMemeJourException,
  JourHorsFestivalException,
  LineUpDejaPublieException,
  Programme,
} from "../../src/fr/wavefest/programmation/domaine/Programme";

describe("Programmation · Programme", () => {
  it("une seule tête d'affiche par jour", () => {
    const programme = new Programme();
    programme.programmer("C1", "Daft Punk", 2, true);
    expect(() => programme.programmer("C2", "Justice", 2, true)).toThrow(DeuxTetesDAfficheLeMemeJourException);
  });

  it("le festival dure 3 jours", () => {
    expect(() => new Programme().programmer("C1", "Air", 4)).toThrow(JourHorsFestivalException);
  });

  it("annuler un concert renvoie le jour et s'il était tête d'affiche", () => {
    const programme = new Programme();
    programme.programmer("C1", "Daft Punk", 2, true);
    expect(programme.annulerLeConcert("C1")).toEqual({ concert: "C1", artiste: "Daft Punk", jour: 2, teteDAffiche: true });
  });

  it("on n'annule pas deux fois le même concert", () => {
    const programme = new Programme();
    programme.programmer("C1", "Air", 1);
    programme.annulerLeConcert("C1");
    expect(() => programme.annulerLeConcert("C1")).toThrow(ConcertDejaAnnuleException);
  });

  it("on n'annule pas un concert qui n'est pas au programme", () => {
    expect(() => new Programme().annulerLeConcert("C9")).toThrow(ConcertInconnuException);
  });

  it("après publication du line-up, on ne programme plus", () => {
    const programme = new Programme();
    programme.publierLeLineUp();
    expect(() => programme.programmer("C1", "Air", 1)).toThrow(LineUpDejaPublieException);
  });
});
