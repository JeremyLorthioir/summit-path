/**
 * Couche d'accès aux données Firestore pour les courses.
 * Chaque course est stockée comme un document unique dans la collection "courses",
 * avec ses segments / ravitos / stock embarqués.
 */
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course } from '@/lib/types';

const COURSES = 'courses';

/** Données modifiables d'une course (sans champs système ni propriétaire). */
export type CourseInput = Omit<Course, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>;

/** Convertit un document Firestore en objet Course typé. */
function fromDoc(id: string, data: Record<string, unknown>): Course {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined;
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined;
  return {
    id,
    ownerUid: (data.ownerUid as string) ?? '',
    nom: (data.nom as string) ?? '',
    date: (data.date as string) ?? '',
    heureDepart: (data.heureDepart as string) ?? '',
    allureCible: (data.allureCible as number) ?? 0,
    objectifGlucidesParHeure: (data.objectifGlucidesParHeure as number) ?? 0,
    statut: (data.statut as Course['statut']) ?? 'brouillon',
    notes: data.notes as string | undefined,
    segments: (data.segments as Course['segments']) ?? [],
    planRavito: (data.planRavito as Course['planRavito']) ?? [],
    stock: (data.stock as Course['stock']) ?? [],
    resultat: data.resultat as Course['resultat'] | undefined,
    createdAt,
    updatedAt,
  };
}

/** Tri par date croissante, côté client (évite un index composite Firestore). */
function sortByDate(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => a.date.localeCompare(b.date));
}

/** Écoute en temps réel les courses de l'utilisateur. */
export function listenCourses(
  uid: string,
  onChange: (courses: Course[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COURSES), where('ownerUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => onChange(sortByDate(snap.docs.map((d) => fromDoc(d.id, d.data())))),
    (err) => onError?.(err)
  );
}

/** Récupère ponctuellement les courses de l'utilisateur. */
export async function getCourses(uid: string): Promise<Course[]> {
  const q = query(collection(db, COURSES), where('ownerUid', '==', uid));
  const snap = await getDocs(q);
  return sortByDate(snap.docs.map((d) => fromDoc(d.id, d.data())));
}

/** Récupère une course par son identifiant. */
export async function getCourse(id: string): Promise<Course | null> {
  const ref = doc(db, COURSES, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

/** Écoute en temps réel une course unique. */
export function listenCourse(
  id: string,
  onChange: (course: Course | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = doc(db, COURSES, id);
  return onSnapshot(
    ref,
    (snap) => onChange(snap.exists() ? fromDoc(snap.id, snap.data()) : null),
    (err) => onError?.(err)
  );
}

/** Crée une nouvelle course et retourne son identifiant. */
export async function createCourse(uid: string, input: CourseInput): Promise<string> {
  const ref = await addDoc(collection(db, COURSES), {
    ...input,
    ownerUid: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Met à jour une course existante. */
export async function updateCourse(
  id: string,
  patch: Partial<CourseInput>
): Promise<void> {
  const ref = doc(db, COURSES, id);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Supprime une course. */
export async function deleteCourse(id: string): Promise<void> {
  await deleteDoc(doc(db, COURSES, id));
}

/** Duplique une course existante (statut remis à "brouillon", sans résultat). */
export async function duplicateCourse(uid: string, source: Course): Promise<string> {
  return createCourse(uid, {
    nom: `${source.nom} (copie)`,
    date: source.date,
    heureDepart: source.heureDepart,
    allureCible: source.allureCible,
    objectifGlucidesParHeure: source.objectifGlucidesParHeure,
    statut: 'brouillon',
    notes: source.notes,
    segments: source.segments,
    planRavito: source.planRavito,
    stock: source.stock,
  });
}

/** Archive une course. */
export async function archiveCourse(id: string): Promise<void> {
  await setDoc(
    doc(db, COURSES, id),
    { statut: 'archivee', updatedAt: serverTimestamp() },
    { merge: true }
  );
}
