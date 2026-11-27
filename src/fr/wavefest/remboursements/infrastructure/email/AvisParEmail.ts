import { Avis } from "../../application/RemboursementsUseCases";
import { ServiceEmailSimule } from "../../../externe/email/ServiceEmailSimule";

const enEuros = (centimes: number) => `${(centimes / 100).toFixed(2).replace(".", ",")} €`;

/** Adapter Conformist : on utilise le modèle du prestataire e-mail tel quel. */
export class AvisParEmail implements Avis {
  constructor(private readonly email: ServiceEmailSimule) {}

  async annulationSansRemboursement(email: string, artiste: string, jour: number): Promise<void> {
    await this.email.send({
      to: email,
      subject: `WaveFest : ${artiste} annulé (jour ${jour})`,
      body: "Ce concert n'était pas la tête d'affiche : votre pass reste valable, sans remboursement.",
    });
  }

  /** Si l'e-mail échoue, on le renvoie une fois (process TP2). */
  async remboursementEffectue(email: string, montantEnCentimes: number, artiste: string): Promise<boolean> {
    const message = {
      to: email,
      subject: `WaveFest : remboursement suite à l'annulation de ${artiste}`,
      body: `Nous vous avons remboursé ${enEuros(montantEnCentimes)}. Votre billet reste valable.`,
    };
    const premier = await this.email.send(message);
    if (premier.delivered) return true;
    return (await this.email.send(message)).delivered;
  }
}
