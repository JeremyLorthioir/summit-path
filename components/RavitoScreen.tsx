'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Course, ProduitGlobal, Segment, SegmentProduit } from '@/lib/types';
import { listenProducts } from '@/lib/products';
import { computeProduitSummary, computeSegments, formatMinutes } from '@/lib/courseCalc';
import { segmentDisplayLabel } from '@/lib/segmentLabels';
import {
  besoinsTheoriquesSegment,
  LIQUIDE_CIBLE_ML_PAR_HEURE,
  pctCouverture,
  pctCouvertureClass,
  productChipClass,
} from '@/lib/displayHelpers';

export default function RavitoScreen({
  course,
  onSave,
}: {
  course: Course;
  onSave: (segments: Segment[]) => Promise<void>;
}) {
  const initialSegments = [...course.segments]
    .sort((a, b) => a.ordre - b.ordre)
    .map((segment) => ({ ...segment, produits: segment.produits ?? [] }));

  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [catalog, setCatalog] = useState<ProduitGlobal[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenProducts(
      course.ownerUid,
      (products) => setCatalog(products.filter((product) => product.actif !== false)),
      (err) => setError(err.message)
    );
    return () => unsubscribe();
  }, [course.ownerUid]);

  const computedSegments = computeSegments({ ...course, segments });
  const summary = useMemo(() => computeProduitSummary(segments, catalog), [segments, catalog]);
  const dureeHeures = computedSegments.totalTempsMin / 60;
  const objectifCourseG = course.objectifGlucidesParHeure * dureeHeures;

  const saveCourseSegments = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(segments.map((segment, index) => ({ ...segment, ordre: index + 1 })));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateSegmentProduits = (segmentIndex: number, updater: (items: SegmentProduit[]) => SegmentProduit[]) => {
    setSegments((prev) =>
      prev.map((segment, index) =>
        index === segmentIndex
          ? {
              ...segment,
              produits: updater(segment.produits ?? []),
            }
          : segment
      )
    );
  };

  const addProduitToSegment = (segmentIndex: number) => {
    const fallback = catalog[0]?.id;
    if (!fallback) {
      setError('Ajoutez d\'abord un produit dans le catalogue global.');
      return;
    }

    updateSegmentProduits(segmentIndex, (items) => [...items, { produitId: fallback, quantite: 1 }]);
  };

  const removeProduitFromSegment = (segmentIndex: number, itemIndex: number) => {
    updateSegmentProduits(segmentIndex, (items) => items.filter((_, index) => index !== itemIndex));
  };

  const updateProduitFromSegment = (
    segmentIndex: number,
    itemIndex: number,
    patch: Partial<SegmentProduit>
  ) => {
    updateSegmentProduits(segmentIndex, (items) =>
      items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              ...patch,
              quantite: Math.max(0, Number((patch.quantite ?? item.quantite) || 0)),
            }
          : item
      )
    );
  };

  const productById = new Map(catalog.map((product) => [product.id, product]));

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md text-on-surface">Ravitaillement (segments = ravitos)</h2>
        <button
          onClick={saveCourseSegments}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-label-caps uppercase text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg space-y-stack-md">
        <div className="flex flex-wrap items-center justify-between gap-stack-md">
          <div>
            <h3 className="text-body-lg font-semibold text-on-surface">Catalogue produits global</h3>
            <p className="text-body-md text-on-surface-variant">
              Le catalogue est mutualise entre toutes les courses.
            </p>
          </div>
          <Link
            href="/products"
            className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
          >
            Gerer le catalogue
          </Link>
        </div>
        <p className="text-body-md text-on-surface-variant">
          Produits disponibles: <span className="font-semibold text-on-surface">{catalog.length}</span>
        </p>
      </section>

      <section className="space-y-stack-md">
        <h3 className="text-body-lg font-semibold text-on-surface">Selection produits par segment</h3>
        {segments.length === 0 && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-on-surface-variant">
            Aucun segment disponible. Ajoutez des segments dans l'onglet Segments.
          </div>
        )}

        {segments.map((segment, segmentIndex) => {
          const row = computedSegments.rows[segmentIndex];
          const dureeMin = row?.tempsEtapeMin ?? 0;
          const besoins = besoinsTheoriquesSegment(dureeMin, course.objectifGlucidesParHeure);
          const items = segment.produits ?? [];
          const totalGlucides = items.reduce((acc, item) => {
            const product = productById.get(item.produitId);
            return acc + (product?.glucidesParUniteG ?? 0) * (item.quantite || 0);
          }, 0);
          const totalLiquide = items.reduce((acc, item) => {
            const product = productById.get(item.produitId);
            return acc + (product?.volumeLiquideMl ?? 0) * (item.quantite || 0);
          }, 0);
          const pctGlu = pctCouverture(totalGlucides, besoins.glucidesG);
          const pctLiq = pctCouverture(totalLiquide, besoins.liquideMl);

          return (
            <article
              key={segment.ordre}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md"
            >
              <header className="flex flex-wrap items-start justify-between gap-stack-sm">
                <div className="min-w-0 flex-1">
                  <h4 className="text-body-lg font-semibold text-on-surface">
                    {segmentDisplayLabel(segments, segmentIndex)}
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-body-md text-on-surface-variant">
                    <span>
                      <span className="font-semibold text-on-surface">{segment.distanceKm.toFixed(1)}</span> km
                    </span>
                    <span>
                      D+ <span className="font-semibold text-on-surface">{segment.dplusM}</span> m
                    </span>
                    <span>
                      Durée <span className="font-semibold text-on-surface">{formatMinutes(dureeMin)}</span>
                    </span>
                    <span>
                      Passage <span className="font-semibold text-on-surface">{row?.heurePassage || '-'}</span>
                    </span>
                    <span>
                      Cumul <span className="font-semibold text-on-surface">{formatMinutes(row?.tempsCumuleMin ?? 0)}</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addProduitToSegment(segmentIndex)}
                  disabled={catalog.length === 0}
                  className="rounded-lg border-2 border-outline-variant px-3 py-2 text-label-caps uppercase text-on-surface hover:border-primary disabled:opacity-50"
                >
                  + Produit
                </button>
              </header>

              <div className="mt-stack-sm grid grid-cols-1 gap-2 rounded-lg bg-surface-container-low/60 p-3 text-body-md md:grid-cols-2">
                <NeedRow
                  label="Glucides"
                  actuel={`${Math.round(totalGlucides)} g`}
                  cible={`${Math.round(besoins.glucidesG)} g`}
                  pct={pctGlu}
                  hint={`Cible : ${course.objectifGlucidesParHeure} g/h`}
                />
                <NeedRow
                  label="Liquide"
                  actuel={`${Math.round(totalLiquide)} ml`}
                  cible={`${Math.round(besoins.liquideMl)} ml`}
                  pct={pctLiq}
                  hint={`Cible : ${LIQUIDE_CIBLE_ML_PAR_HEURE} ml/h`}
                />
              </div>

              <div className="mt-stack-sm">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-outline-variant px-3 py-3 text-body-md text-on-surface-variant">
                    Aucun produit sélectionné pour ce segment.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item, itemIndex) => (
                      <ProductChip
                        key={`${segment.ordre}-${itemIndex}`}
                        item={item}
                        catalog={catalog}
                        product={productById.get(item.produitId)}
                        onChangeProduct={(produitId) =>
                          updateProduitFromSegment(segmentIndex, itemIndex, { produitId })
                        }
                        onChangeQuantite={(quantite) =>
                          updateProduitFromSegment(segmentIndex, itemIndex, { quantite })
                        }
                        onRemove={() => removeProduitFromSegment(segmentIndex, itemIndex)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg space-y-stack-md">
        <h3 className="text-body-lg font-semibold text-on-surface">Condense ravitaillement</h3>

        <div className="flex flex-wrap gap-stack-lg">
          <Kpi label="Glucides plan total" value={`${Math.round(summary.totalGlucidesG)} g`} />
          <Kpi label="Liquide plan total" value={`${Math.round(summary.totalLiquideMl)} ml`} />
          <Kpi label="Objectif course" value={`${Math.round(objectifCourseG)} g`} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-body-md">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <Th>Produit</Th>
                <Th>Qte totale</Th>
                <Th>Segments</Th>
                <Th>Glucides total</Th>
                <Th>Liquide total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {summary.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-on-surface-variant">
                    Aucune prise encore planifiee.
                  </td>
                </tr>
              )}
              {summary.rows.map((row) => (
                <tr key={row.produitId}>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-on-surface">{row.nom}</span>
                    <span className="ml-2 text-on-surface-variant">({row.unite})</span>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.totalQuantite}</td>
                  <td className="px-3 py-2 tabular-nums">{row.segmentsTouches}</td>
                  <td className="px-3 py-2 tabular-nums">{Math.round(row.totalGlucidesG)} g</td>
                  <td className="px-3 py-2 tabular-nums">{Math.round(row.totalLiquideMl)} ml</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ProductChip({
  item,
  product,
  catalog,
  onChangeProduct,
  onChangeQuantite,
  onRemove,
}: {
  item: SegmentProduit;
  product: ProduitGlobal | undefined;
  catalog: ProduitGlobal[];
  onChangeProduct: (produitId: string) => void;
  onChangeQuantite: (quantite: number) => void;
  onRemove: () => void;
}) {
  const color = productChipClass(product?.unite);
  const macros: string[] = [];
  if (product?.glucidesParUniteG) macros.push(`${product.glucidesParUniteG}g gluc.`);
  if (product?.volumeLiquideMl) macros.push(`${product.volumeLiquideMl}ml`);

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-body-md shadow-sm ${color}`}
    >
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChangeQuantite(Math.max(0, (item.quantite || 0) - 1))}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-sm font-bold leading-none hover:bg-white"
          aria-label="Diminuer la quantité"
        >
          −
        </button>
        <span className="min-w-[1.2rem] text-center text-sm font-semibold tabular-nums">{item.quantite}</span>
        <button
          type="button"
          onClick={() => onChangeQuantite((item.quantite || 0) + 1)}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-sm font-bold leading-none hover:bg-white"
          aria-label="Augmenter la quantité"
        >
          +
        </button>
      </div>
      <select
        value={item.produitId}
        onChange={(e) => onChangeProduct(e.target.value)}
        className="max-w-[8.5rem] truncate rounded bg-transparent px-0.5 py-0 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {catalog.length === 0 && <option value="">Aucun produit</option>}
        {catalog.map((option) => (
          <option key={option.id} value={option.id}>
            {option.nom}
          </option>
        ))}
      </select>
      {macros.length > 0 && (
        <span className="hidden text-label-caps uppercase opacity-70 lg:inline">
          {macros.join(' · ')}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-white/50 text-[10px] font-bold leading-none hover:bg-white"
        aria-label="Retirer le produit"
      >
        ×
      </button>
    </div>
  );
}

function NeedRow({
  label,
  actuel,
  cible,
  pct,
  hint,
}: {
  label: string;
  actuel: string;
  cible: string;
  pct: number;
  hint: string;
}) {
  const barPct = Math.min(100, Math.max(0, pct));
  const barColor = pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-label-caps uppercase text-on-surface-variant">{label}</span>
        <span className={`tabular-nums ${pctCouvertureClass(pct)}`}>
          <span className="font-semibold">{actuel}</span>
          <span className="text-on-surface-variant"> / {cible}</span>
          <span className="ml-2 font-semibold">{pct}%</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-outline-variant/40">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
      </div>
      <span className="text-label-caps uppercase text-on-surface-variant/80">{hint}</span>
    </div>
  );
}

function Th({ children }: { children?: any }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-label-caps uppercase text-on-surface-variant">
      {children}
    </th>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className="text-headline-md font-semibold tabular-nums text-on-surface">{value}</span>
    </div>
  );
}
