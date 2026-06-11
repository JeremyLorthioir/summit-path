# Checklist Firebase

Cette checklist guide la configuration complète de Firebase pour Summit Path.

## ✅ Avant de démarrer `npm run dev`

- [ ] Créer un projet Firebase (https://console.firebase.google.com)
- [ ] Créer une application Web dans le projet
- [ ] Copier les 6 clés Firebase
- [ ] Remplir `.env.local` avec les clés
- [ ] Activer Firestore Database (mode production)
- [ ] Publier les règles Firestore (`firestore.rules`)
- [ ] Ajouter Google OAuth provider

## Firestore Rules

```
Firebase Console → Firestore Database → Rules

Remplacer par le contenu de firestore.rules

Structure collections:
- courses/          (documents: course avec ownerUid)
  - segments[]      (array de segments)
  - planRavito[]    (array de ravito)
  - stock[]         (array de stock)
  - resultat        (document imbriqué)
```

## Google Auth Configuration

```
Firebase Console → Authentication → Sign-in method

1. Ajouter Google
2. Remplir "Support email" et "Project support email"
3. Publier

Domaines autorisés:
- localhost:3000       (local dev)
- *.vercel.app         (production après déploiement)
```

## Firestore Spark Plan (Gratuit)

```
Limites (Spark plan):
- 1 GB stockage
- 50,000 lectures/jour
- 20,000 écritures/jour
- 1,000 suppressions/jour

✅ Pas de "pause on inactivity" (contrairement à Supabase)
✅ Suffisant pour MVP
```

## IndexedDB Persistence (Offline)

Configuration automatique dans `lib/firebase.ts`:
```typescript
enableIndexedDbPersistence(db)
```

Behavior:
- Données lues en local quand offline
- Writes mises en queue
- Sync auto quand connexion revient
- Multi-onglets détecté (warning console)

## Service Worker Setup

Manifest: `public/manifest.json` (app shell cache)
Service Worker: `public/sw.js`

Enregistrement dans layout.tsx:
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

## Déploiement Vercel

### 1. Connecter le repo
```bash
vercel
```

### 2. Variables d'env dans Vercel Dashboard
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Ajouter domaine Vercel à Firebase OAuth whitelist
```
Firebase Console → Authentication → Settings
Authorized domains → Add your-app.vercel.app
```

## Troubleshooting

### "ownerUid" field missing
→ Tous les documents dans `courses` **doivent avoir** `ownerUid`

### IndexedDB permission error
→ Multi-onglets détecté: une seule page peut avoir la persistance active

### Google OAuth "Redirect URI mismatch"
→ Vérifier que localhost:3000 ou vercel.app est dans Firebase authorized domains

### Firestore offline shows stale data
→ C'est normal: IndexedDB retourne les données locales. Reconnectez pour sync.

---

**Status: Ready for local dev** ✅
