/**
 * Helpers de calcul dérivés au niveau d'une course.
 * S'appuie sur les fonctions pures de lib/calc.ts.
 */
import {
  kmEffort,
  tempsEtapeMin,
  heurePassage,
  margeBarriereMin,
  allureReelle,
  ecartAllure,
  ecartTemps,
  totalGlucidesParTranche,
  glucidesOK,
} from '@/lib/calc';
import type { Course, Segment, RavitoItem, StockProduit, ProduitGlobal } from '@/lib/types';

export interface SegmentRow {
  segment: Segment;
  kmEffort: number;
  tempsEtapeMin: number;
  tempsCumuleMin: number;
  heurePassage: string;
  /** Marge en minutes à la barrière (>0 = avance), null si pas de barrière. */
  margeBarriereMin: number | null;
}

export interface SegmentsComputed {
  rows: SegmentRow[];
  totalDistanceKm: number;
  totalDplusM: number;
  totalDmoinsM: number;
  totalKmEffort: number;
  totalTempsMin: number;
  heureArrivee: string;
}

/** Calcule l'ensemble des lignes dérivées des segments d'une course. */
export function computeSegments(course: Course): SegmentsComputed {
  const segments = [...course.segments].sort((a, b) => a.ordre - b.ordre);
  let cumul = 0;
  const rows: SegmentRow[] = segments.map((segment) => {
    const kmEff = kmEffort(segment.distanceKm, segment.dplusM, segment.dmoinsM);
    const etape = tempsEtapeMin(kmEff, course.allureCible, segment.segmentDeNuit);
    cumul += etape;
    const heure = heurePassage(course.heureDepart, cumul);
    const marge = segment.barriereHoraire
      ? margeBarriereMin(heure, segment.barriereHoraire)
      : null;
    return {
      segment,
      kmEffort: kmEff,
      tempsEtapeMin: etape,
      tempsCumuleMin: cumul,
      heurePassage: heure,
      margeBarriereMin: marge,
    };
  });

  return {
    rows,
    totalDistanceKm: segments.reduce((a, s) => a + s.distanceKm, 0),
    totalDplusM: segments.reduce((a, s) => a + s.dplusM, 0),
    totalDmoinsM: segments.reduce((a, s) => a + s.dmoinsM, 0),
    totalKmEffort: rows.reduce((a, r) => a + r.kmEffort, 0),
    totalTempsMin: cumul,
    heureArrivee: heurePassage(course.heureDepart, cumul),
  };
}

export interface RavitoGroup {
  repere: string;
  items: RavitoItem[];
  totalGlucides: number;
}

/** Regroupe le plan de ravitaillement par repère et somme les glucides. */
export function groupRavito(items: RavitoItem[]): RavitoGroup[] {
  const map = new Map<string, RavitoItem[]>();
  for (const item of items) {
    const list = map.get(item.repere) ?? [];
    list.push(item);
    map.set(item.repere, list);
  }
  return Array.from(map.entries()).map(([repere, list]) => ({
    repere,
    items: list,
    totalGlucides: totalGlucidesParTranche(list),
  }));
}

export interface StockRow {
  produit: StockProduit;
  totalCalcule: number;
  /** true si la somme par ravito dépasse la quantité initiale. */
  insuffisant: boolean;
}

export interface ProduitSummaryRow {
  produitId: string;
  nom: string;
  unite: string;
  totalQuantite: number;
  totalGlucidesG: number;
  totalLiquideMl: number;
  segmentsTouches: number;
}

export interface ProduitSummary {
  rows: ProduitSummaryRow[];
  totalGlucidesG: number;
  totalLiquideMl: number;
}

/**
 * Agrège les produits sélectionnés par segment pour produire la synthèse ravitaillement.
 */
export function computeProduitSummary(
  segments: Segment[],
  catalog: ProduitGlobal[]
): ProduitSummary {
  const catalogMap = new Map(catalog.map((p) => [p.id, p]));
  const aggregate = new Map<string, ProduitSummaryRow>();

  for (const segment of segments) {
    const seenInSegment = new Set<string>();
    for (const item of segment.produits ?? []) {
      const product = catalogMap.get(item.produitId);
      if (!product) continue;
      const qty = Math.max(0, item.quantite || 0);
      const existing = aggregate.get(product.id);
      const next: ProduitSummaryRow = existing
        ? { ...existing }
        : {
            produitId: product.id,
            nom: product.nom,
            unite: product.unite,
            totalQuantite: 0,
            totalGlucidesG: 0,
            totalLiquideMl: 0,
            segmentsTouches: 0,
          };

      next.totalQuantite += qty;
      next.totalGlucidesG += qty * Math.max(0, product.glucidesParUniteG || 0);
      next.totalLiquideMl += qty * Math.max(0, product.volumeLiquideMl || 0);
      if (!seenInSegment.has(product.id)) {
        next.segmentsTouches += 1;
        seenInSegment.add(product.id);
      }

      aggregate.set(product.id, next);
    }
  }

  const rows = Array.from(aggregate.values()).sort((a, b) => b.totalQuantite - a.totalQuantite);
  return {
    rows,
    totalGlucidesG: rows.reduce((acc, row) => acc + row.totalGlucidesG, 0),
    totalLiquideMl: rows.reduce((acc, row) => acc + row.totalLiquideMl, 0),
  };
}

/** Calcule les totaux de stock et détecte les insuffisances. */
export function computeStock(stock: StockProduit[]): StockRow[] {
  return stock.map((produit) => {
    const totalCalcule = produit.parRavito.reduce((a, q) => a + q, 0);
    return {
      produit,
      totalCalcule,
      insuffisant: totalCalcule > produit.quantiteInitiale,
    };
  });
}

export interface ResultatComputed {
  allureReelle: number;
  ecartAllure: number;
  ecartTempsSec: number;
  tempsEstimeSec: number;
}

/** Calcule l'analyse de résultat post-course. */
export function computeResultat(course: Course): ResultatComputed | null {
  if (!course.resultat) return null;
  const { totalKmEffort, totalTempsMin } = computeSegments(course);
  const reelle = allureReelle(course.resultat.tempsReelTotalSec, totalKmEffort);
  const tempsEstimeSec = Math.round(totalTempsMin * 60);
  return {
    allureReelle: reelle,
    ecartAllure: ecartAllure(reelle, course.allureCible),
    ecartTempsSec: ecartTemps(course.resultat.tempsReelTotalSec, tempsEstimeSec),
    tempsEstimeSec,
  };
}

/** Formate un nombre de minutes en "HhMM" (ex: 75 -> "1h15"). */
export function formatMinutes(min: number): string {
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

/** Formate un nombre de secondes en "hh:mm:ss". */
export function formatHMS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h, m, r].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Parse une chaîne "hh:mm:ss" (ou "mm:ss") en secondes. */
export function parseHMS(value: string): number {
  const parts = value.split(':').map((p) => Number(p) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** Formate une allure (min/km-effort) en "m:ss /km-eff". */
export function formatAllure(minPerKm: number): string {
  if (!isFinite(minPerKm) || minPerKm <= 0) return '–';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export { glucidesOK };
