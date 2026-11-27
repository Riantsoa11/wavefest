/**
 * Une règle métier a été enfreinte.
 * Toutes les erreurs du domaine en héritent : le message est écrit pour l'expert métier.
 */
export abstract class ErreurMetier extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
