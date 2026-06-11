'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import SegmentsScreen from '@/components/SegmentsScreen';
import { listenCourse, updateCourse } from '@/lib/courses';
import type { Course, Segment } from '@/lib/types';
import { useAuth } from '@/lib/useAuth';

export default function SegmentsEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, loading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const unsubscribe = listenCourse(id, (value) => {
      if (!value) setNotFound(true);
      else setCourse(value);
    });
    return () => unsubscribe();
  }, [user, id]);

  if (loading || (!course && !notFound)) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  if (notFound || !course) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader title="Course introuvable" backHref="/dashboard" />
      </main>
    );
  }

  const saveSegments = (segments: Segment[]) => updateCourse(id, { segments });

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        title={`Formulaire segments - ${course.nom}`}
        backHref={`/course/${id}/segments`}
        actions={
          <Link
            href={`/course/${id}/segments`}
            className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
          >
            Visualisation
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl p-gutter md:p-8">
        <SegmentsScreen course={course} onSave={saveSegments} />
      </div>
    </main>
  );
}
