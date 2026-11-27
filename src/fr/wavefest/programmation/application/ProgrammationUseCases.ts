import { Programme } from "../domaine/Programme";
import { Bus } from "../../integration/Bus";

/** Cas d'usage de la Programmation : publier le line-up, annuler un concert. */
export class ProgrammationUseCases {
  constructor(
    private readonly programme: Programme,
    private readonly bus: Bus,
  ) {}

  programmer(id: string, artiste: string, jour: number, teteDAffiche = false): void {
    this.programme.programmer(id, artiste, jour, teteDAffiche);
  }

  /** Programmation → Billetterie (Customer / Supplier) : Line-up publié. */
  async publierLeLineUp(): Promise<void> {
    const concerts = this.programme.publierLeLineUp();
    await this.bus.publier({
      type: "LineUpPublie",
      concerts: concerts.map((c) => ({ concert: c.id, artiste: c.artiste, jour: c.jour, teteDAffiche: c.teteDAffiche })),
    });
  }

  /** Programmation → Remboursements (Customer / Supplier) : Concert annulé. */
  async annulerLeConcert(id: string): Promise<void> {
    const annule = this.programme.annulerLeConcert(id);
    await this.bus.publier({ type: "ConcertAnnule", ...annule });
  }
}
