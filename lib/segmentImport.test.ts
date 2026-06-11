import { inferSegmentInputModes, normalizeSegments, parseSegmentsCsv } from './segmentImport';
import type { Segment } from './types';

describe('segmentImport', () => {
  describe('normalizeSegments', () => {
    it('normalise une saisie cumulative en valeurs etape + cumul', () => {
      const segments = normalizeSegments(
        [
          {
            ordre: 1,
            nom: 'Depart -> A',
            distanceDepuisDepartKm: 10,
            dplusCumuleM: 400,
            dmoinsCumuleM: 80,
          },
          {
            ordre: 2,
            nom: 'A -> B',
            distanceDepuisDepartKm: 22.5,
            dplusCumuleM: 950,
            dmoinsCumuleM: 420,
          },
        ],
        { distance: 'cumul', denivele: 'cumul' }
      );

      expect(segments[0].distanceKm).toBeCloseTo(10, 3);
      expect(segments[1].distanceKm).toBeCloseTo(12.5, 3);
      expect(segments[0].dplusM).toBe(400);
      expect(segments[1].dplusM).toBe(550);
      expect(segments[1].dmoinsM).toBe(340);
      expect(segments[1].distanceDepuisDepartKm).toBeCloseTo(22.5, 3);
    });

    it('conserve une saisie par segment et recalcule les cumuls', () => {
      const segments = normalizeSegments(
        [
          { ordre: 1, nom: 'S1', distanceKm: 8, dplusM: 300, dmoinsM: 100 },
          { ordre: 2, nom: 'S2', distanceKm: 6, dplusM: 200, dmoinsM: 50 },
        ],
        { distance: 'segment', denivele: 'segment' }
      );

      expect(segments[0].distanceDepuisDepartKm).toBe(8);
      expect(segments[1].distanceDepuisDepartKm).toBe(14);
      expect(segments[1].dplusCumuleM).toBe(500);
      expect(segments[1].dmoinsCumuleM).toBe(150);
    });
  });

  describe('inferSegmentInputModes', () => {
    it('detecte le mode cumul si les champs cumules sont presents', () => {
      const segments: Segment[] = [
        {
          ordre: 1,
          nom: 'S1',
          distanceKm: 8,
          distanceDepuisDepartKm: 8,
          dplusM: 300,
          dplusCumuleM: 300,
          dmoinsM: 100,
          dmoinsCumuleM: 100,
          barriereHoraire: '',
          segmentDeNuit: false,
        },
      ];

      expect(inferSegmentInputModes(segments)).toEqual({ distance: 'cumul', denivele: 'cumul' });
    });
  });

  describe('parseSegmentsCsv', () => {
    it('importe un CSV cumulative exporte depuis Excel', () => {
      const csv = [
        'nom;distanceCumulee;dplusCumule;dmoinsCumule;barriere;nuit;prises',
        'A;10,0;400;80;08:00;0;500ml eau',
        'B;22,5;950;420;12:30;1;gel + sel',
      ].join('\n');

      const parsed = parseSegmentsCsv(csv);

      expect(parsed.modes).toEqual({ distance: 'cumul', denivele: 'cumul' });
      expect(parsed.segments).toHaveLength(2);
      expect(parsed.segments[0].distanceKm).toBeCloseTo(10, 3);
      expect(parsed.segments[1].distanceKm).toBeCloseTo(12.5, 3);
      expect(parsed.segments[1].dplusM).toBe(550);
      expect(parsed.segments[1].segmentDeNuit).toBe(true);
      expect(parsed.segments[1].prises).toBe('gel + sel');
    });

    it('importe un CSV par etape', () => {
      const csv = [
        'nom,distanceKm,dplus,dmoins',
        'S1,8.0,300,100',
        'S2,6.5,250,150',
      ].join('\n');

      const parsed = parseSegmentsCsv(csv);

      expect(parsed.modes).toEqual({ distance: 'segment', denivele: 'segment' });
      expect(parsed.segments[1].distanceDepuisDepartKm).toBeCloseTo(14.5, 3);
      expect(parsed.segments[1].dplusCumuleM).toBe(550);
      expect(parsed.segments[1].dmoinsCumuleM).toBe(250);
    });
  });
});
