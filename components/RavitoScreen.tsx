'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Course, ProduitGlobal, Segment, SegmentProduit } from '@/lib/types';
import { createProduct, deleteProduct, listenProducts, updateProduct } from '@/lib/products';
import { computeProduitSummary, computeSegments } from '@/lib/courseCalc';
import { segmentDisplayLabel } from '@/lib/segmentLabels';

type DraftProduit = {
  nom: string;
  unite: string;
  glucidesParUniteG: string;
  volumeLiquideMl: string;
};

const emptyDraft: DraftProduit = {
  nom: '',
  unite: 'unite',
  glucidesParUniteG: '0',
  volumeLiquideMl: '0',
};

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
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProduit>(emptyDraft);

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

  const createCatalogProduct = async () => {
    if (!draft.nom.trim()) return;
    setCatalogBusy(true);
    setError(null);
    try {
      await createProduct(course.ownerUid, {
        nom: draft.nom.trim(),
        unite: draft.unite.trim() || 'unite',
        glucidesParUniteG: Number(draft.glucidesParUniteG) || 0,
        volumeLiquideMl: Number(draft.volumeLiquideMl) || 0,
        actif: true,
      });
      setDraft(emptyDraft);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCatalogBusy(false);
    }
  };

  const patchCatalogProduct = async (id: string, patch: Partial<ProduitGlobal>) => {
    setCatalogBusy(true);
    setError(null);
    try {
      await updateProduct(id, patch);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCatalogBusy(false);
    }
  };

  const deleteCatalogProduct = async (productId: string) => {
    const used = segments.some((segment) => (segment.produits ?? []).some((item) => item.produitId === productId));
    if (used) {
      setError('Ce produit est encore utilise dans au moins un segment.');
      return;
    }

    setCatalogBusy(true);
    setError(null);
    try {
      await deleteProduct(productId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCatalogBusy(false);
    }
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
        <h3 className="text-body-lg font-semibold text-on-surface">Catalogue produits global (toutes les courses)</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-body-md">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <Th>Produit</Th>
                <Th>Unite</Th>
                <Th>Glucides/u (g)</Th>
                <Th>Liquide/u (ml)</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {catalog.map((product) => (
                <tr key={product.id}>
                  <td className="px-2 py-2">
                    <input
                      value={product.nom}
                      onChange={(e) => patchCatalogProduct(product.id, { nom: e.target.value })}
                      className={cellInput + ' min-w-[10rem]'}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={product.unite}
                      onChange={(e) => patchCatalogProduct(product.id, { unite: e.target.value })}
                      className={cellInput + ' w-28'}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput
                      value={product.glucidesParUniteG}
                      onChange={(v) => patchCatalogProduct(product.id, { glucidesParUniteG: v })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput
                      value={product.volumeLiquideMl}
                      onChange={(v) => patchCatalogProduct(product.id, { volumeLiquideMl: v })}
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => deleteCatalogProduct(product.id)}
                      disabled={catalogBusy}
                      className="text-error hover:underline disabled:opacity-50"
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}

              <tr className="bg-surface-container-low/40">
                <td className="px-2 py-2">
                  <input
                    placeholder="Nouveau produit"
                    value={draft.nom}
                    onChange={(e) => setDraft((prev) => ({ ...prev, nom: e.target.value }))}
                    className={cellInput + ' min-w-[10rem]'}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={draft.unite}
                    onChange={(e) => setDraft((prev) => ({ ...prev, unite: e.target.value }))}
                    className={cellInput + ' w-28'}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    value={draft.glucidesParUniteG}
                    onChange={(e) => setDraft((prev) => ({ ...prev, glucidesParUniteG: e.target.value }))}
                    className={cellInput + ' w-20 tabular-nums'}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    value={draft.volumeLiquideMl}
                    onChange={(e) => setDraft((prev) => ({ ...prev, volumeLiquideMl: e.target.value }))}
                    className={cellInput + ' w-20 tabular-nums'}
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={createCatalogProduct}
                    disabled={catalogBusy}
                    className="rounded-lg border-2 border-outline-variant px-3 py-1 text-label-caps uppercase hover:border-primary disabled:opacity-50"
                  >
                    + Ajout
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          return (
            <article
              key={segment.ordre}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-stack-sm">
                <div>
                  <h4 className="text-body-lg font-semibold text-on-surface">
                    {segmentDisplayLabel(segments, segmentIndex)}
                  </h4>
                  <p className="text-body-md text-on-surface-variant">
                    Passage estime: {row?.heurePassage || '-'} - Temps cumule: {row ? Math.round(row.tempsCumuleMin) : 0} min
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addProduitToSegment(segmentIndex)}
                  className="rounded-lg border-2 border-outline-variant px-3 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
                >
                  + Produit
                </button>
              </div>

              <div className="mt-stack-sm overflow-x-auto">
                <table className="w-full border-collapse text-left text-body-md">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low">
                      <Th>Produit</Th>
                      <Th>Qte</Th>
                      <Th>Glucides</Th>
                      <Th>Liquide</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {(segment.produits ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-on-surface-variant">
                          Aucun produit selectionne pour ce segment.
                        </td>
                      </tr>
                    )}

                    {(segment.produits ?? []).map((item, itemIndex) => {
                      const product = productById.get(item.produitId);
                      const glucides = (product?.glucidesParUniteG ?? 0) * item.quantite;
                      const liquide = (product?.volumeLiquideMl ?? 0) * item.quantite;
                      return (
                        <tr key={`${segment.ordre}-${itemIndex}`}>
                          <td className="px-2 py-2">
                            <select
                              value={item.produitId}
                              onChange={(e) =>
                                updateProduitFromSegment(segmentIndex, itemIndex, {
                                  produitId: e.target.value,
                                })
                              }
                              className={cellInput + ' min-w-[12rem]'}
                            >
                              {catalog.map((productOption) => (
                                <option key={productOption.id} value={productOption.id}>
                                  {productOption.nom}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <NumInput
                              value={item.quantite}
                              onChange={(value) =>
                                updateProduitFromSegment(segmentIndex, itemIndex, { quantite: value })
                              }
                            />
                          </td>
                          <td className="px-3 py-2 tabular-nums text-on-surface-variant">{Math.round(glucides)} g</td>
                          <td className="px-3 py-2 tabular-nums text-on-surface-variant">{Math.round(liquide)} ml</td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeProduitFromSegment(segmentIndex, itemIndex)}
                              className="text-error hover:underline"
                            >
                              x
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

const cellInput =
  'w-full rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-md focus:border-primary focus:outline-none';

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min="0"
      step="1"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className={cellInput + ' w-20 tabular-nums'}
    />
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
