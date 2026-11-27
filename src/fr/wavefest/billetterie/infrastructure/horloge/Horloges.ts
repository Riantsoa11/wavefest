import { Horloge } from "../../application/ports";

/** Adapter : l'heure réelle. Seul endroit où l'on lit l'horloge du système. */
export class HorlogeSysteme implements Horloge {
  maintenant(): Date {
    return new Date();
  }
}

/** Adapter de test : une horloge qu'on avance à la main. */
export class HorlogeFixe implements Horloge {
  private instant: Date;

  constructor(instant: Date) {
    this.instant = new Date(instant.getTime());
  }

  maintenant(): Date {
    return new Date(this.instant.getTime());
  }

  avancerDe(minutes: number): void {
    this.instant = new Date(this.instant.getTime() + minutes * 60_000);
  }
}
