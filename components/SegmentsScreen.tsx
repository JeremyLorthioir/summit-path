'use client';

import { useRef, useState } from 'react';
import type { Course, Segment } from '@/lib/types';
import { computeSegments, formatMinutes } from '@/lib/courseCalc';
import {
  inferSegmentInputModes,
  normalizeSegments,
  parseSegmentsCsv,
  type SegmentInputModes,
} from '@/lib/segmentImport';
import { segmentDisplayLabel } from '@/lib/segmentLabels';

const emptySegment = (ordre: number): Segment => ({
  ordre,
  nom: '',
  prises: '',
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
  const initialSegments = [...course.segments].sort((a, b) => a.ordre - b.ordre);
  const [modes, setModes] = useState<SegmentInputModes>(inferSegmentInputModes(initialSegments));
  const [segments, setSegments] = useState<Segment[]>(normalizeSegments(initialSegments, inferSegmentInputModes(initialSegments)));
  const [saving, setSaving] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Course virtuelle pour recalculer en direct selon l'édition courante.
  const computed = computeSegments({ ...course, segments });

  const update = (index: number, patch: Partial<Segment>) =>
    setSegments((prev) => normalizeSegments(prev.map((s, i) => (i === index ? { ...s, ...patch } : s)), modes));

  const addRow = () =>
    setSegments((prev) => normalizeSegments([...prev, emptySegment(prev.length + 1)], modes));

  const removeRow = (index: number) =>
    setSegments((prev) =>
      normalizeSegments(prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, ordre: i + 1 })), modes)
    );

  const switchDistanceMode = (distance: SegmentInputModes['distance']) => {
    const nextModes: SegmentInputModes = { ...modes, distance };
    setModes(nextModes);
    setSegments((prev) => normalizeSegments(prev, nextModes));
  };

  const switchDeniveleMode = (denivele: SegmentInputModes['denivele']) => {
    const nextModes: SegmentInputModes = { ...modes, denivele };
    setModes(nextModes);
    setSegments((prev) => normalizeSegments(prev, nextModes));
  };

  const openCsvPicker = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleCsvPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = parseSegmentsCsv(content);
      setModes(parsed.modes);
      setSegments(parsed.segments);
      setImportError(null);
      setImportInfo(`${parsed.segments.length} segments importes depuis ${file.name}.`);
    } catch (error) {
      setImportInfo(null);
      setImportError((error as Error).message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(normalizeSegments(segments, modes).map((s, i) => ({ ...s, ordre: i + 1 })));
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
            onClick={openCsvPicker}
            className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
          >
            Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvPick}
          />
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

      {(importError || importInfo) && (
        <div
          className={`rounded-lg px-4 py-3 text-body-md ${
            importError
              ? 'bg-error-container text-on-error-container'
              : 'bg-primary-container/20 text-on-surface'
          }`}
        >
          {importError ?? importInfo}
        </div>
      )}

      <div className="grid gap-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-label-caps uppercase text-on-surface-variant">Distance</p>
          <div className="flex gap-2">
            <ModeButton
              active={modes.distance === 'segment'}
              onClick={() => switchDistanceMode('segment')}
              label="Par segment"
            />
            <ModeButton
              active={modes.distance === 'cumul'}
              onClick={() => switchDistanceMode('cumul')}
              label="Depuis depart"
            />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-label-caps uppercase text-on-surface-variant">Denivele (D+ / D-)</p>
          <div className="flex gap-2">
            <ModeButton
              active={modes.denivele === 'segment'}
              onClick={() => switchDeniveleMode('segment')}
              label="Par segment"
            />
            <ModeButton
              active={modes.denivele === 'cumul'}
              onClick={() => switchDeniveleMode('cumul')}
              label="Depuis depart"
            />
          </div>
        </div>
        <p className="md:col-span-2 text-body-md text-on-surface-variant">
          Import CSV accepte des colonnes usuelles Excel: nom, distanceKm ou distanceCumulee, dplusM ou dplusCumule, dmoinsM ou dmoinsCumule, barriere, nuit.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full border-collapse text-left text-body-md">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <Th>#</Th>
              <Th>Segment (auto)</Th>
              <Th>Prochain point</Th>
              <Th>{modes.distance === 'cumul' ? 'Dist. depart (km)' : 'Dist. segment (km)'}</Th>
              <Th>{modes.denivele === 'cumul' ? 'D+ depart (m)' : 'D+ segment (m)'}</Th>
              <Th>{modes.denivele === 'cumul' ? 'D- depart (m)' : 'D- segment (m)'}</Th>
              <Th>Km-eff.</Th>
              <Th>Temps</Th>
              <Th>Cumul</Th>
              <Th>Passage</Th>
              <Th>Barrière</Th>
              <Th>Nuit</Th>
              <Th>Marge</Th>
              <Th>Prises</Th>
              <Th>Remarques</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {segments.length === 0 && (
              <tr>
                <td colSpan={16} className="px-4 py-6 text-center text-on-surface-variant">
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
                  <td className="whitespace-nowrap bg-surface-container-low/40 px-3 py-2 text-on-surface-variant">
                    {segmentDisplayLabel(segments, i)}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={seg.nom}
                      onChange={(e) => update(i, { nom: e.target.value })}
                      className={cellInput + ' min-w-[8rem]'}
                      placeholder="Point A"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput
                      value={modes.distance === 'cumul' ? seg.distanceDepuisDepartKm ?? 0 : seg.distanceKm}
                      step="0.1"
                      onChange={(v) =>
                        update(
                          i,
                          modes.distance === 'cumul'
                            ? { distanceDepuisDepartKm: v, distanceSaisie: 'cumul' }
                            : { distanceKm: v, distanceSaisie: 'segment' }
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput
                      value={modes.denivele === 'cumul' ? seg.dplusCumuleM ?? 0 : seg.dplusM}
                      onChange={(v) =>
                        update(
                          i,
                          modes.denivele === 'cumul'
                            ? { dplusCumuleM: v, deniveleSaisie: 'cumul' }
                            : { dplusM: v, deniveleSaisie: 'segment' }
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput
                      value={modes.denivele === 'cumul' ? seg.dmoinsCumuleM ?? 0 : seg.dmoinsM}
                      onChange={(v) =>
                        update(
                          i,
                          modes.denivele === 'cumul'
                            ? { dmoinsCumuleM: v, deniveleSaisie: 'cumul' }
                            : { dmoinsM: v, deniveleSaisie: 'segment' }
                        )
                      }
                    />
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
                        {formatSignedMinutes(marge)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={seg.prises ?? ''}
                      onChange={(e) => update(i, { prises: e.target.value })}
                      className={cellInput + ' min-w-[8rem]'}
                      placeholder="Gel, eau, sel..."
                    />
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
                <td className="px-3 py-3" colSpan={3}>
                  Total
                </td>
                <td className="px-3 py-3 tabular-nums">{computed.totalDistanceKm.toFixed(1)}</td>
                <td className="px-3 py-3 tabular-nums">{computed.totalDplusM}</td>
                <td className="px-3 py-3 tabular-nums">{computed.totalDmoinsM}</td>
                <td className="px-3 py-3 tabular-nums">{computed.totalKmEffort.toFixed(1)}</td>
                <td className="px-3 py-3 tabular-nums">{formatMinutes(computed.totalTempsMin)}</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 tabular-nums">{computed.heureArrivee}</td>
                <td colSpan={6} />
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

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-label-caps uppercase transition-colors ${
        active
          ? 'bg-primary text-on-primary'
          : 'border border-outline-variant text-on-surface hover:border-primary'
      }`}
    >
      {label}
    </button>
  );
}

function Calc({ children }: { children?: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap bg-surface-container-low/40 px-3 py-2 tabular-nums text-on-surface-variant">
      {children}
    </td>
  );
}

function formatSignedMinutes(minutes: number): string {
  const absValue = formatMinutes(Math.abs(minutes));
  return `${minutes >= 0 ? '+' : '-'}${absValue}`;
}
