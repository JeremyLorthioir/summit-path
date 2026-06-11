import {
  kmEffort,
  tempsEtapeMin,
  tempsCumuleMin,
  heurePassage,
  allureReelle,
  margeBarriereMin,
  totalGlucidesParTranche,
  glucidesOK,
  ecartAllure,
  ecartTemps,
} from './calc';

describe('Calculs trail', () => {
  describe('kmEffort', () => {
    it('calcule km-effort correct', () => {
      const km = kmEffort(10, 500, 200);
      expect(km).toBe(10 + 5 + 1);
      expect(km).toBeCloseTo(16, 5);
    });

    it('gère les zéros', () => {
      expect(kmEffort(0, 0, 0)).toBe(0);
    });

    it('gère les grandes valeurs', () => {
      const km = kmEffort(50, 5000, 3000);
      expect(km).toBe(50 + 50 + 15);
    });
  });

  describe('tempsEtapeMin', () => {
    it('calcule le temps de jour correctement', () => {
      const temps = tempsEtapeMin(16, 5.7, false);
      expect(temps).toBeCloseTo(16 * 5.7, 5);
    });

    it('ajoute 8% pour la nuit', () => {
      const tempsJour = tempsEtapeMin(16, 5.7, false);
      const tempsNuit = tempsEtapeMin(16, 5.7, true);
      expect(tempsNuit).toBeCloseTo(tempsJour * 1.08, 5);
    });
  });

  describe('tempsCumuleMin', () => {
    it('somme les temps', () => {
      expect(tempsCumuleMin([10, 20, 30])).toBe(60);
    });

    it('gère un tableau vide', () => {
      expect(tempsCumuleMin([])).toBe(0);
    });
  });

  describe('heurePassage', () => {
    it('calcule l\'heure de passage', () => {
      const heure = heurePassage('06:00', 100); // 1h40
      expect(heure).toBe('07:40');
    });

    it('gère le franchissement de minuit', () => {
      const heure = heurePassage('23:00', 120); // 2h
      expect(heure).toBe('01:00');
    });

    it('gère les arrondis', () => {
      const heure = heurePassage('10:00', 65.5); // ~65 min = 1h05
      expect(heure).toBe('11:06');
    });
  });

  describe('allureReelle', () => {
    it('calcule l\'allure réelle en min/km-effort', () => {
      const allure = allureReelle(28800, 80); // 8h (28800s) / 80 km-effort
      expect(allure).toBeCloseTo(6, 5);
    });

    it('retourne 0 si km-effort est 0', () => {
      expect(allureReelle(1000, 0)).toBe(0);
    });
  });

  describe('margeBarriereMin', () => {
    it('retourne un nombre positif si en avance', () => {
      const marge = margeBarriereMin('13:00', '13:50');
      expect(marge).toBe(50);
    });

    it('retourne un nombre négatif si en retard', () => {
      const marge = margeBarriereMin('14:00', '13:50');
      expect(marge).toBe(-10);
    });
  });

  describe('totalGlucidesParTranche', () => {
    it('calcule le total glucides', () => {
      const items = [
        { glucidesUnitaireG: 30, quantite: 1 },
        { glucidesUnitaireG: 90, quantite: 0.5 },
      ];
      const total = totalGlucidesParTranche(items);
      expect(total).toBe(30 + 45);
    });

    it('gère un tableau vide', () => {
      expect(totalGlucidesParTranche([])).toBe(0);
    });
  });

  describe('glucidesOK', () => {
    it('valide si glucides >= 80% de l\'objectif', () => {
      // Objectif: 90 g/h, durée: 60 min = 90 g mini = 72 g (80%)
      expect(glucidesOK(72, 90, 60)).toBe(true);
      expect(glucidesOK(71, 90, 60)).toBe(false);
    });
  });

  describe('ecartAllure', () => {
    it('calcule l\'écart d\'allure', () => {
      expect(ecartAllure(6.5, 5.7)).toBeCloseTo(0.8, 5);
    });
  });

  describe('ecartTemps', () => {
    it('calcule l\'écart de temps', () => {
      expect(ecartTemps(28900, 28800)).toBe(100);
    });
  });
});
