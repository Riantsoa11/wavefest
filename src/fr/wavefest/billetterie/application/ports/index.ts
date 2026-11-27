/**
 * Ports : ce dont l'application a besoin, décrit avec le langage du domaine.
 * L'infrastructure fournit les implémentations (adapters) ; l'application ne la connaît pas.
 */
export type { Billets } from "./Billets";
export type { Commandes } from "./Commandes";
export type { GenerateurIdentifiants } from "./GenerateurIdentifiants";
export type { GrillesTarifaires } from "./GrillesTarifaires";
export type { Horloge } from "./Horloge";
export type { PortPaiement, ResultatPaiement } from "./PortPaiement";
