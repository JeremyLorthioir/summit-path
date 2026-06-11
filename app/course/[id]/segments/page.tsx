'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import SegmentsViewScreen from '@/components/SegmentsViewScreen';
import { listenCourse } from '@/lib/courses';
import type { Course } from '@/lib/types';
import { useAuth } from '@/lib/useAuth';

export default function SegmentsViewPage() {
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

  return (
    <main className="min-h-screen bg-background">
      <AppHeader
        title={`Segments - ${course.nom}`}
        backHref={`/course/${id}`}
        actions={
          <Link
            href={`/course/${id}/segments/edit`}
            className="rounded-lg bg-primary px-4 py-2 text-label-caps uppercase text-on-primary hover:opacity-90"
          >
            Formulaire
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl p-gutter md:p-8">
        <SegmentsViewScreen course={course} />
      </div>
    </main>
  );
}
