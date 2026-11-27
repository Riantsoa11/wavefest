import { describe, expect, it } from "vitest";
import { CommandeId } from "../../../src/fr/wavefest/billetterie/domaine/commun/Identifiants";
import { Montant } from "../../../src/fr/wavefest/billetterie/domaine/commun/Montant";
import { ApiPspSimulee } from "../../../src/fr/wavefest/externe/psp/ApiPspSimulee";
import { PspPaiementAdapter } from "../../../src/fr/wavefest/billetterie/infrastructure/psp/PspPaiementAdapter";

describe("PspPaiementAdapter (ACL)", () => {
  it("traduit « succeeded » en paiement accepté", async () => {
    const acl = new PspPaiementAdapter(new ApiPspSimulee());
    expect(await acl.payer(CommandeId.de("CMD-1"), Montant.euros(149))).toEqual({ issue: "PAIEMENT_ACCEPTE" });
  });

  it("traduit un refus de carte en paiement refusé, avec un motif en français", async () => {
    const psp = new ApiPspSimulee();
    psp.refuserLaReference("CMD-2");
    const acl = new PspPaiementAdapter(psp);
    expect(await acl.payer(CommandeId.de("CMD-2"), Montant.euros(149))).toEqual({
      issue: "PAIEMENT_REFUSE",
      motif: "Carte refusée",
    });
  });
});
