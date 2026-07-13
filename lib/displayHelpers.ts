import type { ProduitGlobal } from '@/lib/types';

/**
 * Niveaux de criticité de la marge à une barrière horaire.
 * - danger  : barrière dépassée (marge négative)
 * - warning : moins d'1h de marge
 * - safe    : au moins 1h de marge
 */
export type MargeLevel = 'danger' | 'warning' | 'safe';

export function getMargeLevel(margeMin: number): MargeLevel {
  if (margeMin < 0) return 'danger';
  if (margeMin < 60) return 'warning';
  return 'safe';
}

/** Classes Tailwind pour un badge/pastille de marge. */
export function margeBadgeClass(level: MargeLevel): string {
  switch (level) {
    case 'danger':
      return 'bg-red-100 text-red-700 border border-red-300';
    case 'warning':
      return 'bg-orange-100 text-orange-700 border border-orange-300';
    case 'safe':
    default:
      return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
  }
}

/** Classes Tailwind pour un texte inline de marge. */
export function margeTextClass(level: MargeLevel): string {
  switch (level) {
    case 'danger':
      return 'text-red-600 font-semibold';
    case 'warning':
      return 'text-orange-600 font-semibold';
    case 'safe':
    default:
      return 'text-emerald-600 font-semibold';
  }
}

/** Libellé court associé au niveau de marge. */
export function margeLabel(level: MargeLevel): string {
  switch (level) {
    case 'danger':
      return 'Dépassée';
    case 'warning':
      return 'Serrée';
    case 'safe':
    default:
      return 'OK';
  }
}

/**
 * Résout une couleur de pastille produit en fonction de son unité (gel, compote, flasque, etc.).
 * Renvoie un jeu de classes Tailwind (fond + texte + bordure) prêt à consommer.
 */
export function productChipClass(unite: string | undefined): string {
  const key = (unite ?? '').trim().toLowerCase();
  switch (true) {
    case /gel|gomm/.test(key):
      return 'bg-sky-100 text-sky-800 border-sky-300';
    case /compot|puree|purée/.test(key):
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case /flasq|bidon|boisson|eau|water|liquide/.test(key):
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case /barre|bar/.test(key):
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case /sachet|poudre|mix|shake/.test(key):
      return 'bg-violet-100 text-violet-800 border-violet-300';
    case /sel|electro|comprim|cap|pastil/.test(key):
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case /solide|sandwich|banane|fruit|patate/.test(key):
      return 'bg-lime-100 text-lime-800 border-lime-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

/** Libelle de typologie produit pour un affichage agrege (ex: 3x gels, 4x boissons). */
export function productTypologyLabel(unite: string | undefined): string {
  const key = (unite ?? '').trim().toLowerCase();
  switch (true) {
    case /gel|gomm/.test(key):
      return 'gels';
    case /compot|puree|purée/.test(key):
      return 'compotes';
    case /flasq|bidon|boisson|eau|water|liquide/.test(key):
      return 'boissons';
    case /barre|bar/.test(key):
      return 'barres';
    case /sachet|poudre|mix|shake/.test(key):
      return 'sachets';
    case /sel|electro|comprim|cap|pastil/.test(key):
      return 'electrolytes';
    case /solide|sandwich|banane|fruit|patate/.test(key):
      return 'solides';
    default:
      return 'autres';
  }
}

/**
 * Besoins théoriques d'un segment.
 * - Glucides : dérivés de l'objectif course (g/h) × durée segment.
 * - Liquide  : basé sur la convention trail 500 ml/h (ajustable si un objectif custom est ajouté à la course).
 */
export const LIQUIDE_CIBLE_ML_PAR_HEURE = 500;

export function besoinsTheoriquesSegment(
  dureeMin: number,
  objectifGlucidesGParHeure: number,
  liquideCibleMlParHeure: number = LIQUIDE_CIBLE_ML_PAR_HEURE
): { glucidesG: number; liquideMl: number } {
  const heures = Math.max(0, dureeMin) / 60;
  return {
    glucidesG: heures * Math.max(0, objectifGlucidesGParHeure),
    liquideMl: heures * Math.max(0, liquideCibleMlParHeure),
  };
}

/** Formate un ratio couvert / cible en pourcentage arrondi (min 0). */
export function pctCouverture(actuel: number, cible: number): number {
  if (cible <= 0) return 0;
  return Math.round((actuel / cible) * 100);
}

/** Classe Tailwind pour un ratio de couverture (>=90% ok, >=60% warn, sinon low). */
export function pctCouvertureClass(pct: number): string {
  if (pct >= 90) return 'text-emerald-700';
  if (pct >= 60) return 'text-orange-600';
  return 'text-red-600';
}

/** Renvoie un libellé court d'un produit pour l'affichage en pastille. */
export function shortProductLabel(product: ProduitGlobal | undefined, fallback: string): string {
  if (!product) return fallback;
  return product.nom;
}
