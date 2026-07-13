export interface GpxTrackPoint {
  lat: number;
  lon: number;
  ele: number;
  distanceKm: number;
}

export interface GpxImportResult {
  name: string;
  points: GpxTrackPoint[];
  distanceKm: number;
  dplusM: number;
  dmoinsM: number;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function downsample<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  const step = (items.length - 1) / (maxPoints - 1);
  const result: T[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    result.push(items[Math.round(i * step)]);
  }
  return result;
}

export function parseGpx(content: string, maxPreviewPoints = 1200): GpxImportResult {
  const parser = new DOMParser();
  const xml = parser.parseFromString(content, 'application/xml');
  const parserError = xml.querySelector('parsererror');
  if (parserError) {
    throw new Error('Le fichier GPX est invalide.');
  }

  const trkptNodes = Array.from(xml.querySelectorAll('trkpt'));
  if (trkptNodes.length < 2) {
    throw new Error('Le GPX doit contenir au moins 2 points de trace (trkpt).');
  }

  const name =
    xml.querySelector('trk > name')?.textContent?.trim() ||
    xml.querySelector('metadata > name')?.textContent?.trim() ||
    'Parcours GPX';

  let distanceMeters = 0;
  let dplusM = 0;
  let dmoinsM = 0;

  const points: GpxTrackPoint[] = [];
  let prevLat = 0;
  let prevLon = 0;
  let prevEle = 0;
  let hasPrev = false;

  for (const node of trkptNodes) {
    const lat = Number(node.getAttribute('lat'));
    const lon = Number(node.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const eleNode = node.querySelector('ele');
    const ele = eleNode ? Number(eleNode.textContent) : 0;
    const elevation = Number.isFinite(ele) ? ele : 0;

    if (hasPrev) {
      const d = haversineMeters(prevLat, prevLon, lat, lon);
      distanceMeters += d;
      const diffEle = elevation - prevEle;
      if (diffEle > 0) dplusM += diffEle;
      else dmoinsM += Math.abs(diffEle);
    }

    points.push({
      lat,
      lon,
      ele: elevation,
      distanceKm: distanceMeters / 1000,
    });

    prevLat = lat;
    prevLon = lon;
    prevEle = elevation;
    hasPrev = true;
  }

  if (points.length < 2) {
    throw new Error('Impossible de lire des points exploitables dans ce GPX.');
  }

  const reducedPoints = downsample(points, maxPreviewPoints);
  return {
    name,
    points: reducedPoints,
    distanceKm: distanceMeters / 1000,
    dplusM: Math.round(dplusM),
    dmoinsM: Math.round(dmoinsM),
  };
}
