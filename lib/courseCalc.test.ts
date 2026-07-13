import { computeSegments, formatAllure } from './courseCalc';
import type { Course } from './types';

function makeCourse(profile: Course['profilAllure']): Course {
  return {
    id: 'c1',
    ownerUid: 'u1',
    nom: 'Test trail',
    date: '2026-09-12',
    heureDepart: '06:00',
    allureCible: 6,
    profilAllure: profile,
    objectifGlucidesParHeure: 90,
    statut: 'brouillon',
    segments: [
      { ordre: 1, nom: 'S1', distanceKm: 10, dplusM: 0, dmoinsM: 0 },
      { ordre: 2, nom: 'S2', distanceKm: 10, dplusM: 0, dmoinsM: 0 },
      { ordre: 3, nom: 'S3', distanceKm: 10, dplusM: 0, dmoinsM: 0 },
      { ordre: 4, nom: 'S4', distanceKm: 10, dplusM: 0, dmoinsM: 0 },
    ],
    planRavito: [],
    stock: [],
  };
}

describe('computeSegments - profil allure non lineaire', () => {
  it('conserve le temps total tout en rendant le debut plus rapide et la fin plus lente', () => {
    const linear = computeSegments(makeCourse('lineaire'));
    const nonlinear = computeSegments(makeCourse('non_lineaire'));

    expect(nonlinear.totalTempsMin).toBeCloseTo(linear.totalTempsMin, 6);

    const linearFirst = linear.rows[0].tempsEtapeMin;
    const linearLast = linear.rows[linear.rows.length - 1].tempsEtapeMin;
    const nonlinearFirst = nonlinear.rows[0].tempsEtapeMin;
    const nonlinearLast = nonlinear.rows[nonlinear.rows.length - 1].tempsEtapeMin;

    expect(nonlinearFirst).toBeLessThan(linearFirst);
    expect(nonlinearLast).toBeGreaterThan(linearLast);
  });
});

describe('formatAllure', () => {
  it('gere correctement les arrondis pour eviter les secondes a 60', () => {
    expect(formatAllure(5.999)).toBe('6:00');
  });
});
