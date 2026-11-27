import { MessagePublie } from "./LangagePublie";

type MessageDeType<T extends MessagePublie["type"]> = Extract<MessagePublie, { type: T }>;

/** Le canal par lequel les contextes publient et écoutent les messages du langage publié. */
export interface Bus {
  publier(message: MessagePublie): Promise<void>;
  ecouter<T extends MessagePublie["type"]>(type: T, abonne: (message: MessageDeType<T>) => Promise<void>): void;
}

/**
 * Bus en mémoire : les abonnés sont appelés dans l'ordre, un message après l'autre.
 * En production, ce serait un vrai bus de messages (cohérence à terme entre contextes).
 */
export class BusEnMemoire implements Bus {
  private readonly abonnes = new Map<string, ((message: MessagePublie) => Promise<void>)[]>();
  private readonly historique: MessagePublie[] = [];

  ecouter<T extends MessagePublie["type"]>(type: T, abonne: (message: MessageDeType<T>) => Promise<void>): void {
    const liste = this.abonnes.get(type) ?? [];
    liste.push(abonne as (message: MessagePublie) => Promise<void>);
    this.abonnes.set(type, liste);
  }

  async publier(message: MessagePublie): Promise<void> {
    this.historique.push(message);
    for (const abonne of this.abonnes.get(message.type) ?? []) {
      await abonne(message);
    }
  }

  /** Pour les tests et la démo : tous les messages publiés, dans l'ordre. */
  messagesPublies(): readonly MessagePublie[] {
    return [...this.historique];
  }
}
