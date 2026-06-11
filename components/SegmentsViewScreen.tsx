'use client';

import type { Course } from '@/lib/types';
import { computeSegments, formatMinutes } from '@/lib/courseCalc';
import { segmentDisplayLabel } from '@/lib/segmentLabels';

export default function SegmentsViewScreen({ course }: { course: Course }) {
  const segments = [...course.segments].sort((a, b) => a.ordre - b.ordre);
  const computed = computeSegments({ ...course, segments });

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md text-on-surface">Visualisation des segments</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full border-collapse text-left text-body-md">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <Th>#</Th>
              <Th>Segment</Th>
              <Th>Dist. (km)</Th>
              <Th>D+ (m)</Th>
              <Th>D- (m)</Th>
              <Th>Km-eff.</Th>
              <Th>Temps</Th>
              <Th>Cumul</Th>
              <Th>Passage</Th>
              <Th>Barriere</Th>
              <Th>Nuit</Th>
              <Th>Marge</Th>
              <Th>Prises</Th>
              <Th>Remarques</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {segments.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-6 text-center text-on-surface-variant">
                  Aucun segment enregistre.
                </td>
              </tr>
            )}
            {segments.map((segment, index) => {
              const row = computed.rows[index];
              const marge = row?.margeBarriereMin;
              return (
                <tr key={segment.ordre} className="hover:bg-surface-container-lowest">
                  <td className="px-3 py-2 tabular-nums text-on-surface-variant">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-on-surface">{segmentDisplayLabel(segments, index)}</td>
                  <td className="px-3 py-2 tabular-nums">{segment.distanceKm.toFixed(1)}</td>
                  <td className="px-3 py-2 tabular-nums">{segment.dplusM}</td>
                  <td className="px-3 py-2 tabular-nums">{segment.dmoinsM}</td>
                  <td className="px-3 py-2 tabular-nums">{row?.kmEffort.toFixed(1)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMinutes(row?.tempsEtapeMin ?? 0)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMinutes(row?.tempsCumuleMin ?? 0)}</td>
                  <td className="px-3 py-2 tabular-nums">{row?.heurePassage ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{segment.barriereHoraire || '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{segment.segmentDeNuit ? 'Oui' : 'Non'}</td>
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
                  <td className="px-3 py-2 text-on-surface-variant">{segment.prises || '—'}</td>
                  <td className="px-3 py-2 text-on-surface-variant">{segment.remarques || '—'}</td>
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-label-caps uppercase text-on-surface-variant">
      {children}
    </th>
  );
}
