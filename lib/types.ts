export interface Course {
  id: string;
  ownerUid: string;
  nom: string;
  date: string;                  // "2026-09-12"
  heureDepart: string;           // "06:00"
  allureCible: number;           // min/km-effort
  profilAllure?: 'lineaire' | 'non_lineaire';
  objectifGlucidesParHeure: number;
  statut: 'brouillon' | 'prete' | 'terminee' | 'archivee';
  notes?: string;
  segments: Segment[];
  planRavito: RavitoItem[];
  stock: StockProduit[];
  resultat?: ResultatCourse;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Segment {
  ordre: number;
  nom: string;
  prises?: string;
  produits?: SegmentProduit[];
  distanceKm: number;
  distanceDepuisDepartKm?: number;
  distanceSaisie?: 'segment' | 'cumul';
  dplusM: number;
  dplusCumuleM?: number;
  dmoinsM: number;
  dmoinsCumuleM?: number;
  deniveleSaisie?: 'segment' | 'cumul';
  barriereHoraire?: string;      // "13:50"
  segmentDeNuit?: boolean;
  remarques?: string;
  materiel?: string;
}

export interface SegmentProduit {
  produitId: string;
  quantite: number;
}

export interface ProduitGlobal {
  id: string;
  ownerUid: string;
  nom: string;
  unite: string; // ex: gel, compote, flasque, sachet
  glucidesParUniteG: number;
  volumeLiquideMl: number;
  marque?: string;
  actif?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RavitoItem {
  repere: string;                // "Avant", "H+1", "Ravito 1"
  produit: string;
  quantite: number;
  glucidesUnitaireG: number;
}

export interface StockProduit {
  produit: string;
  quantiteInitiale: number;
  parRavito: number[];           // [avant, R1, R2, ...]
}

export interface ResultatCourse {
  tempsReelTotalSec: number;
  notesPostCourse?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}
