import { ConfirmationsDAchat } from "../../application/ports";
import { CommandePayee } from "../../domaine/commande/CommandePayee";
import { ServiceEmailSimule } from "../../../externe/email/ServiceEmailSimule";

/** Adapter Conformist : on utilise le modèle du prestataire e-mail tel quel. */
export class ConfirmationsParEmail implements ConfirmationsDAchat {
  constructor(private readonly email: ServiceEmailSimule) {}

  async confirmer(commande: CommandePayee): Promise<void> {
    await this.email.send({
      to: commande.acheteur.valeur(),
      subject: `WaveFest : confirmation de la commande ${commande.commande.valeur()}`,
      body: `${commande.places.length} billet(s) pour un total de ${commande.total}.`,
    });
  }
}

/** Adapter neutre pour les tests qui ne s'intéressent pas aux e-mails. */
export class ConfirmationsIgnorees implements ConfirmationsDAchat {
  async confirmer(): Promise<void> {}
}
