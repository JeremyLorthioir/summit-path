'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { listenCourse, updateCourse } from '@/lib/courses';
import type { Course, Segment, ResultatCourse } from '@/lib/types';
import AppHeader from '@/components/AppHeader';
import StatutChip from '@/components/StatutChip';
import RavitoScreen from '@/components/RavitoScreen';
import ResultatScreen from '@/components/ResultatScreen';
import SegmentsViewScreen from '@/components/SegmentsViewScreen';
import { computeSegments, formatMinutes } from '@/lib/courseCalc';

type Tab = 'segments' | 'ravito' | 'resultat';

const TABS: { id: Tab; label: string }[] = [
  { id: 'segments', label: 'Segments' },
  { id: 'ravito', label: 'Ravitaillement' },
  { id: 'resultat', label: 'Résultat' },
];

export default function CoursePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, loading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('segments');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const unsubscribe = listenCourse(
      id,
      (c) => {
        if (!c) setNotFound(true);
        else setCourse(c);
      },
      (err) => setError(err.message)
    );
    return () => unsubscribe();
  }, [user, id]);

  if (loading || (!course && !notFound)) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  if (notFound || !course) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader title="Course introuvable" backHref="/dashboard" />
        <div className="mx-auto max-w-2xl p-8 text-body-md text-on-surface-variant">
          Cette course n’existe pas ou a été supprimée.
        </div>
      </main>
    );
  }

  const saveRavito = (segments: Segment[]) =>
    updateCourse(id, { segments });
  const saveResultat = (resultat: ResultatCourse) =>
    updateCourse(id, { resultat, statut: 'terminee' });
  const computed = computeSegments(course);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(15,127,255,0.12),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(9,166,109,0.12),transparent_33%)]" />
      <AppHeader
        title={course.nom || 'Course'}
        backHref="/dashboard"
        actions={
          <Link
            href={`/course/${id}/edit`}
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2 text-label-caps uppercase text-on-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary"
          >
            Éditer
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl space-y-stack-lg p-gutter md:p-8">
        <section className="grid gap-stack-md rounded-2xl border border-outline-variant/70 bg-surface/85 p-stack-lg shadow-sm backdrop-blur md:grid-cols-[1.6fr_1fr]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-stack-md">
              <StatutChip statut={course.statut} />
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-label-caps uppercase text-on-surface-variant">
                {course.date || 'Date non définie'}
              </span>
            </div>
            <p className="text-body-md text-on-surface-variant">
              Départ {course.heureDepart || '—'} · allure cible {course.allureCible} min/km-eff · objectif {course.objectifGlucidesParHeure} g/h
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3">
            <TopMetric label="Distance" value={`${computed.totalDistanceKm.toFixed(1)} km`} />
            <TopMetric label="D+" value={`${computed.totalDplusM} m`} />
            <TopMetric label="Temps plan" value={formatMinutes(computed.totalTempsMin)} />
          </div>
        </section>

        <div className="hidden flex-wrap items-center gap-stack-md">
          <StatutChip statut={course.statut} />
          <span className="text-body-md text-on-surface-variant">
            {course.date || 'Date non définie'} · départ {course.heureDepart || '—'} · allure cible{' '}
            {course.allureCible} min/km-eff · objectif {course.objectifGlucidesParHeure} g/h
          </span>
        </div>

        {error && (
          <div className="rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        )}

        {/* Onglets */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-outline-variant bg-surface p-2 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-label-caps uppercase transition-all ${
                tab === t.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'segments' && (
          <div className="space-y-stack-md">
            <div className="flex flex-wrap justify-end gap-stack-md">
              <Link
                href={`/course/${id}/segments`}
                className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
              >
                Vue dediee
              </Link>
              <Link
                href={`/course/${id}/segments/edit`}
                className="rounded-lg bg-primary px-4 py-2 text-label-caps uppercase text-on-primary hover:opacity-90"
              >
                Formulaire segments
              </Link>
            </div>
            <SegmentsViewScreen course={course} />
          </div>
        )}
        {tab === 'ravito' && <RavitoScreen course={course} onSave={saveRavito} />}
        {tab === 'resultat' && <ResultatScreen course={course} onSave={saveResultat} />}
      </div>
    </main>
  );
}

function TopMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2 text-center">
      <span className="block text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className="block text-body-lg font-semibold tabular-nums text-on-surface">{value}</span>
    </div>
  );
}
