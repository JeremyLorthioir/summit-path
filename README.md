# Summit Path 🏔️

Planifiez vos courses trail avec précision — calculs de temps, ravitaillement, barrières horaires, multi-device synchronisé.

## 🚀 Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styles**: Tailwind CSS + Stitch Design Tokens (Peak Performance System)
- **Base de données**: Firebase Firestore (real-time, no pause on inactivity)
- **Auth**: Firebase Auth + Google SSO
- **Hosting**: Vercel (Hobby free tier)
- **Offline**: IndexedDB persistence + Service Worker (PWA)

## 📁 Structure

```
summit-path/
├── app/                      # Pages Next.js
│   ├── layout.tsx           # Layout global
│   ├── page.tsx             # Accueil
│   ├── dashboard/page.tsx   # Liste des courses
│   └── login/page.tsx       # Connexion Google SSO
├── lib/
│   ├── types.ts             # Interfaces TypeScript
│   ├── firebase.ts          # Init Firebase + Auth
│   ├── calc.ts              # Fonctions pures de calcul
│   └── calc.test.ts         # Tests unitaires
├── components/              # Composants React
├── styles/
│   └── globals.css          # Tailwind + design tokens
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service Worker
├── firestore.rules          # Règles de sécurité Firestore
├── tailwind.config.ts       # Config Tailwind (tokens Stitch)
├── package.json             # Dépendances
└── docs/specifications/     # Cahier des charges + Solution technique
```

## 🔧 Installation

### 1. Prérequis
- Node.js 18+
- npm ou pnpm
- Firebase project (créer sur https://console.firebase.google.com)

### 2. Cloner & installer

```bash
git clone https://github.com/JeremyLorthioir/summit-path.git
cd summit-path
npm install
```

### 3. Configurer Firebase

**Étape 1**: Créer un projet Firebase
- Aller sur https://console.firebase.google.com
- Créer un nouveau projet
- Ajouter une application Web
- Copier la config Firebase

**Étape 2**: Copier `.env.local.example` → `.env.local`
```bash
cp .env.local.example .env.local
```

**Étape 3**: Remplir `.env.local` avec vos clés Firebase
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
```

### 4. Déployer les règles Firestore

Dans Firebase Console:
- **Firestore Database** → **Rules**
- Remplacer le contenu par celui de `firestore.rules`
- Publier

### 5. Activer Google OAuth

Dans Firebase Console:
- **Authentication** → **Sign-in method**
- Ajouter **Google**
- Ajouter votre domaine Vercel à la liste blanche (après le premier déploiement)

## 🏃 Développement

```bash
# Démarrer le serveur de dev
npm run dev

# Ouvrir http://localhost:3000
# Tester la connexion Google (local: http://localhost:3000/login)

# Tests unitaires
npm run test
npm run test:watch
```

## 📋 Fonctionnalités

### MVP (Phase 1)
- ✅ **Authentification**: Google SSO
- ✅ **Modèle de données**: Course, Segment, Ravitaillement, Résultat
- 🔜 **Dashboard**: Lister/créer/dupliquer courses
- 🔜 **Planificateur**: Éditable, calculs auto (km-effort, temps, heure)
- 🔜 **Ravitaillement**: Timeline + synthèse stock
- 🔜 **Résultat**: Saisie temps réel, comparaison plan vs réalité
- ✅ **Multi-device**: Real-time sync Firebase + IndexedDB offline

### Avancé (Phase 2+)
- Jour/Nuit (allure +8%)
- Barrières horaires + alertes
- Gestion matériel
- Multi-scénarios
- Import/Export GPX
- Journal de traçabilité
- Météo en-ligne

## 🔐 Sécurité

- ✅ Règles Firestore: `ownerUid == request.auth.uid` (lecture/écriture personnelle)
- ✅ Auth: Firebase Auth + Google provider (2FA si activé)
- ✅ Config Firebase: Volontairement publique (pas de secrets)
- ✅ zod: Validation de tous les schémas avant Firestore

## 📱 PWA & Offline

- ✅ Service Worker: Mise en cache de l'app shell
- ✅ Firebase IndexedDB: Persistance données offline
- ✅ Manifest.json: Installable sur home screen
- ✅ Reconnexion auto: Sync des writes en arrière-plan

## 🚢 Déploiement (Vercel)

### 1. Connecter le repo à Vercel
```bash
npm install -g vercel
vercel
```

### 2. Ajouter variables d'env dans Vercel Dashboard
- Copier les 6 variables de `.env.local`

### 3. Déployer
```bash
vercel --prod
```

### 4. Whitelist dans Firebase (Google OAuth)
- Firebase Console → **Authentication** → **Settings**
- Ajouter `https://votre-app.vercel.app` à la liste de domaines autorisés

## 📚 Docs

- **Cahier des charges**: `/docs/specifications/cahier-des-charges-automatisation-plan-trail.md`
- **Solution technique**: `/docs/specifications/solution-technique-plan-trail.md`
- **Design tokens**: `/docs/specifications/DESIGN.md`
- **Maquettes Stitch**: `/maquettes/`

## 🧪 Tests

```bash
# Tests unitaires des calculs trail (lib/calc.test.ts)
npm run test

# Watch mode
npm run test:watch
```

Tous les calculs (km-effort, temps, allure, glucides) sont testés avant intégration UI.

## 📞 Support

Questions? Consultez:
- Solution technique: `/docs/specifications/solution-technique-plan-trail.md`
- Stitch design: `/maquettes/peak_performance_system/DESIGN.md`

## 🎯 Prochaines étapes

1. ✅ Skeleton créé
2. 🔜 Dashboard: Lister les courses (Firestore query)
3. 🔜 Formulaire création/édition
4. 🔜 Écrans: segments, ravito, résultat
5. 🔜 Tests E2E

---

**Créé avec ❤️ pour les traileurs** | Trail Planner Automation Project