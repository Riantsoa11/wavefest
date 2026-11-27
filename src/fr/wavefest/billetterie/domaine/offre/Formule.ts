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
