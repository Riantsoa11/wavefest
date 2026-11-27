/** Port : l'heure actuelle. Le domaine ne la lit jamais lui-même : on la lui passe. */
export interface Horloge {
  maintenant(): Date;
}
