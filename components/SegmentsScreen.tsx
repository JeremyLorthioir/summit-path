'use client';

import { useState } from 'react';
import type { Course, Segment } from '@/lib/types';
import { computeSegments, formatMinutes } from '@/lib/courseCalc';

const emptySegment = (ordre: number): Segment => ({
  ordre,
  nom: '',
  distanceKm: 0,
  dplusM: 0,
  dmoinsM: 0,
  barriereHoraire: '',
  segmentDeNuit: false,
  remarques: '',
});

/**
 * Écran d'édition des segments : grille éditable + colonnes calculées + ligne total.
 */
export default function SegmentsScreen({
  course,
  onSave,
}: {
  course: Course;
  onSave: (segments: Segment[]) => Promise<void>;
}) {
  const [segments, setSegments] = useState<Segment[]>(
    [...course.segments].sort((a, b) => a.ordre - b.ordre)
  );
  const [saving, setSaving] = useState(false);

  // Course virtuelle pour recalculer en direct selon l'édition courante.
  const computed = computeSegments({ ...course, segments });

  const update = (index: number, patch: Partial<Segment>) =>
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addRow = () =>
    setSegments((prev) => [...prev, emptySegment(prev.length + 1)]);

  const removeRow = (index: number) =>
    setSegments((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, ordre: i + 1 }))
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(segments.map((s, i) => ({ ...s, ordre: i + 1 })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md text-on-surface">Segments</h2>
        <div className="flex gap-stack-md">
          <button
            onClick={addRow}
            className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
          >
            + Segment
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-label-caps uppercase text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full border-collapse text-left text-body-md">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <Th>#</Th>
              <Th>Nom</Th>
              <Th>Dist. (km)</Th>
              <Th>D+ (m)</Th>
              <Th>D− (m)</Th>
              <Th>Km-eff.</Th>
              <Th>Temps</Th>
              <Th>Cumul</Th>
              <Th>Passage</Th>
              <Th>Barrière</Th>
              <Th>Nuit</Th>
              <Th>Marge</Th>
              <Th>Remarques</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {segments.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-6 text-center text-on-surface-variant">
                  Aucun segment. Cliquez sur « + Segment » pour commencer.
                </td>
              </tr>
            )}
            {segments.map((seg, i) => {
              const row = computed.rows[i];
              const marge = row?.margeBarriereMin;
              return (
                <tr key={i} className="hover:bg-surface-container-lowest">
                  <td className="px-3 py-2 tabular-nums text-on-surface-variant">{i + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      value={seg.nom}
                      onChange={(e) => update(i, { nom: e.target.value })}
                      className={cellInput + ' min-w-[8rem]'}
                      placeholder="Point A → B"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput
                      value={seg.distanceKm}
                      step="0.1"
                      onChange={(v) => update(i, { distanceKm: v })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput value={seg.dplusM} onChange={(v) => update(i, { dplusM: v })} />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput value={seg.dmoinsM} onChange={(v) => update(i, { dmoinsM: v })} />
                  </td>
                  <Calc>{row?.kmEffort.toFixed(1)}</Calc>
                  <Calc>{formatMinutes(row?.tempsEtapeMin ?? 0)}</Calc>
                  <Calc>{formatMinutes(row?.tempsCumuleMin ?? 0)}</Calc>
                  <Calc>{row?.heurePassage}</Calc>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      value={seg.barriereHoraire ?? ''}
                      onChange={(e) => update(i, { barriereHoraire: e.target.value })}
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!seg.segmentDeNuit}
                      onChange={(e) => update(i, { segmentDeNuit: e.target.checked })}
                      className="h-5 w-5 accent-primary"
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {marge == null ? (
                      <span className="text-on-surface-variant">—</span>
                    ) : (
                      <span className={marge < 0 ? 'font-semibold text-error' : 'font-semibold text-primary'}>
                        {marge >= 0 ? '+' : ''}
                        {Math.round(marge)} min
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={seg.remarques ?? ''}
                      onChange={(e) => update(i, { remarques: e.target.value })}
                      className={cellInput + ' min-w-[8rem]'}
                      placeholder="Matériel, ravito…"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => removeRow(i)}
                      className="text-error hover:underline"
                      aria-label="Supprimer le segment"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {segments.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-outline-variant bg-surface-container-low font-semibold">
                <td className="px-3 py-3" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-3 tabular-nums">{computed.totalDistanceKm.toFixed(1)}</td>
                <td className="px-3 py-3 tabular-nums">{computed.totalDplusM}</td>
                <td className="px-3 py-3 tabular-nums">{computed.totalDmoinsM}</td>
                <td className="px-3 py-3 tabular-nums">{computed.totalKmEffort.toFixed(1)}</td>
                <td className="px-3 py-3 tabular-nums">{formatMinutes(computed.totalTempsMin)}</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 tabular-nums">{computed.heureArrivee}</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

const cellInput =
  'w-full rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-md focus:border-primary focus:outline-none';

function NumInput({
  value,
  step = '1',
  onChange,
}: {
  value: number;
  step?: string;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className={cellInput + ' w-20 tabular-nums'}
    />
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-label-caps uppercase text-on-surface-variant">
      {children}
    </th>
  );
}

function Calc({ children }: { children?: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap bg-surface-container-low/40 px-3 py-2 tabular-nums text-on-surface-variant">
      {children}
    </td>
  );
}
