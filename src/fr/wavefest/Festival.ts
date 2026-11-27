/**
 * Composition root : assemble les 6 bounded contexts de WaveFest et branche leurs
 * échanges comme sur la Context Map (docs/context-map.md). C'est le seul endroit qui
 * connaît tous les contextes ; aucun contexte n'importe le code d'un autre.
 */
import { AcheterPassUseCase } from "./billetterie/application/AcheterPassUseCase";
import { ExpirerCommandesUseCase } from "./billetterie/application/ExpirerCommandesUseCase";
import { ChangerTitulaireUseCase } from "./billetterie/application/GererBilletUseCases";
import { PayerCommandeUseCase } from "./billetterie/application/PayerCommandeUseCase";
import { GrilleTarifaire } from "./billetterie/domaine/offre/GrilleTarifaire";
import { ConfirmationsParEmail } from "./billetterie/infrastructure/email/ConfirmationsParEmail";
import { HorlogeFixe } from "./billetterie/infrastructure/horloge/Horloges";
import { PublicationSurLeBus } from "./billetterie/infrastructure/integration/PublicationSurLeBus";
import { ServiceOuvertBilletterie } from "./billetterie/infrastructure/integration/ServiceOuvertBilletterie";
import {
  BilletsEnMemoire,
  CommandesEnMemoire,
  GrillesTarifairesEnMemoire,
} from "./billetterie/infrastructure/persistance/EnMemoire";
import { IdentifiantsSequentiels } from "./billetterie/infrastructure/persistance/IdentifiantsSequentiels";
import { PspPaiementAdapter } from "./billetterie/infrastructure/psp/PspPaiementAdapter";
import { CashlessUseCases } from "./cashless/application/CashlessUseCases";
import { PspCashlessAdapter } from "./cashless/infrastructure/psp/PspCashlessAdapter";
import { SoldesEnMemoire } from "./cashless/infrastructure/SoldesEnMemoire";
import { ControleDAccesUseCases } from "./controle-acces/application/ControleDAccesUseCases";
import { AccesEnMemoire } from "./controle-acces/infrastructure/AccesEnMemoire";
import { ServiceEmailSimule } from "./externe/email/ServiceEmailSimule";
import { ApiPspSimulee } from "./externe/psp/ApiPspSimulee";
import { BusEnMemoire } from "./integration/Bus";
import { ProgrammationUseCases } from "./programmation/application/ProgrammationUseCases";
import { Programme } from "./programmation/domaine/Programme";
import { RemboursementsUseCases } from "./remboursements/application/RemboursementsUseCases";
import { AvisParEmail } from "./remboursements/infrastructure/email/AvisParEmail";
import { CampagnesEnMemoire } from "./remboursements/infrastructure/CampagnesEnMemoire";
import { PspRemboursementAdapter } from "./remboursements/infrastructure/psp/PspRemboursementAdapter";
import { ReventeUseCases } from "./revente/application/ReventeUseCases";
import { AnnoncesEnMemoire } from "./revente/infrastructure/AnnoncesEnMemoire";

export interface ParametresDuFestival {
  grille: GrilleTarifaire;
  maintenant: Date;
  debutDuFestival: Date;
  finDuFestival: Date;
}

export function assemblerLeFestival(parametres: ParametresDuFestival) {
  // Systèmes externes et infrastructure partagée
  const bus = new BusEnMemoire();
  const psp = new ApiPspSimulee();
  const email = new ServiceEmailSimule();
  const horloge = new HorlogeFixe(parametres.maintenant);

  // Billetterie (core)
  const grilles = new GrillesTarifairesEnMemoire(parametres.grille);
  const commandes = new CommandesEnMemoire();
  const billets = new BilletsEnMemoire();
  const identifiants = new IdentifiantsSequentiels();
  const publication = new PublicationSurLeBus(bus);
  const billetterie = {
    acheterPass: new AcheterPassUseCase(grilles, commandes, identifiants, horloge),
    payerCommande: new PayerCommandeUseCase(
      commandes,
      billets,
      grilles,
      new PspPaiementAdapter(psp),
      identifiants,
      horloge,
      parametres.debutDuFestival,
      publication,
      new ConfirmationsParEmail(email),
    ),
    expirerCommandes: new ExpirerCommandesUseCase(commandes, grilles, horloge),
    changerTitulaire: new ChangerTitulaireUseCase(billets, horloge, publication),
    billets,
    grilles,
  };
  const serviceOuvertBilletterie = new ServiceOuvertBilletterie(billets, publication);

  // Les autres contextes
  const programmation = new ProgrammationUseCases(new Programme(), bus);
  const revente = new ReventeUseCases(serviceOuvertBilletterie, new AnnoncesEnMemoire(), bus);
  const controleDAcces = new ControleDAccesUseCases(new AccesEnMemoire(), bus);
  const cashless = new CashlessUseCases(new SoldesEnMemoire(), new PspCashlessAdapter(psp), horloge, parametres.finDuFestival);
  const remboursements = new RemboursementsUseCases(
    new CampagnesEnMemoire(),
    serviceOuvertBilletterie,
    new PspRemboursementAdapter(psp),
    new AvisParEmail(email),
    bus,
  );

  // Les relations de la Context Map
  bus.ecouter("BilletEmis", (m) => controleDAcces.quandUnBilletEstEmis(m)); // Billetterie → Contrôle d'accès (OHS + PL)
  bus.ecouter("TitulaireChange", (m) => controleDAcces.quandLeTitulaireChange(m)); // Billetterie → Contrôle d'accès
  bus.ecouter("ConcertAnnule", (m) => remboursements.quandUnConcertEstAnnule(m)); // Programmation → Remboursements (C/S)
  bus.ecouter("BilletRevendu", (m) => remboursements.quandUnBilletEstRevendu(m)); // Revente → Remboursements (C/S)
  bus.ecouter("CampagneDeRemboursementOuverte", async (m) => {
    await revente.retirerLesAnnoncesDuJour(m.jour); // Remboursements → Revente : retrait des annonces du jour
  });
  bus.ecouter("BilletEchangeContreBracelet", (m) => cashless.quandUnBilletEstEchange(m)); // Contrôle d'accès ↔ Cashless (Partnership)

  return { bus, psp, email, horloge, billetterie, programmation, revente, controleDAcces, cashless, remboursements };
}

export type Festival = ReturnType<typeof assemblerLeFestival>;
