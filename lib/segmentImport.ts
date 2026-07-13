import type { Segment } from '@/lib/types';

export type SegmentEntryMode = 'segment' | 'cumul';

export interface SegmentInputModes {
  distance: SegmentEntryMode;
  denivele: SegmentEntryMode;
}

export interface ParsedSegmentsCsv {
  segments: Segment[];
  modes: SegmentInputModes;
}

const DEFAULT_MODES: SegmentInputModes = {
  distance: 'segment',
  denivele: 'segment',
};

type SegmentDraft = Partial<Segment>;

const DISTANCE_SEGMENT_HEADERS = [
  'distance',
  'distancekm',
  'dist',
  'distkm',
  'distanceetape',
  'distanceportion',
  'distanceentredeuxpoints',
  'depuisledernierpoint',
  'distancedepuisledernierpoint',
  'kmetape',
  'kmsegment',
];

const DISTANCE_CUMUL_HEADERS = [
  'distancecumulee',
  'distancecumule',
  'distancecumul',
  'distanceaudepart',
  'distancedepuisledepart',
  'distancedepart',
  'distancecourse',
  'kmcumule',
  'kmtotal',
  'kmdepart',
  'cumuldistance',
];

const DPLUS_SEGMENT_HEADERS = [
  'd+',
  'dplus',
  'denivelepositif',
  'deniveleplus',
  'montee',
  'ascension',
];

const DPLUS_CUMUL_HEADERS = [
  'd+cumul',
  'dpluscumul',
  'dpluscumule',
  'denivelepositifcumul',
  'denivelepositifcumule',
  'cumuldplus',
];

const DMOINS_SEGMENT_HEADERS = [
  'd-',
  'dmoins',
  'denivelenegatif',
  'denivelemoins',
  'descente',
];

const DMOINS_CUMUL_HEADERS = [
  'd-cumul',
  'dmoinscumul',
  'dmoinscumule',
  'denivelenegatifcumul',
  'denivelenegatifcumule',
  'cumuldmoins',
];

const NAME_HEADERS = ['nom', 'segment', 'section', 'point', 'checkpoint', 'repere'];
const BARRIERE_HEADERS = ['barriere', 'barrierehoraire', 'cutoff', 'cutofftime', 'heurelimite'];
const NUIT_HEADERS = ['nuit', 'segmentdenuit', 'denuit', 'night'];
const REMARQUE_HEADERS = ['remarque', 'remarques', 'note', 'notes', 'commentaire', 'commentaires'];
const PRISES_HEADERS = ['prise', 'prises', 'intake', 'intakes', 'apports'];

export function inferSegmentInputModes(segments: Segment[]): SegmentInputModes {
  if (segments.length === 0) return DEFAULT_MODES;

  const distance =
    segments.some((segment) => segment.distanceSaisie === 'cumul') ||
    segments.some((segment) => segment.distanceDepuisDepartKm != null)
      ? 'cumul'
      : 'segment';

  const denivele =
    segments.some((segment) => segment.deniveleSaisie === 'cumul') ||
    segments.some((segment) => segment.dplusCumuleM != null || segment.dmoinsCumuleM != null)
      ? 'cumul'
      : 'segment';

  return { distance, denivele };
}

export function normalizeSegments(
  segments: SegmentDraft[],
  modes: SegmentInputModes = inferSegmentInputModes(segments as Segment[])
): Segment[] {
  let cumulDistance = 0;
  let cumulDplus = 0;
  let cumulDmoins = 0;

  return segments.map((segment, index) => {
    const distanceMode = modes.distance;
    const deniveleMode = modes.denivele;

    const distanceCumule = sanitizeCumulative(
      distanceMode === 'cumul' ? segment.distanceDepuisDepartKm : cumulDistance + sanitizeNumber(segment.distanceKm),
      cumulDistance
    );
    const dplusCumule = sanitizeCumulative(
      deniveleMode === 'cumul' ? segment.dplusCumuleM : cumulDplus + sanitizeNumber(segment.dplusM),
      cumulDplus
    );
    const dmoinsCumule = sanitizeCumulative(
      deniveleMode === 'cumul' ? segment.dmoinsCumuleM : cumulDmoins + sanitizeNumber(segment.dmoinsM),
      cumulDmoins
    );

    const normalizedSegment: Segment = {
      ordre: index + 1,
      nom: segment.nom ?? '',
      prises: segment.prises ?? '',
      distanceKm: round(distanceCumule - cumulDistance, 3),
      distanceDepuisDepartKm: round(distanceCumule, 3),
      distanceSaisie: distanceMode,
      dplusM: Math.round(dplusCumule - cumulDplus),
      dplusCumuleM: Math.round(dplusCumule),
      dmoinsM: Math.round(dmoinsCumule - cumulDmoins),
      dmoinsCumuleM: Math.round(dmoinsCumule),
      deniveleSaisie: deniveleMode,
      barriereHoraire: segment.barriereHoraire || '',
      segmentDeNuit: !!segment.segmentDeNuit,
      remarques: segment.remarques ?? '',
      materiel: segment.materiel ?? '',
    };

    cumulDistance = distanceCumule;
    cumulDplus = dplusCumule;
    cumulDmoins = dmoinsCumule;

    return normalizedSegment;
  });
}

