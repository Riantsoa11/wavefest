import { ErreurMetier } from "../commun/ErreurMetier";

/**
 * Formule = le type de pass vendu (glossaire : « Pass »).
 * Le squelette Java l'appelle Formule ; dans le glossaire on dit « pass 1 jour, 3 jours ou VIP ».
 */
export const Formule = {
  PASS_1_JOUR: "PASS_1_JOUR",
  PASS_3_JOURS: "PASS_3_JOURS",
  VIP: "VIP",
} as const;

export type Formule = (typeof Formule)[keyof typeof Formule];

export function libelleDe(formule: Formule): string {
  switch (formule) {
    case Formule.PASS_1_JOUR:
      return "Pass 1 jour";
    case Formule.PASS_3_JOURS:
      return "Pass 3 jours";
    case Formule.VIP:
      return "Pass VIP";
  }
}

/** Le festival dure 3 jours. */
export const JOURS_DU_FESTIVAL = [1, 2, 3] as const;

export class JourDuPassInvalideException extends ErreurMetier {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Les jours pour lesquels un pass est valable : un pass 1 jour vaut pour le jour choisi,
 * un pass 3 jours ou VIP pour les 3 jours.
 */
export function joursValablesPour(formule: Formule, jour?: number): readonly number[] {
  if (formule === Formule.PASS_1_JOUR) {
    if (jour === undefined || !JOURS_DU_FESTIVAL.includes(jour as 1 | 2 | 3)) {
      throw new JourDuPassInvalideException("Un pass 1 jour doit indiquer son jour : 1, 2 ou 3.");
    }
    return [jour];
  }
  if (jour !== undefined) {
    throw new JourDuPassInvalideException(`${libelleDe(formule)} vaut pour les 3 jours : pas de jour à choisir.`);
  }
  return [...JOURS_DU_FESTIVAL];
}
