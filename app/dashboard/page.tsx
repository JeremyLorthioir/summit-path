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
          <Link
            href="/course/new"
            className="rounded-lg bg-primary px-4 py-2 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            + Nouvelle course
          </Link>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <span className="block text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className="block text-body-lg font-semibold text-on-surface tabular-nums">{value}</span>
    </div>
  );
}