export function parseSegmentsCsv(text: string): ParsedSegmentsCsv {
  const rows = parseDelimitedRows(text);
  if (rows.length < 2) {
    throw new Error('Le fichier CSV ne contient pas assez de lignes pour importer des segments.');
  }

  const headers = rows[0].map(normalizeHeader);
  const distanceMode = guessMode(headers, DISTANCE_CUMUL_HEADERS, DISTANCE_SEGMENT_HEADERS);
  const deniveleMode = guessMode(
    headers,
    [...DPLUS_CUMUL_HEADERS, ...DMOINS_CUMUL_HEADERS],
    [...DPLUS_SEGMENT_HEADERS, ...DMOINS_SEGMENT_HEADERS]
  );

  const drafts = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row, index) => rowToSegment(row, headers, index + 1, { distance: distanceMode, denivele: deniveleMode }));

  if (drafts.length === 0) {
    throw new Error('Le fichier CSV ne contient aucune ligne exploitable.');
  }

  return {
    segments: normalizeSegments(drafts, { distance: distanceMode, denivele: deniveleMode }),
    modes: { distance: distanceMode, denivele: deniveleMode },
  };
}

function rowToSegment(
  row: string[],
  headers: string[],
  ordre: number,
  modes: SegmentInputModes
): SegmentDraft {
  const nom = firstCell(row, headers, NAME_HEADERS) || `Segment ${ordre}`;

  const distanceSegment = firstNumber(row, headers, DISTANCE_SEGMENT_HEADERS);
  const distanceCumule = firstNumber(row, headers, DISTANCE_CUMUL_HEADERS);
  const dplusSegment = firstNumber(row, headers, DPLUS_SEGMENT_HEADERS);
  const dplusCumule = firstNumber(row, headers, DPLUS_CUMUL_HEADERS);
  const dmoinsSegment = firstNumber(row, headers, DMOINS_SEGMENT_HEADERS);
  const dmoinsCumule = firstNumber(row, headers, DMOINS_CUMUL_HEADERS);

  return {
    ordre,
    nom,
    distanceKm: distanceSegment ?? 0,
    distanceDepuisDepartKm: distanceCumule,
    distanceSaisie: modes.distance,
    dplusM: dplusSegment ?? 0,
    dplusCumuleM: dplusCumule,
    dmoinsM: dmoinsSegment ?? 0,
    dmoinsCumuleM: dmoinsCumule,
    deniveleSaisie: modes.denivele,
    barriereHoraire: firstCell(row, headers, BARRIERE_HEADERS) || '',
    segmentDeNuit: firstBoolean(row, headers, NUIT_HEADERS),
    remarques: firstCell(row, headers, REMARQUE_HEADERS) || '',
    prises: firstCell(row, headers, PRISES_HEADERS) || '',
  };
}

function parseDelimitedRows(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const separator = guessSeparator(cleaned);
  const rows: string[][] = [];
  let currentCell = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    const next = cleaned[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === separator) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if (!inQuotes && char === '\n') {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentCell = '';
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows;
}

function guessSeparator(text: string): string {
  const sample = text.split('\n').find((line) => line.trim().length > 0) ?? '';
  const candidates = [';', ',', '\t'];
  let best = ';';
  let bestCount = -1;

  for (const candidate of candidates) {
    const count = sample.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }

  return best;
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+-]+/g, '');
}

function guessMode(headers: string[], cumulativeHeaders: string[], stageHeaders: string[]): SegmentEntryMode {
  const hasCumulative = cumulativeHeaders.some((header) => headers.includes(header));
  const hasStage = stageHeaders.some((header) => headers.includes(header));
  return hasCumulative && !hasStage ? 'cumul' : 'segment';
}

function firstCell(row: string[], headers: string[], acceptedHeaders: string[]): string | undefined {
  for (const header of acceptedHeaders) {
    const index = headers.indexOf(header);
    if (index >= 0 && row[index]?.trim()) {
      return row[index].trim();
    }
  }
  return undefined;
}

function firstNumber(row: string[], headers: string[], acceptedHeaders: string[]): number | undefined {
  const raw = firstCell(row, headers, acceptedHeaders);
  if (!raw) return undefined;
  const parsed = parseNumber(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstBoolean(row: string[], headers: string[], acceptedHeaders: string[]): boolean {
  const raw = firstCell(row, headers, acceptedHeaders);
  if (!raw) return false;
  return ['1', 'true', 'vrai', 'oui', 'yes', 'x'].includes(raw.toLowerCase());
}

function parseNumber(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  return Number(normalized);
}

function sanitizeNumber(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function sanitizeCumulative(value: number | undefined, previous: number): number {
  return Math.max(previous, sanitizeNumber(value));
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}