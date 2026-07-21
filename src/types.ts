export interface CouleurProduit {
  id: string;
  nom_couleur: string;
  photo: string;
}

export interface Produit {
  id: string;
  nom: string;
  description: string;
  prix: number; // en FCFA
  actif: boolean;
  phare: boolean;
  couleurs: CouleurProduit[];
}

export interface LigneCommande {
  produit_id: string;
  nom_produit: string;
  couleur_choisie: string;
  quantite: number;
  prix_unitaire_fige: number; // Prix figé au moment de l'achat
}

export interface Commande {
  code_commande: string; // Ex: #A1B2C3
  nom_client: string;
  telephone_client: string;
  adresse_livraison: string;
  note?: string;
  statut: 'en_attente' | 'payé' | 'expiré';
  date_creation: string; // ISO DateTime string
  montant_total: number;
  lignes: LigneCommande[];
}

export interface Statistics {
  ca_realise: number;
  ca_potentiel: number;
  taux_desistement: number;
  top_produits: { nom: string; quantite: number; ca: number }[];
  statut_repartition: { statut: string; count: number; montant: number }[];
  evolution_ca: { date: string; paye: number; potentiel: number }[];
}
