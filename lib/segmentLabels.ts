import type { Segment } from '@/lib/types';

export function segmentPointName(segment: Segment, fallback: string): string {
  const value = (segment.nom ?? '').trim();
  return value || fallback;
}

/**
 * Construit le libelle de visualisation d'un segment a partir des points saisis.
 * Regle demandee:
 * - 1er segment: Depart -> Point A
 * - intermediaires: Point N -> Point N+1
 * - dernier segment: Point G -> Arrivee
 */
export function segmentDisplayLabel(segments: Segment[], index: number): string {
  if (!segments[index]) return '';

  const current = segmentPointName(segments[index], `Point ${index + 1}`);

  if (index === 0) {
    return `Depart -> ${current}`;
  }

  if (index === segments.length - 1) {
    return `${current} -> Arrivee`;
  }

  const previous = segmentPointName(segments[index - 1], `Point ${index}`);
  return `${previous} -> ${current}`;
}
