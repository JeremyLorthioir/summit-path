'use client';

import { useState } from 'react';
import type { Course, ResultatCourse } from '@/lib/types';
import {
  computeSegments,
  computeResultat,
  formatHMS,
  parseHMS,
  formatAllure,
  formatMinutes,
} from '@/lib/courseCalc';

/**
 * Écran Résultat : saisie du temps réel, calcul de l'allure réelle et comparaison au plan.
 */
export default function ResultatScreen({
  course,
  onSave,
}: {
  course: Course;
  onSave: (resultat: ResultatCourse) => Promise<void>;
}) {
  const [tempsReel, setTempsReel] = useState<string>(
    course.resultat ? formatHMS(course.resultat.tempsReelTotalSec) : ''
  );
  const [notes, setNotes] = useState<string>(course.resultat?.notesPostCourse ?? '');
  const [saving, setSaving] = useState(false);

  const { totalKmEffort, totalTempsMin } = computeSegments(course);
  const tempsReelSec = parseHMS(tempsReel);

  // Course virtuelle avec la saisie courante pour calcul en direct.
  const preview = computeResultat({
    ...course,
    resultat: { tempsReelTotalSec: tempsReelSec, notesPostCourse: notes },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ tempsReelTotalSec: tempsReelSec, notesPostCourse: notes });
    } finally {
      setSaving(false);
    }
  };

  const ecartTempsSec = preview?.ecartTempsSec ?? 0;
  const enRetard = ecartTempsSec > 0;

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md text-on-surface">Résultat</h2>
        <button
          onClick={handleSave}
          disabled={saving || !tempsReel}
          className="rounded-lg bg-primary px-4 py-2 text-label-caps uppercase text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
        <div className="space-y-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <label className="block">
            <span className="mb-1 block text-label-caps uppercase text-on-surface-variant">
              Temps réel total (hh:mm:ss)
            </span>
            <input
              value={tempsReel}
              onChange={(e) => setTempsReel(e.target.value)}
              placeholder="12:34:56"
              className="w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-headline-md tabular-nums text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-caps uppercase text-on-surface-variant">
              Notes post-course
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Ressenti, points forts, axes d’amélioration…"
              className="w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
        </div>

        <div className="space-y-stack-md">
          <div className="grid grid-cols-2 gap-stack-md">
            <MetricCard label="Km-effort total" value={totalKmEffort.toFixed(1)} />
            <MetricCard label="Temps estimé" value={formatMinutes(totalTempsMin)} />
            <MetricCard label="Allure cible" value={`${formatAllure(course.allureCible)} /km-eff`} />
            <MetricCard
              label="Allure réelle"
              value={preview ? `${formatAllure(preview.allureReelle)} /km-eff` : '—'}
            />
          </div>

          {preview && tempsReelSec > 0 && (
            <div
              className={`rounded-xl border p-stack-lg ${
                enRetard ? 'border-error bg-error-container' : 'border-primary bg-primary-container'
              }`}
            >
              <span className="block text-label-caps uppercase text-on-surface-variant">
                Comparaison au plan
              </span>
              <div className="mt-2 flex flex-wrap gap-stack-lg">
                <div>
                  <span className="block text-label-caps uppercase text-on-surface-variant">
                    Écart allure
                  </span>
                  <span
                    className={`text-headline-md font-semibold tabular-nums ${
                      enRetard ? 'text-on-error-container' : 'text-on-primary-container'
                    }`}
                  >
                    {preview.ecartAllure >= 0 ? '+' : ''}
                    {preview.ecartAllure.toFixed(2)} min/km-eff
                  </span>
                </div>
                <div>
                  <span className="block text-label-caps uppercase text-on-surface-variant">
                    Écart temps
                  </span>
                  <span
                    className={`text-headline-md font-semibold tabular-nums ${
                      enRetard ? 'text-on-error-container' : 'text-on-primary-container'
                    }`}
                  >
                    {enRetard ? '+' : '−'}
                    {formatHMS(Math.abs(ecartTempsSec))}
                  </span>
                </div>
                <div className="flex items-end">
                  <span
                    className={`text-body-md font-semibold ${
                      enRetard ? 'text-on-error-container' : 'text-on-primary-container'
                    }`}
                  >
                    {enRetard ? 'Plus lent que le plan' : 'Plus rapide que le plan'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
      <span className="block text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className="text-headline-md font-semibold tabular-nums text-on-surface">{value}</span>
    </div>
  );
}
