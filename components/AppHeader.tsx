'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * En-tête applicatif partagé.
 * @param title Titre affiché à gauche.
 * @param backHref Lien de retour optionnel.
 */
export default function AppHeader({
  title,
  backHref,
  actions,
}: {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant bg-surface px-gutter py-3 md:px-8 print:hidden">
      <div className="flex items-center gap-stack-md">
        {backHref && (
          <Link
            href={backHref}
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Retour"
          >
            ←
          </Link>
        )}
        <div>
          <span className="block text-label-caps uppercase text-primary">Summit Path</span>
          <span className="block text-headline-md text-on-surface">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-stack-md">
        {actions}
        <button
          onClick={handleSignOut}
          className="text-label-caps uppercase text-on-surface-variant hover:text-error transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
