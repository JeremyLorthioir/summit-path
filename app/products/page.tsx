'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/lib/useAuth';
import type { ProduitGlobal } from '@/lib/types';
import { createProduct, deleteProduct, listenProducts, updateProduct } from '@/lib/products';

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

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<ProduitGlobal[]>([]);
  const [draft, setDraft] = useState<DraftProduit>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenProducts(
      user.uid,
      (list) => setProducts(list),
      (err) => setError(err.message)
    );
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  const addProduct = async () => {
    if (!user || !draft.nom.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createProduct(user.uid, {
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
      setBusy(false);
    }
  };

  const patchProduct = async (id: string, patch: Partial<ProduitGlobal>) => {
    setBusy(true);
    setError(null);
    try {
      await updateProduct(id, patch);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteProduct(id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <AppHeader title="Catalogue produits" backHref="/dashboard" />

      <div className="mx-auto max-w-5xl space-y-stack-lg p-gutter md:p-8">
        {error && (
          <div className="rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <h2 className="text-headline-md text-on-surface">Nouveau produit</h2>
          <div className="mt-stack-md grid gap-stack-md md:grid-cols-4">
            <input
              placeholder="Nom"
              value={draft.nom}
              onChange={(e) => setDraft((prev) => ({ ...prev, nom: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Unite"
              value={draft.unite}
              onChange={(e) => setDraft((prev) => ({ ...prev, unite: e.target.value }))}
              className={inputClass}
            />
            <input
              type="number"
              min="0"
              placeholder="Glucides/u"
              value={draft.glucidesParUniteG}
              onChange={(e) => setDraft((prev) => ({ ...prev, glucidesParUniteG: e.target.value }))}
              className={inputClass}
            />
            <input
              type="number"
              min="0"
              placeholder="Liquide/u (ml)"
              value={draft.volumeLiquideMl}
              onChange={(e) => setDraft((prev) => ({ ...prev, volumeLiquideMl: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="mt-stack-md">
            <button
              onClick={addProduct}
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-label-caps uppercase text-on-primary hover:opacity-90 disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <h2 className="text-headline-md text-on-surface">Produits ({products.length})</h2>

          <div className="mt-stack-md overflow-x-auto">
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
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-on-surface-variant">
                      Aucun produit pour le moment.
                    </td>
                  </tr>
                )}
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-2 py-2">
                      <input
                        value={product.nom}
                        onChange={(e) => patchProduct(product.id, { nom: e.target.value })}
                        className={inputClass + ' min-w-[10rem]'}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={product.unite}
                        onChange={(e) => patchProduct(product.id, { unite: e.target.value })}
                        className={inputClass + ' w-24'}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={product.glucidesParUniteG}
                        onChange={(e) => patchProduct(product.id, { glucidesParUniteG: Number(e.target.value) || 0 })}
                        className={inputClass + ' w-24 tabular-nums'}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={product.volumeLiquideMl}
                        onChange={(e) => patchProduct(product.id, { volumeLiquideMl: Number(e.target.value) || 0 })}
                        className={inputClass + ' w-24 tabular-nums'}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeProduct(product.id)}
                        disabled={busy}
                        className="text-error hover:underline disabled:opacity-50"
                      >
                        Suppr.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass =
  'w-full rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-md focus:border-primary focus:outline-none';

function Th({ children }: { children?: any }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-label-caps uppercase text-on-surface-variant">
      {children}
    </th>
  );
}
