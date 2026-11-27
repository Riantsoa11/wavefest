import { Commandes, GrillesTarifaires, Horloge } from "./ports";

/**
 * Application service (lancé régulièrement) : R4, les commandes non payées sous 15 minutes
 * expirent et leurs places retournent dans le quota de leur vague d'origine.
 * La règle des 15 minutes vit dans Commande.doitExpirerA, pas ici.
 */
export class ExpirerCommandesUseCase {
  constructor(
    private readonly commandes: Commandes,
    private readonly grilles: GrillesTarifaires,
    private readonly horloge: Horloge,
  ) {}

  async executer(): Promise<number> {
    const maintenant = this.horloge.maintenant();
    const aExpirer = (await this.commandes.enAttenteDePaiement()).filter((commande) =>
      commande.doitExpirerA(maintenant),
    );
    if (aExpirer.length === 0) return 0;

    const grille = await this.grilles.grilleActuelle();
    for (const commande of aExpirer) {
      grille.liberer(commande.expirer(maintenant));
      await this.commandes.sauver(commande);
    }
    await this.grilles.sauver(grille);
    return aExpirer.length;
  }
}
