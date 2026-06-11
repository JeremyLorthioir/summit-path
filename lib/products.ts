import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProduitGlobal } from '@/lib/types';

const PRODUCTS = 'products';

type ProduitInput = Omit<
  ProduitGlobal,
  'id' | 'ownerUid' | 'createdAt' | 'updatedAt'
>;

function fromDoc(id: string, data: Record<string, unknown>): ProduitGlobal {
  const createdAtRaw = data['createdAt'];
  const updatedAtRaw = data['updatedAt'];
  const createdAt = createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : undefined;
  const updatedAt = updatedAtRaw instanceof Timestamp ? updatedAtRaw.toDate() : undefined;

  return {
    id,
    ownerUid: (data.ownerUid as string) ?? '',
    nom: (data.nom as string) ?? '',
    unite: (data.unite as string) ?? 'unite',
    glucidesParUniteG: Number(data.glucidesParUniteG ?? 0),
    volumeLiquideMl: Number(data.volumeLiquideMl ?? 0),
    marque: data.marque as string | undefined,
    actif: (data.actif as boolean | undefined) ?? true,
    createdAt,
    updatedAt,
  };
}

export function listenProducts(
  uid: string,
  onChange: (products: ProduitGlobal[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, PRODUCTS), where('ownerUid', '==', uid));
  return onSnapshot(
    q,
    (snap: any) => {
      const products = snap.docs
        .map((d: any) => fromDoc(d.id, d.data()))
        .sort((a: ProduitGlobal, b: ProduitGlobal) => a.nom.localeCompare(b.nom, 'fr'));
      onChange(products);
    },
    (err: Error) => onError?.(err)
  );
}

export async function createProduct(uid: string, input: ProduitInput): Promise<string> {
  const ref = await addDoc(collection(db, PRODUCTS), {
    ...input,
    ownerUid: uid,
    actif: input.actif ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, patch: Partial<ProduitInput>): Promise<void> {
  await updateDoc(doc(db, PRODUCTS, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS, id));
}
