'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { listenCourse, updateCourse } from '@/lib/courses';
import type { Course, Segment, RavitoItem, StockProduit, ResultatCourse } from '@/lib/types';
import AppHeader from '@/components/AppHeader';
import StatutChip from '@/components/StatutChip';
import SegmentsScreen from '@/components/SegmentsScreen';
import RavitoScreen from '@/components/RavitoScreen';
import ResultatScreen from '@/components/ResultatScreen';

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

  const saveSegments = (segments: Segment[]) => updateCourse(id, { segments });
  const saveRavito = (data: { planRavito: RavitoItem[]; stock: StockProduit[] }) =>
    updateCourse(id, data);
  const saveResultat = (resultat: ResultatCourse) =>
    updateCourse(id, { resultat, statut: 'terminee' });

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        title={course.nom || 'Course'}
        backHref="/dashboard"
        actions={
          <Link
            href={`/course/${id}/edit`}
            className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
          >
            Éditer
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl space-y-stack-lg p-gutter md:p-8">
        <div className="flex flex-wrap items-center gap-stack-md">
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
        <div className="flex gap-base border-b border-outline-variant">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-label-caps uppercase transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'segments' && <SegmentsScreen course={course} onSave={saveSegments} />}
        {tab === 'ravito' && <RavitoScreen course={course} onSave={saveRavito} />}
        {tab === 'resultat' && <ResultatScreen course={course} onSave={saveResultat} />}
      </div>
    </main>
  );
}
