import { describe, expect, it } from "vitest";
import {
  Centimes,
  MontantCashlessInvalideException,
  RemboursementAvantLaFinException,
  RemboursementHorsDelaiException,
  SoldeCashless,
  SoldeDejaRembourseException,
  SoldeInsuffisantException,
  SoldeTropFaiblePourEtreRembourseException,
} from "../../src/fr/wavefest/cashless/domaine/SoldeCashless";

const FIN = new Date("2027-07-12T00:00:00Z");
const joursApres = (jours: number) => new Date(FIN.getTime() + jours * 24 * 60 * 60_000);

const unSoldeDe = (centimes: number) => {
  const solde = SoldeCashless.ouvrir("BRA-1", "alice@wavefest.fr");
  solde.recharger(Centimes.positif(centimes));
  return solde;
};

describe("Cashless · SoldeCashless", () => {
  it("une consommation est débitée du solde", () => {
    const solde = unSoldeDe(2000);
    solde.payerUneConsommation(Centimes.positif(650));
    expect(solde.montant().valeur).toBe(1350);
  });

  it("paiement refusé si le solde est insuffisant", () => {
    expect(() => unSoldeDe(500).payerUneConsommation(Centimes.positif(650))).toThrow(SoldeInsuffisantException);
  });

  it("un montant cashless est strictement positif et en centimes entiers", () => {
    expect(() => Centimes.positif(0)).toThrow(MontantCashlessInvalideException);
    expect(() => Centimes.positif(1.5)).toThrow(MontantCashlessInvalideException);
  });

  it("le remboursement du solde retient 1,50 € de frais", () => {
    const solde = unSoldeDe(2000);
    expect(solde.montantARembourser(joursApres(1), FIN).valeur).toBe(1850);
    solde.confirmerLeRemboursement();
    expect(solde.montant().valeur).toBe(0);
  });

  it("le remboursement est possible jusqu'à J+15 et refusé après", () => {
    expect(unSoldeDe(2000).montantARembourser(joursApres(15), FIN).valeur).toBe(1850);
    expect(() => unSoldeDe(2000).montantARembourser(joursApres(16), FIN)).toThrow(RemboursementHorsDelaiException);
  });

  it("le remboursement ouvre à la fin du festival", () => {
    expect(() => unSoldeDe(2000).montantARembourser(joursApres(-1), FIN)).toThrow(RemboursementAvantLaFinException);
  });

  it("un solde de 1,50 € ou moins n'est pas remboursé (question ouverte à l'expert)", () => {
    expect(() => unSoldeDe(150).montantARembourser(joursApres(1), FIN)).toThrow(SoldeTropFaiblePourEtreRembourseException);
  });

  it("un solde n'est remboursé qu'une fois", () => {
    const solde = unSoldeDe(2000);
    solde.confirmerLeRemboursement();
    expect(() => solde.montantARembourser(joursApres(1), FIN)).toThrow(SoldeDejaRembourseException);
    expect(() => solde.recharger(Centimes.positif(100))).toThrow(SoldeDejaRembourseException);
  });
});
