'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-headline-lg font-bold mb-6">Dashboard - Summit Path</h1>
      <p className="text-body-md mb-4">Bienvenue, {user?.displayName || user?.email}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg bg-surface">
          <h2 className="text-headline-md font-semibold mb-2">Mes courses</h2>
          <p className="text-body-md text-on-surface-variant">À venir...</p>
        </div>
        
        <div className="p-6 border rounded-lg bg-surface">
          <h2 className="text-headline-md font-semibold mb-2">Nouvelle course</h2>
          <p className="text-body-md text-on-surface-variant">À venir...</p>
        </div>
      </div>
    </main>
  );
}
