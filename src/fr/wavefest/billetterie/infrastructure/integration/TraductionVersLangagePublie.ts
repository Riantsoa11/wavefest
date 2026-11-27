import { Billet } from "../../domaine/billet/Billet";
import { OffreDeRevente } from "../../domaine/billet/OffreDeRevente";
import { Titulaire } from "../../domaine/commun/Titulaire";
import { BilletPublie, OffreDeReventePubliee } from "../../../integration/ApiBilletterie";
import { TitulairePublie } from "../../../integration/LangagePublie";

/** Traduction de nos objets du domaine vers le langage publié (données simples). */
export const titulairePublie = (titulaire: Titulaire): TitulairePublie => ({
  prenom: titulaire.prenom,
  nom: titulaire.nom,
  email: titulaire.email.valeur(),
});

export const billetPublie = (billet: Billet): BilletPublie => ({
  billet: billet.id.valeur(),
  formule: billet.formule,
  joursValables: [...billet.joursValables],
  titulaire: titulairePublie(billet.titulaire()),
  prixAchatEnCentimes: billet.prixAchat.centimes(),
  rembourse: billet.estRembourse(),
});

export const offrePubliee = (offre: OffreDeRevente): OffreDeReventePubliee => ({
  billet: offre.billet.valeur(),
  prixDeReventeEnCentimes: offre.prixDeRevente.centimes(),
  commissionEnCentimes: offre.commission.centimes(),
  netVendeurEnCentimes: offre.netVendeur.centimes(),
});
