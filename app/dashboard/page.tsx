'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import {
  listenCourses,
  duplicateCourse,
  archiveCourse,
  deleteCourse,
} from '@/lib/courses';
import { computeSegments, formatMinutes } from '@/lib/courseCalc';
import type { Course } from '@/lib/types';
import AppHeader from '@/components/AppHeader';
import StatutChip from '@/components/StatutChip';

type ProfileKind = 'montee' | 'descente' | 'vallonne';

interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
}

interface SegmentProfilePath {
  segmentNumber: number;
  profile: ProfileKind;
  points: ElevationPoint[];
  endDistanceKm: number;
}

interface ElevationData {
  allPoints: ElevationPoint[];
  segmentPaths: SegmentProfilePath[];
  totalDistanceKm: number;
}

function profileLabel(profile: ProfileKind): string {
  if (profile === 'montee') return 'Montee dominante';
  if (profile === 'descente') return 'Descente dominante';
  return 'Vallonne';
}

function profileStroke(profile: ProfileKind): string {
  if (profile === 'montee') return 'text-emerald-600';
  if (profile === 'descente') return 'text-sky-600';
  return 'text-amber-600';
}

function buildElevationData(course: Course): ElevationData | null {
  const segments = [...course.segments].sort((a, b) => a.ordre - b.ordre);
  if (segments.length === 0) return null;

  const allPoints: ElevationPoint[] = [{ distanceKm: 0, elevationM: 0 }];
  const segmentPaths: SegmentProfilePath[] = [];

  let distance = 0;
  let elevation = 0;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const segmentDistance = Math.max(0, segment.distanceKm || 0);
    const up = Math.max(0, segment.dplusM || 0);
    const down = Math.max(0, segment.dmoinsM || 0);
    const startDistance = distance;
    const startElevation = elevation;
    const points: ElevationPoint[] = [{ distanceKm: startDistance, elevationM: startElevation }];

    if (up > 0 && down > 0 && segmentDistance > 0) {
      const upRatio = up / (up + down);
      const midDistance = startDistance + segmentDistance * upRatio;
      const midElevation = startElevation + up;
      points.push({ distanceKm: midDistance, elevationM: midElevation });
      distance = startDistance + segmentDistance;
      elevation = midElevation - down;
      points.push({ distanceKm: distance, elevationM: elevation });
    } else if (up > 0 && segmentDistance > 0) {
      distance = startDistance + segmentDistance;
      elevation = startElevation + up;
      points.push({ distanceKm: distance, elevationM: elevation });
    } else if (down > 0 && segmentDistance > 0) {
      distance = startDistance + segmentDistance;
      elevation = startElevation - down;
      points.push({ distanceKm: distance, elevationM: elevation });
    } else {
      distance = startDistance + segmentDistance;
      points.push({ distanceKm: distance, elevationM: elevation });
    }

    const profile: ProfileKind =
      up > down * 1.2 ? 'montee' : down > up * 1.2 ? 'descente' : 'vallonne';

    segmentPaths.push({
      segmentNumber: index + 1,
      profile,
      points,
      endDistanceKm: distance,
    });

    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
      allPoints.push(points[pointIndex]);
    }
  }

  return {
    allPoints,
    segmentPaths,
    totalDistanceKm: distance,
  };
}

