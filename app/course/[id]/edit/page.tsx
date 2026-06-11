'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { getCourse, updateCourse, type CourseInput } from '@/lib/courses';
import type { Course } from '@/lib/types';
import AppHeader from '@/components/AppHeader';
import CourseForm from '@/components/CourseForm';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user, loading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    getCourse(id).then((c) => {
      if (!c) setNotFound(true);
      else setCourse(c);
    });
  }, [user, id]);

  if (loading || (!course && !notFound)) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader title="Course introuvable" backHref="/dashboard" />
        <div className="mx-auto max-w-2xl p-8 text-body-md text-on-surface-variant">
          Cette course n’existe pas ou a été supprimée.
        </div>
      </main>
    );
  }

  const handleSubmit = async (data: Partial<CourseInput>) => {
    await updateCourse(id, data);
    router.push(`/course/${id}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <AppHeader title="Éditer la course" backHref={`/course/${id}`} />
      <div className="mx-auto max-w-2xl p-gutter md:p-8">
        <CourseForm
          initial={course ?? undefined}
          submitLabel="Enregistrer"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/course/${id}`)}
        />
      </div>
    </main>
  );
}
