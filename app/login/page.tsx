'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erreur connexion:', error);
      setSigningIn(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 text-center">
        <h1 className="text-display-metrics text-primary font-bold">Summit Path</h1>
        <p className="text-body-lg text-on-surface-variant">
          Planifiez vos courses trail avec précision
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full px-6 py-4 text-body-md font-semibold bg-primary text-on-primary rounded-lg hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 transition-colors"
        >
          {signingIn ? 'Connexion en cours...' : 'Se connecter avec Google'}
        </button>

        <p className="text-label-caps text-on-surface-variant">
          Application sécurisée - Vos données restent privées
        </p>
      </div>
    </main>
  );
}
