import type { Course } from '@/lib/types';

const STYLES: Record<Course['statut'], { label: string; className: string }> = {
  brouillon: { label: 'Brouillon', className: 'bg-surface-variant text-on-surface-variant' },
  prete: { label: 'Prête', className: 'bg-primary-container text-on-primary-container' },
  terminee: { label: 'Terminée', className: 'bg-secondary-container text-on-secondary-container' },
  archivee: { label: 'Archivée', className: 'bg-error-container text-on-error-container' },
};

export default function StatutChip({ statut }: { statut: Course['statut'] }) {
  const { label, className } = STYLES[statut] ?? STYLES.brouillon;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-label-caps uppercase ${className}`}>
      {label}
    </span>
  );
}
