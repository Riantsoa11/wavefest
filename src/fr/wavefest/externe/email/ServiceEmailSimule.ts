/**
 * Système externe simulé : le prestataire e-mail. Les contextes s'y conforment
 * (relation Conformist) : ils utilisent son modèle tel quel.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export class ServiceEmailSimule {
  private readonly envoyes: EmailMessage[] = [];
  private readonly adressesEnEchec = new Set<string>();

  /** Pour les tests : les e-mails vers cette adresse échouent. */
  fairEchouer(adresse: string): void {
    this.adressesEnEchec.add(adresse);
  }

  async send(message: EmailMessage): Promise<{ delivered: boolean }> {
    if (this.adressesEnEchec.has(message.to)) return { delivered: false };
    this.envoyes.push(message);
    return { delivered: true };
  }

  messagesEnvoyes(): readonly EmailMessage[] {
    return [...this.envoyes];
  }
}
