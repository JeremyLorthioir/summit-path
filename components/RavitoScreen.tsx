'use client';

import { useState } from 'react';
import type { Course, RavitoItem, StockProduit } from '@/lib/types';
import { groupRavito, computeStock, computeSegments, glucidesOK } from '@/lib/courseCalc';

const emptyRavito = (): RavitoItem => ({
  repere: '',
  produit: '',
  quantite: 1,
  glucidesUnitaireG: 0,
});

const emptyStock = (nbRavitos: number): StockProduit => ({
  produit: '',
  quantiteInitiale: 0,
  parRavito: Array(nbRavitos).fill(0),
});

/**
 * Écran Ravitaillement : plan de prise (par repère) + synthèse stock par produit.
 */
export default function RavitoScreen({
  course,
  onSave,
}: {
  course: Course;
  onSave: (data: { planRavito: RavitoItem[]; stock: StockProduit[] }) => Promise<void>;
}) {
  const [planRavito, setPlanRavito] = useState<RavitoItem[]>(course.planRavito ?? []);
  const initialNbRavitos = Math.max(
    1,
    ...course.stock.map((s) => s.parRavito.length),
    1
  );
  const [stock, setStock] = useState<StockProduit[]>(course.stock ?? []);
  const [nbRavitos, setNbRavitos] = useState<number>(initialNbRavitos);
  const [saving, setSaving] = useState(false);

  const { totalTempsMin } = computeSegments(course);
  const dureeHeures = totalTempsMin / 60;
  const groups = groupRavito(planRavito);
  const totalGlucides = groups.reduce((a, g) => a + g.totalGlucides, 0);
  const stockRows = computeStock(stock);

  // Cible globale : objectif g/h × durée estimée de course.
  const cibleGlobale = course.objectifGlucidesParHeure * dureeHeures;
  const cibleAtteinte = dureeHeures > 0
    ? glucidesOK(totalGlucides, course.objectifGlucidesParHeure, totalTempsMin)
    : true;

  // --- Plan de prise ---
  const updatePlan = (i: number, patch: Partial<RavitoItem>) =>
    setPlanRavito((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addPlan = () => setPlanRavito((prev) => [...prev, emptyRavito()]);
  const removePlan = (i: number) => setPlanRavito((prev) => prev.filter((_, idx) => idx !== i));

  // --- Stock ---
  const updateStock = (i: number, patch: Partial<StockProduit>) =>
    setStock((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateStockRavito = (i: number, r: number, value: number) =>
    setStock((prev) =>
      prev.map((s, idx) => {
        if (idx !== i) return s;
        const parRavito = [...s.parRavito];
        while (parRavito.length < nbRavitos) parRavito.push(0);
        parRavito[r] = value;
        return { ...s, parRavito };
      })
    );
  const addStock = () => setStock((prev) => [...prev, emptyStock(nbRavitos)]);
  const removeStock = (i: number) => setStock((prev) => prev.filter((_, idx) => idx !== i));
  const addRavitoColumn = () => setNbRavitos((n) => n + 1);
  const removeRavitoColumn = () => {
    if (nbRavitos <= 1) return;
    setNbRavitos((n) => n - 1);
    setStock((prev) => prev.map((s) => ({ ...s, parRavito: s.parRavito.slice(0, nbRavitos - 1) })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizedStock = stock.map((s) => {
        const parRavito = [...s.parRavito];
        while (parRavito.length < nbRavitos) parRavito.push(0);
        return { ...s, parRavito: parRavito.slice(0, nbRavitos) };
      });
      await onSave({ planRavito, stock: normalizedStock });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md text-on-surface">Ravitaillement</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-label-caps uppercase text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Bandeau objectif glucidique */}
      <div
        className={`rounded-xl border p-stack-lg ${
          cibleAtteinte
            ? 'border-outline-variant bg-surface-container-lowest'
            : 'border-error bg-error-container'
        }`}
      >
        <div className="flex flex-wrap items-end gap-stack-lg">
          <Stat label="Objectif" value={`${course.objectifGlucidesParHeure} g/h`} />
          <Stat label="Cible estimée" value={`${Math.round(cibleGlobale)} g`} />
          <Stat label="Plan total" value={`${Math.round(totalGlucides)} g`} />
          {!cibleAtteinte && (
            <span className="text-body-md font-semibold text-on-error-container">
              ⚠️ Plan sous l’objectif glucidique (80 % min).
            </span>
          )}
        </div>
      </div>

      {/* Vue 1 : plan de prise */}
      <section className="space-y-stack-md">
        <div className="flex items-center justify-between">
          <h3 className="text-body-lg font-semibold text-on-surface">Plan de prise</h3>
          <button
            onClick={addPlan}
            className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
          >
            + Prise
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full border-collapse text-left text-body-md">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <Th>Repère</Th>
                <Th>Produit</Th>
                <Th>Qté</Th>
                <Th>Glucides/u (g)</Th>
                <Th>Total (g)</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {planRavito.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-on-surface-variant">
                    Aucune prise planifiée.
                  </td>
                </tr>
              )}
              {planRavito.map((item, i) => (
                <tr key={i}>
                  <td className="px-2 py-2">
                    <input
                      value={item.repere}
                      onChange={(e) => updatePlan(i, { repere: e.target.value })}
                      className={cellInput + ' min-w-[6rem]'}
                      placeholder="H+1, Ravito 1…"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={item.produit}
                      onChange={(e) => updatePlan(i, { produit: e.target.value })}
                      className={cellInput + ' min-w-[8rem]'}
                      placeholder="Gel, barre…"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput value={item.quantite} onChange={(v) => updatePlan(i, { quantite: v })} />
                  </td>
                  <td className="px-2 py-2">
                    <NumInput
                      value={item.glucidesUnitaireG}
                      onChange={(v) => updatePlan(i, { glucidesUnitaireG: v })}
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums text-on-surface-variant">
                    {item.quantite * item.glucidesUnitaireG}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => removePlan(i)}
                      className="text-error hover:underline"
                      aria-label="Supprimer la prise"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux par repère */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-stack-md">
            {groups.map((g) => (
              <div
                key={g.repere || '∅'}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2"
              >
                <span className="block text-label-caps uppercase text-on-surface-variant">
                  {g.repere || 'Sans repère'}
                </span>
                <span className="text-body-lg font-semibold tabular-nums">
                  {Math.round(g.totalGlucides)} g
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vue 2 : synthèse stock */}
      <section className="space-y-stack-md">
        <div className="flex items-center justify-between">
          <h3 className="text-body-lg font-semibold text-on-surface">Synthèse stock par produit</h3>
          <div className="flex gap-stack-md">
            <button
              onClick={removeRavitoColumn}
              disabled={nbRavitos <= 1}
              className="rounded-lg border-2 border-outline-variant px-3 py-2 text-label-caps uppercase text-on-surface hover:border-primary disabled:opacity-50"
            >
              − Ravito
            </button>
            <button
              onClick={addRavitoColumn}
              className="rounded-lg border-2 border-outline-variant px-3 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
            >
              + Ravito
            </button>
            <button
              onClick={addStock}
              className="rounded-lg border-2 border-outline-variant px-4 py-2 text-label-caps uppercase text-on-surface hover:border-primary"
            >
              + Produit
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full border-collapse text-left text-body-md">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <Th>Produit</Th>
                <Th>Qté initiale</Th>
                {Array.from({ length: nbRavitos }).map((_, r) => (
                  <Th key={r}>{r === 0 ? 'Avant' : `R${r}`}</Th>
                ))}
                <Th>Total</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {stock.length === 0 && (
                <tr>
                  <td colSpan={nbRavitos + 4} className="px-4 py-6 text-center text-on-surface-variant">
                    Aucun produit en stock.
                  </td>
                </tr>
              )}
              {stock.map((s, i) => {
                const computedRow = stockRows[i];
                return (
                  <tr key={i} className={computedRow?.insuffisant ? 'bg-error-container' : ''}>
                    <td className="px-2 py-2">
                      <input
                        value={s.produit}
                        onChange={(e) => updateStock(i, { produit: e.target.value })}
                        className={cellInput + ' min-w-[8rem]'}
                        placeholder="Produit"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <NumInput
                        value={s.quantiteInitiale}
                        onChange={(v) => updateStock(i, { quantiteInitiale: v })}
                      />
                    </td>
                    {Array.from({ length: nbRavitos }).map((_, r) => (
                      <td key={r} className="px-2 py-2">
                        <NumInput
                          value={s.parRavito[r] ?? 0}
                          onChange={(v) => updateStockRavito(i, r, v)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 tabular-nums">
                      <span className={computedRow?.insuffisant ? 'font-semibold text-on-error-container' : ''}>
                        {computedRow?.totalCalcule ?? 0}
                        {computedRow?.insuffisant && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeStock(i)}
                        className="text-error hover:underline"
                        aria-label="Supprimer le produit"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {stockRows.some((r) => r.insuffisant) && (
          <p className="text-body-md font-semibold text-error">
            ⚠️ Un ou plusieurs produits ont une consommation supérieure au stock initial.
          </p>
        )}
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
      step="1"
      min="0"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className="text-headline-md font-semibold tabular-nums">{value}</span>
    </div>
  );
}
