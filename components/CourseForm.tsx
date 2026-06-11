'use client';

import { useState } from 'react';
import type { Course } from '@/lib/types';
import type { CourseInput } from '@/lib/courses';

const STATUTS: { value: Course['statut']; label: string }[] = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'prete', label: 'Prête' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'archivee', label: 'Archivée' },
];

interface FormState {
  nom: string;
  date: string;
  heureDepart: string;
  allureCible: string;
  objectifGlucidesParHeure: string;
  statut: Course['statut'];
  notes: string;
}

/**
 * Formulaire des métadonnées d'une course (création et édition).
 * Les segments / ravitos sont gérés dans les écrans dédiés.
 */
export default function CourseForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Course>;
  submitLabel: string;
  onSubmit: (data: Partial<CourseInput>) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    nom: initial?.nom ?? '',
    date: initial?.date ?? '',
    heureDepart: initial?.heureDepart ?? '06:00',
    allureCible: initial?.allureCible != null ? String(initial.allureCible) : '8',
    objectifGlucidesParHeure:
      initial?.objectifGlucidesParHeure != null ? String(initial.objectifGlucidesParHeure) : '90',
    statut: initial?.statut ?? 'brouillon',
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nom.trim()) {
      setError('Le nom de la course est requis.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        nom: form.nom.trim(),
        date: form.date,
        heureDepart: form.heureDepart,
        allureCible: Number(form.allureCible) || 0,
        objectifGlucidesParHeure: Number(form.objectifGlucidesParHeure) || 0,
        statut: form.statut,
        notes: form.notes.trim(),
      });
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-stack-lg">
      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {error}
        </div>
      )}

      <Field label="Nom de la course">
        <input
          type="text"
          value={form.nom}
          onChange={(e) => update('nom', e.target.value)}
          placeholder="UTMB 2026"
          className={inputClass}
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
        <Field label="Date">
          <input
            type="date"
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Heure de départ">
          <input
            type="time"
            value={form.heureDepart}
            onChange={(e) => update('heureDepart', e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
        <Field label="Allure cible (min/km-effort)">
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.allureCible}
            onChange={(e) => update('allureCible', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Objectif glucides (g/h)">
          <input
            type="number"
            step="1"
            min="0"
            value={form.objectifGlucidesParHeure}
            onChange={(e) => update('objectifGlucidesParHeure', e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Statut">
        <select
          value={form.statut}
          onChange={(e) => update('statut', e.target.value as Course['statut'])}
          className={inputClass}
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={4}
          placeholder="Stratégie générale, matériel, météo attendue…"
          className={inputClass}
        />
      </Field>

      <div className="flex gap-stack-md">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border-2 border-outline-variant px-6 py-3 text-body-md font-semibold text-on-surface hover:border-primary"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-label-caps uppercase text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