function pointsToPath(
  points: ElevationPoint[],
  scaleX: (value: number) => number,
  scaleY: (value: number) => number
): string {
  return points
    .map((point, index) => {
      const x = scaleX(point.distanceKm);
      const y = scaleY(point.elevationM);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function formatDate(date: string): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenCourses(
      user.uid,
      (list) => setCourses(list),
      (err) => setError(err.message)
    );
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  const handleDuplicate = async (course: Course) => {
    if (!user) return;
    setBusy(course.id);
    try {
      await duplicateCourse(user.uid, course);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleArchive = async (course: Course) => {
    setBusy(course.id);
    try {
      await archiveCourse(course.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Supprimer définitivement « ${course.nom} » ?`)) return;
    setBusy(course.id);
    try {
      await deleteCourse(course.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        title="Mes courses"
        actions={
          <div className="flex gap-stack-md">
            <Link
              href="/products"
              className="rounded-lg border-2 border-outline-variant px-4 py-2 text-body-md font-semibold text-on-surface hover:border-primary"
            >
              Produits
            </Link>
            <Link
              href="/course/new"
              className="rounded-lg bg-primary px-4 py-2 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              + Nouvelle course
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl space-y-stack-lg p-gutter md:p-8">
        <p className="text-body-md text-on-surface-variant">
          Bienvenue, {user?.displayName || user?.email}
        </p>

        {error && (
          <div className="rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
            <h2 className="text-headline-md text-on-surface">Aucune course pour l’instant</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Créez votre première course pour planifier segments, ravitaillements et objectifs.
            </p>
            <Link
              href="/course/new"
              className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90"
            >
              + Créer une course
            </Link>
          </div>
        ) : (
          <ul className="space-y-stack-md">
            {courses.map((course) => {
              const { totalDistanceKm, totalDplusM, totalTempsMin } = computeSegments(course);
              return (
                <li
                  key={course.id}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-col gap-stack-md md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-stack-md">
                        <Link
                          href={`/course/${course.id}`}
                          className="text-headline-md text-primary hover:underline"
                        >
                          {course.nom || 'Course sans nom'}
                        </Link>
                        <StatutChip statut={course.statut} />
                      </div>
                      <p className="mt-1 text-body-md text-on-surface-variant">
                        {formatDate(course.date)} · départ {course.heureDepart || '—'}
                      </p>
                    </div>

                    <div className="flex gap-stack-lg">
                      <Metric label="Distance" value={`${totalDistanceKm.toFixed(1)} km`} />
                      <Metric label="D+" value={`${totalDplusM} m`} />
                      <Metric label="Temps est." value={formatMinutes(totalTempsMin)} />
                    </div>
                  </div>

                  <div className="mt-stack-md">
                    <ElevationPreview course={course} />
                  </div>

                  <div className="mt-stack-md flex flex-wrap gap-stack-md border-t border-outline-variant pt-stack-md">
                    <Link
                      href={`/course/${course.id}`}
                      className="text-label-caps uppercase text-primary hover:underline"
                    >
                      Ouvrir
                    </Link>
                    <Link
                      href={`/course/${course.id}/edit`}
                      className="text-label-caps uppercase text-on-surface-variant hover:text-primary"
                    >
                      Éditer
                    </Link>
                    <button
                      disabled={busy === course.id}
                      onClick={() => handleDuplicate(course)}
                      className="text-label-caps uppercase text-on-surface-variant hover:text-primary disabled:opacity-50"
                    >
                      Dupliquer
                    </button>
                    {course.statut !== 'archivee' && (
                      <button
                        disabled={busy === course.id}
                        onClick={() => handleArchive(course)}
                        className="text-label-caps uppercase text-on-surface-variant hover:text-primary disabled:opacity-50"
                      >
                        Archiver
                      </button>
                    )}
                    <button
                      disabled={busy === course.id}
                      onClick={() => handleDelete(course)}
                      className="text-label-caps uppercase text-error hover:underline disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function ElevationPreview({ course }: { course: Course }) {
  const data = buildElevationData(course);
  if (!data || data.totalDistanceKm <= 0) {
    return (
      <div className="rounded-lg border border-outline-variant/70 bg-surface-container-low p-3 text-body-md text-on-surface-variant">
        Courbe de denivele indisponible: ajoutez des segments avec distance et denivele.
      </div>
    );
  }

  const width = 900;
  const height = 220;
  const paddingX = 24;
  const paddingY = 18;
  const minElevation = Math.min(...data.allPoints.map((point) => point.elevationM));
  const maxElevation = Math.max(...data.allPoints.map((point) => point.elevationM));
  const elevationSpan = Math.max(1, maxElevation - minElevation);

  const scaleX = (distanceKm: number) =>
    paddingX + (distanceKm / Math.max(0.001, data.totalDistanceKm)) * (width - 2 * paddingX);
  const scaleY = (elevationM: number) =>
    paddingY + (1 - (elevationM - minElevation) / elevationSpan) * (height - 2 * paddingY);

  const fullPath = pointsToPath(data.allPoints, scaleX, scaleY);
  const areaPath = `${fullPath} L${(width - paddingX).toFixed(2)} ${(height - paddingY).toFixed(
    2
  )} L${paddingX} ${(height - paddingY).toFixed(2)} Z`;

  return (
    <div className="rounded-lg border border-outline-variant/70 bg-surface-container-low p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-label-caps uppercase text-on-surface-variant">Profil altimetrique</span>
        <div className="flex flex-wrap items-center gap-3 text-label-caps uppercase text-on-surface-variant">
          <LegendDot colorClass="bg-emerald-500" label={profileLabel('montee')} />
          <LegendDot colorClass="bg-sky-500" label={profileLabel('descente')} />
          <LegendDot colorClass="bg-amber-500" label={profileLabel('vallonne')} />
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full rounded bg-surface-container-lowest">
        <path d={areaPath} fill="currentColor" className="text-primary/10" />

        {data.segmentPaths.map((segmentPath) => (
          <path
            key={`line-${segmentPath.segmentNumber}`}
            d={pointsToPath(segmentPath.points, scaleX, scaleY)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={profileStroke(segmentPath.profile)}
          />
        ))}

        {data.segmentPaths.map((segmentPath) => {
          const x = scaleX(segmentPath.endDistanceKm);
          return (
            <g key={`mark-${segmentPath.segmentNumber}`}>
              <line
                x1={x}
                x2={x}
                y1={paddingY}
                y2={height - paddingY}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-outline"
              />
              <text
                x={Math.min(width - 10, x + 3)}
                y={paddingY + 10}
                className="fill-on-surface-variant text-[11px]"
              >
                S{segmentPath.segmentNumber}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-label-caps uppercase text-on-surface-variant">
        <span>0 km</span>
        <span>{data.totalDistanceKm.toFixed(1)} km</span>
      </div>
    </div>
  );
}

function LegendDot({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
      <span>{label}</span>
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <span className="block text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className="block text-body-lg font-semibold text-on-surface tabular-nums">{value}</span>
    </div>
  );
}
