/**
 * Contexte Programmation (supporting) : publier le line-up et les horaires décidés par
 * l'organisateur, et annoncer l'annulation d'un concert aux autres contextes.
 */
export class ErreurProgrammation extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConcertInconnuException extends ErreurProgrammation {
  constructor(concert: string) {
    super(`Le concert ${concert} n'est pas au programme.`);
  }
}

export class ConcertDejaAnnuleException extends ErreurProgrammation {
  constructor(concert: string) {
    super(`Le concert ${concert} est déjà annulé.`);
  }
}

export class DeuxTetesDAfficheLeMemeJourException extends ErreurProgrammation {
  constructor(jour: number) {
    super(`Le jour ${jour} a déjà sa tête d'affiche.`);
  }
}

export class JourHorsFestivalException extends ErreurProgrammation {
  constructor(jour: number) {
    super(`Le festival dure 3 jours : le jour ${jour} n'existe pas.`);
  }
}

export class LineUpDejaPublieException extends ErreurProgrammation {
  constructor() {
    super("Le line-up est déjà publié : on ne programme plus de nouveau concert.");
  }
}

/** Entité du Programme : le passage d'un artiste un jour donné. */
export class Concert {
  private annule = false;

  constructor(
    readonly id: string,
    readonly artiste: string,
    readonly jour: number,
    readonly teteDAffiche: boolean,
  ) {}

  estAnnule(): boolean {
    return this.annule;
  }

  annuler(): void {
    if (this.annule) throw new ConcertDejaAnnuleException(this.id);
    this.annule = true;
  }
}

export interface ConcertAnnuleAuProgramme {
  readonly concert: string;
  readonly artiste: string;
  readonly jour: number;
  readonly teteDAffiche: boolean;
}

/**
 * Agrégat : le programme de l'édition.
 * Règles : 3 jours de festival, une seule tête d'affiche par jour, on n'annule pas deux fois.
 */
export class Programme {
  private readonly concerts: Concert[] = [];
  private publie = false;

  programmer(id: string, artiste: string, jour: number, teteDAffiche = false): void {
    if (this.publie) throw new LineUpDejaPublieException();
    if (![1, 2, 3].includes(jour)) throw new JourHorsFestivalException(jour);
    if (teteDAffiche && this.concerts.some((c) => c.jour === jour && c.teteDAffiche)) {
      throw new DeuxTetesDAfficheLeMemeJourException(jour);
    }
    this.concerts.push(new Concert(id, artiste, jour, teteDAffiche));
  }

  publierLeLineUp(): readonly Concert[] {
    this.publie = true;
    return [...this.concerts];
  }

  estPublie(): boolean {
    return this.publie;
  }

  annulerLeConcert(id: string): ConcertAnnuleAuProgramme {
    const concert = this.concerts.find((c) => c.id === id);
    if (!concert) throw new ConcertInconnuException(id);
    concert.annuler();
    return { concert: concert.id, artiste: concert.artiste, jour: concert.jour, teteDAffiche: concert.teteDAffiche };
  }

  concertsDuJour(jour: number): readonly Concert[] {
    return this.concerts.filter((c) => c.jour === jour);
  }
}
