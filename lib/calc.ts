/**
 * Logique métier de calcul des courses trail
 * Fonctions pures, testables
 */

/**
 * Calcul de km-effort : distance + (D+/100) + (D-/200)
 */
export const kmEffort = (distanceKm: number, dplusM: number, dmoinsM: number): number => {
  return distanceKm + dplusM / 100 + dmoinsM / 200;
};

/**
 * Temps d'une étape en minutes
 * allure en min/km-effort ; segmentDeNuit ajoute +8% (paramétrable)
 */
export const tempsEtapeMin = (
  kmEff: number,
  allureMinPerKmEffort: number,
  segmentDeNuit = false
): number => {
  const factor = segmentDeNuit ? 1.08 : 1;
  return kmEff * allureMinPerKmEffort * factor;
};

/**
 * Temps cumulé depuis le début jusqu'à l'étape i (en minutes)
 */
export const tempsCumuleMin = (tempsEtapes: number[]): number => {
  return tempsEtapes.reduce((acc, t) => acc + t, 0);
};

/**
 * Heure de passage estimée au format "HH:mm"
 * @param heureDepart "06:00"
 * @param cumulMin Temps écoulé en minutes depuis le départ
 */
export const heurePassage = (heureDepart: string, cumulMin: number): string => {
  const [h, m] = heureDepart.split(':').map(Number);
  const totalMin = h * 60 + m + cumulMin;
  const hh = Math.floor((totalMin / 60) % 24);
  const mm = Math.round(totalMin % 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

/**
 * Allure réelle en min/km-effort
 * @param tempsReelTotalSec Temps total en secondes
 * @param kmEffortTotal km-effort total de la course
 */
export const allureReelle = (tempsReelTotalSec: number, kmEffortTotal: number): number => {
  if (kmEffortTotal === 0) return 0;
  return tempsReelTotalSec / 60 / kmEffortTotal;
};

/**
 * Marge à une barrière horaire
 * @returns Nombre de minutes (>0 = en avance, <0 = en retard)
 */
export const margeBarriereMin = (heureEstimee: string, barriere: string): number => {
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  return toMin(barriere) - toMin(heureEstimee);
};

/**
 * Total glucides pour une tranche horaire
 */
export const totalGlucidesParTranche = (items: Array<{ glucidesUnitaireG: number; quantite: number }>): number => {
  return items.reduce((acc, item) => acc + item.glucidesUnitaireG * item.quantite, 0);
};

/**
 * Vérification de l'atteinte de l'objectif glucidique
 * @param glucidesTotal Glucides consommés dans la tranche
 * @param objectifParHeure Objectif en g/h
 * @param dureeMin Durée de la tranche en minutes
 */
export const glucidesOK = (glucidesTotal: number, objectifParHeure: number, dureeMin: number): boolean => {
  const min = objectifParHeure * (dureeMin / 60) * 0.8; // 80% de l'objectif
  return glucidesTotal >= min;
};

/**
 * Écart allure (min/km-effort)
 */
export const ecartAllure = (allureReelle: number, allureCible: number): number => {
  return allureReelle - allureCible;
};

/**
 * Écart temps (secondes)
 */
export const ecartTemps = (tempsReel: number, tempsEstime: number): number => {
  return tempsReel - tempsEstime;
};
