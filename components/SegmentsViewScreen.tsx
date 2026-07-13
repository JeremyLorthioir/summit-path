'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Course, ProduitGlobal, SegmentProduit } from '@/lib/types';
import { computeSegments, formatMinutes } from '@/lib/courseCalc';
import { segmentDisplayLabel } from '@/lib/segmentLabels';
import { listenProducts } from '@/lib/products';
import {
  getMargeLevel,
  margeBadgeClass,
  productChipClass,
  productTypologyLabel,
} from '@/lib/displayHelpers';

export default function SegmentsViewScreen({ course }: { course: Course }) {
  const segments = [...course.segments].sort((a, b) => a.ordre - b.ordre);
  const computed = computeSegments({ ...course, segments });
  const [catalog, setCatalog] = useState<ProduitGlobal[]>([]);
  const paceMinPerKmEff = computed.totalKmEffort > 0 ? computed.totalTempsMin / computed.totalKmEffort : 0;
  const delayedRows = computed.rows.filter((row) => row.margeBarriereMin != null && row.margeBarriereMin < 0);
  const firstDelayed = delayedRows[0];

  useEffect(() => {
    if (!course.ownerUid) return;
    const unsubscribe = listenProducts(course.ownerUid, (rows) => setCatalog(rows));
    return () => unsubscribe();
  }, [course.ownerUid]);

  const catalogMap = useMemo(() => {
    return new Map(catalog.map((product: ProduitGlobal) => [product.id, product]));
  }, [catalog]);

  return (
    <div className="space-y-stack-lg print:space-y-4">
      <section className="rounded-xl border border-outline-variant bg-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-stack-lg">
          <div>
            <h2 className="text-headline-lg text-primary">{course.nom || 'Course'}</h2>
            <p className="text-body-md text-on-surface-variant">Planification segments</p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary print:hidden"
          >
            Imprimer la fiche recap
          </button>

          <div className="grid grid-cols-2 gap-stack-md md:grid-cols-4">
            <KpiCard label="Distance totale" value={`${computed.totalDistanceKm.toFixed(1)} km`} />
            <KpiCard label="D+ total" value={`${computed.totalDplusM.toLocaleString('fr-FR')} m`} tone="tertiary" />
            <KpiCard label="Temps estime" value={formatDurationClock(computed.totalTempsMin)} />
            <KpiCard label="Allure estimee" value={`${formatPace(paceMinPerKmEff)} min/km-eff`} />
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="grid grid-cols-[1.9fr_0.7fr_0.7fr_0.7fr_0.9fr_0.9fr_0.9fr_1.1fr_0.8fr_1.2fr_1fr_1fr] border-b border-outline-variant bg-surface-container-highest text-label-caps uppercase text-on-secondary-fixed-variant">
          <HeaderCell>Segment</HeaderCell>
          <HeaderCell align="center">Dist (km)</HeaderCell>
          <HeaderCell align="center">D+ (m)</HeaderCell>
          <HeaderCell align="center">D- (m)</HeaderCell>
          <HeaderCell align="center">km-eff</HeaderCell>
          <HeaderCell align="center">Temps</HeaderCell>
          <HeaderCell align="center">Cumule</HeaderCell>
          <HeaderCell align="center">Passage</HeaderCell>
          <HeaderCell align="center">Barriere</HeaderCell>
          <HeaderCell>Produits</HeaderCell>
          <HeaderCell>Remarques</HeaderCell>
          <HeaderCell align="center">Marge</HeaderCell>
        </div>

        <div className="max-h-[62vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {segments.length === 0 && (
            <div className="px-4 py-8 text-center text-body-md text-on-surface-variant">
              Aucun segment enregistre.
            </div>
          )}

          {segments.map((segment, index) => {
            const row = computed.rows[index];
            const marge = row?.margeBarriereMin;
            const isBehind = (marge ?? 0) < 0;

            return (
              <div
                key={segment.ordre}
                className="grid grid-cols-[1.9fr_0.7fr_0.7fr_0.7fr_0.9fr_0.9fr_0.9fr_1.1fr_0.8fr_1.2fr_1fr_1fr] border-b border-outline-variant/70 text-body-md hover:bg-surface-container"
              >
                <Cell className="font-semibold text-on-surface">
                  <div className="flex items-center gap-2">
                    <span>{segmentDisplayLabel(segments, index)}</span>
                    {segment.segmentDeNuit && (
                      <span className="rounded-full bg-secondary-container px-2 py-0.5 text-label-caps uppercase text-on-surface">
                        Nuit
                      </span>
                    )}
                  </div>
                </Cell>
                <Cell align="center" className="tabular-nums">{segment.distanceKm.toFixed(1)}</Cell>
                <Cell align="center" className="tabular-nums">{segment.dplusM}</Cell>
                <Cell align="center" className="tabular-nums">{segment.dmoinsM}</Cell>
                <Cell align="center" className="tabular-nums text-on-surface-variant">{row?.kmEffort.toFixed(1)}</Cell>
                <Cell align="center" className="tabular-nums">{formatMinutes(row?.tempsEtapeMin ?? 0)}</Cell>
                <Cell align="center" className="tabular-nums">{formatMinutes(row?.tempsCumuleMin ?? 0)}</Cell>
                <Cell align="center" className="tabular-nums">{row?.heurePassage || '-'}</Cell>
                <Cell align="center" className="tabular-nums">{segment.barriereHoraire || '-'}</Cell>
                <Cell className="text-on-surface-variant">
                  <SegmentProductsPills items={segment.produits} catalogMap={catalogMap} />
                </Cell>
                <Cell className="text-on-surface-variant">{segment.remarques || '-'}</Cell>
                <Cell align="center" className="tabular-nums">
                  {marge == null ? (
                    <span className="text-on-surface-variant">-</span>
                  ) : (
                    (() => {
                      const level = getMargeLevel(marge);
                      return (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-label-caps ${margeBadgeClass(level)}`}>
                          {isBehind ? '- ' : '+ '}
                          {formatMinutes(Math.abs(marge))}
                        </span>
                      );
                    })()
                  )}
                </Cell>
              </div>
            );
          })}
        </div>

        {segments.length > 0 && (
          <div className="grid grid-cols-[1.9fr_0.7fr_0.7fr_0.7fr_0.9fr_0.9fr_0.9fr_1.1fr_0.8fr_1.2fr_1fr_1fr] border-t-2 border-primary bg-secondary-fixed text-on-secondary-fixed">
            <Cell className="font-bold">TOTAL COURSE</Cell>
            <Cell align="center" className="tabular-nums font-semibold">{computed.totalDistanceKm.toFixed(1)}</Cell>
            <Cell align="center" className="tabular-nums font-semibold">{computed.totalDplusM.toLocaleString('fr-FR')}</Cell>
            <Cell align="center" className="tabular-nums font-semibold">{computed.totalDmoinsM.toLocaleString('fr-FR')}</Cell>
            <Cell align="center" className="tabular-nums font-semibold">{computed.totalKmEffort.toFixed(1)}</Cell>
            <Cell align="center" className="tabular-nums font-semibold">{formatDurationClock(computed.totalTempsMin)}</Cell>
            <Cell align="center" className="tabular-nums font-semibold">{formatDurationClock(computed.totalTempsMin)}</Cell>
            <Cell align="center" className="tabular-nums font-semibold">{computed.heureArrivee}</Cell>
            <Cell />
            <Cell />
            <Cell className="text-label-caps uppercase text-on-secondary-fixed-variant">Auto calcule</Cell>
            <Cell />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-outline bg-inverse-surface px-5 py-3 text-inverse-on-surface shadow-sm print:hidden">
        <div className="flex items-center gap-stack-md">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-fixed-dim" />
          <span className="text-label-caps uppercase">Planning actif</span>
          {firstDelayed && (
            <span className="text-body-md text-inverse-on-surface">
              Alerte: {firstDelayed.segment.nom || 'Segment'} est derriere la barriere
            </span>
          )}
        </div>
        <span className="text-label-caps uppercase text-inverse-on-surface/80">
          {delayedRows.length > 0 ? `${delayedRows.length} segment(s) en retard` : 'Toutes les barrieres sont ok'}
        </span>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'tertiary';
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <span className="block text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className={`block text-headline-md ${tone === 'tertiary' ? 'text-tertiary' : 'text-on-surface'}`}>
        {value}
      </span>
    </div>
  );
}

function HeaderCell({ children, align = 'left' }: { children: any; align?: 'left' | 'center' }) {
  return <div className={`px-3 py-3 ${align === 'center' ? 'text-center' : ''}`}>{children}</div>;
}

function Cell({
  children,
  align = 'left',
  className = '',
}: {
  children?: any;
  align?: 'left' | 'center';
  className?: string;
}) {
  return <div className={`px-3 py-3 ${align === 'center' ? 'text-center' : ''} ${className}`}>{children}</div>;
}

function formatDurationClock(minutes: number): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatPace(minPerKm: number): string {
  if (!isFinite(minPerKm) || minPerKm <= 0) return '0:00';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SegmentProductsPills({
  items,
  catalogMap,
}: {
  items: SegmentProduit[] | undefined;
  catalogMap: Map<string, ProduitGlobal>;
}) {
  const filtered = (items ?? []).filter((item) => item.quantite > 0);
  if (filtered.length === 0) {
    return <span className="text-on-surface-variant">Aucun produit</span>;
  }

  const byTypology = new Map<string, { qty: number; unite?: string }>();
  for (const item of filtered) {
    const product = catalogMap.get(item.produitId);
    const unite = product?.unite;
    const nom = product?.nom;
    const typology = productTypologyLabel(unite, nom);
    const existing = byTypology.get(typology);
    byTypology.set(typology, {
      qty: (existing?.qty ?? 0) + item.quantite,
      unite: existing?.unite ?? unite,
    });
  }

  const groups = Array.from(byTypology.entries())
    .map(([typology, data]) => ({ typology, ...data }))
    .sort((a, b) => b.qty - a.qty);

  const visible = groups.slice(0, 4);

  return (
    <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
      {visible.map((group, index) => {
        return (
          <span
            key={`${group.typology}-${index}`}
            className={`inline-flex max-w-[8.5rem] items-center gap-1 overflow-hidden text-ellipsis rounded-full border px-1.5 py-0.5 text-label-caps ${productChipClass(
              group.unite,
              group.typology
            )}`}
            title={`${group.qty} x ${group.typology}`}
          >
            <span className="truncate font-semibold tabular-nums leading-none">{group.qty}x {group.typology}</span>
          </span>
        );
      })}
    </div>
  );
}
