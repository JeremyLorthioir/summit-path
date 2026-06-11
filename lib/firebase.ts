import { initializeApp, getApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';

// ⚠️ Cette clé API est intentionnellement publique (par design Firebase)
// La sécurité repose sur les règles Firestore, pas sur le masquage de la clé
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialiser Firebase (singleton)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Activer la persistance offline
  if (typeof window !== 'undefined') {
    import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistance offline: onglets multiples détectés');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistance offline: non supportée');
        }
      });
    });
  }
}

export { app, auth, db };
