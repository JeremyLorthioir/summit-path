'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { createCourse, type CourseInput } from '@/lib/courses';
import AppHeader from '@/components/AppHeader';
import CourseForm from '@/components/CourseForm';

export default function NewCoursePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  const handleSubmit = async (data: Partial<CourseInput>) => {
    if (!user) return;
    const id = await createCourse(user.uid, {
      nom: data.nom ?? '',
      date: data.date ?? '',
      heureDepart: data.heureDepart ?? '06:00',
      allureCible: data.allureCible ?? 0,
      objectifGlucidesParHeure: data.objectifGlucidesParHeure ?? 0,
      statut: data.statut ?? 'brouillon',
      notes: data.notes ?? '',
      segments: [],
      planRavito: [],
      stock: [],
    });
    router.push(`/course/${id}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <AppHeader title="Nouvelle course" backHref="/dashboard" />
      <div className="mx-auto max-w-2xl p-gutter md:p-8">
        <CourseForm
          submitLabel="Créer la course"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dashboard')}
        />
      </div>
    </main>
  );
}
