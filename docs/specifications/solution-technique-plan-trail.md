# Solution Technique — Application de planification trail

## 1) Résumé fonctionnel

Application web (PWA) de planification de courses trail, qui reprend et automatise le
fichier Excel actuel : planification par course, segmentation par ravito, calculs
km-effort / temps / heure de passage, gestion des ravitaillements, et calcul de l'allure
réelle post-course.

Contraintes clés validées :
- Rendu UI conforme aux maquettes Stitch (« Peak Performance System »).
- **Multi-device** (synchronisation entre téléphone et ordinateur).
- Hébergement **gratuit**.
- Pas de grosse base de données à administrer.
- **Pas de mise en pause sur inactivité** (usage intermittent : quelques courses/an).

## 2) Décision d'architecture

### 2.1 Choix retenu : Next.js (Vercel) + Firebase Firestore comme datastore

On utilise **Firebase Firestore** comme base de données documentaire hébergée. C'est le
choix le mieux adapté car :

- **Pas de mise en pause sur inactivité** (contrairement à Supabase) → idéal pour un usage
  par à-coups (longues périodes sans course).
- Base **documentaire managée** avec synchronisation **temps réel** → multi-device natif.
- **Authentification gratuite intégrée** (Firebase Auth) → accès protégé sans effort.
- Pas d'administration de BD (pas de migrations SQL, pas de serveur à gérer).
- **Free tier (plan Spark)** largement suffisant pour un usage perso (voir §7).
- SDK client officiel + persistance offline intégrée.

### 2.2 Schéma d'architecture

```
[ Mobile / Desktop PWA ]
        │  (HTTPS)
        ▼
[ Next.js sur Vercel ]
   ├── UI React + Tailwind (design tokens Stitch)
   ├── Firebase SDK client (Firestore + Auth)
   ├── TanStack Query (optionnel : cache au-dessus des listeners)
   └── Service Worker (PWA, cache offline)
        │  (SDK Firestore, règles de sécurité)
        ▼
[ Firebase Firestore (collection "courses") ]
   course (document)
     ├── segments[]      (tableau imbriqué)
     ├── planRavito[]    (tableau imbriqué)
     ├── stock[]         (tableau imbriqué)
     └── resultat        (objet imbriqué)
```

> 💡 Firestore expose un SDK client sécurisé par des **règles de sécurité** : on peut
> écrire directement depuis le navigateur sans API proxy, l'accès étant restreint à
> l'utilisateur authentifié. Une couche API Next.js reste optionnelle (cf. §6).

### 2.3 Pourquoi pas les alternatives

| Option | Multi-device | Gratuit | Pause inactivité | Verdict |
|--------|--------------|---------|------------------|---------|
| Local-first seul (IndexedDB) | ❌ (1 appareil) | ✅ | — | Insuffisant (pas de sync) |
| Supabase (Postgres) | ✅ | ✅ | ⚠️ Pause après 1 semaine | Écarté (usage intermittent) |
| Sanity (CMS) | ✅ | ✅ | ✅ Non | Possible mais orienté contenu éditorial |
| Cloudflare D1 / Turso | ✅ | ✅ | ✅ Non | Bon, mais auth/temps réel à câbler |
| **Firebase Firestore** | ✅ | ✅ | ✅ Non | ✅ Retenu — sync + auth + pas de pause |

## 3) Stack technique

| Couche | Choix | Rôle |
|--------|-------|------|
| Framework | Next.js 15 (App Router) + TypeScript | UI + API serverless |
| UI | Tailwind CSS + tokens Stitch + Inter + Material Symbols | Rendu conforme maquettes |
| Données client | Firebase SDK (`firebase/firestore`) + listeners temps réel | Sync multi-device, optimistic UI |
| Auth | Firebase Auth (Google ou e-mail/mot de passe) | Accès protégé, gratuit |
| Datastore | Firebase Firestore (plan Spark) | Persistance multi-device, pas de pause |
| Offline | Persistance Firestore (`enableIndexedDbPersistence`) + PWA | Consultation/saisie hors-ligne terrain |
| Hébergement | Vercel (Hobby, gratuit) | Build + hosting du front Next.js |
| Validation | `zod` | Validation des données avant écriture |

## 4) Modèle de données (Firestore + types TypeScript)

Une **course = un document** dans la collection `courses`, avec ses segments, ravitos et
stock imbriqués (pas de jointures). Les calculs dérivés (km-effort, temps, cumul, heure)
ne sont **pas stockés** : ils sont recalculés côté client à partir des champs sources.

### 4.1 Arborescence Firestore

```
courses/{courseId}
  ├─ ownerUid: string           // = uid Firebase Auth (sécurité)
  ├─ nom, date, heureDepart, allureCible, objectifGlucidesParHeure, statut, notes
  ├─ segments: Segment[]
  ├─ planRavito: RavitoItem[]
  ├─ stock: StockProduit[]
  ├─ resultat: ResultatCourse
  ├─ createdAt, updatedAt        // serverTimestamp()
```

### 4.2 Types TypeScript (`lib/types.ts`)

```ts
export interface Course {
  id: string;
  ownerUid: string;
  nom: string;
  date: string;                  // "2026-09-12"
  heureDepart: string;           // "06:00"
  allureCible: number;           // min/km-effort
  objectifGlucidesParHeure: number; // ex: 90
  statut: 'brouillon' | 'prete' | 'terminee' | 'archivee';
  notes?: string;
  segments: Segment[];
  planRavito: RavitoItem[];
  stock: StockProduit[];
  resultat?: ResultatCourse;
}

export interface Segment {
  ordre: number;
  nom: string;
  distanceKm: number;
  dplusM: number;
  dmoinsM: number;
  barriereHoraire?: string;      // "13:50"
  segmentDeNuit?: boolean;       // ajustement allure
  remarques?: string;
  materiel?: string;             // veste, frontale, eau mini...
}

export interface RavitoItem {
  repere: string;                // "Avant", "H+1", "Ravito 1"
  produit: string;
  quantite: number;
  glucidesUnitaireG: number;
}

export interface StockProduit {
  produit: string;
  quantiteInitiale: number;
  parRavito: number[];           // [avant, R1, R2, ...]
}

export interface ResultatCourse {
  tempsReelTotalSec: number;
  notesPostCourse?: string;
}
```

## 5) Logique de calcul (côté client, pure functions)

Centraliser tous les calculs dans `lib/calc.ts` (testable, sans dépendance UI).

```ts
export const kmEffort = (d: number, dplus: number, dmoins: number) =>
  d + dplus / 100 + dmoins / 200;

// allure en min/km-effort ; renvoie des minutes
export const tempsEtapeMin = (kmEff: number, allure: number, nuit = false) =>
  kmEff * allure * (nuit ? 1.08 : 1); // +8% de nuit (paramétrable)

export const tempsCumuleMin = (etapes: number[]) =>
  etapes.reduce((acc, t) => acc + t, 0);

export const heurePassage = (heureDepart: string, cumulMin: number): string => {
  const [h, m] = heureDepart.split(':').map(Number);
  const total = h * 60 + m + cumulMin;
  const hh = Math.floor(total / 60) % 24;
  const mm = Math.round(total % 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const allureReelle = (tempsReelTotalSec: number, kmEffortTotal: number) =>
  tempsReelTotalSec / 60 / kmEffortTotal; // min/km-effort

export const margeBarriereMin = (heureEstimee: string, barriere: string) => {
  const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h*60+m; };
  return toMin(barriere) - toMin(heureEstimee); // >0 = en avance
};
```

## 6) Sécurité et accès

- **Firebase Auth** protège l'accès (connexion Google ou e-mail/mot de passe).
- **Règles de sécurité Firestore** : un utilisateur ne lit/écrit que ses propres courses
  (`ownerUid == request.auth.uid`). C'est la défense principale.
- La **config Firebase côté client n'est pas un secret** (apiKey publique) : la sécurité
  repose sur les règles Firestore + Auth, pas sur le masquage de la clé.
- Validation des données avec `zod` avant chaque écriture (valeurs négatives interdites,
  champs requis), en complément des règles Firestore.
- HTTPS fourni par Vercel par défaut.

```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /courses/{courseId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.ownerUid;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.ownerUid;
    }
  }
}
```

## 7) Hébergement gratuit — analyse

| Service | Offre gratuite | Pause inactivité | Pertinence ici |
|---------|----------------|------------------|----------------|
| **Vercel Hobby** | Hosting Next.js, HTTPS, domaine `.vercel.app` | ✅ Non | ✅ Frontend |
| **Firebase (plan Spark)** | Firestore, Auth, quotas lecture/écriture/jour | ✅ Non | ✅ Datastore + Auth |
| Cloudflare Pages | Alternative hosting gratuite | ✅ Non | Option de repli |

> ⚠️ **Vérification à faire** (les quotas évoluent) : confirmer les limites actuelles du
> plan gratuit Vercel Hobby (usage non commercial) et du **plan Spark Firebase**
> (lectures/écritures/suppressions par jour, stockage). Pour un usage perso (quelques
> courses, 1 utilisateur), ces quotas sont très largement suffisants.

> ✅ **Avantage clé** : ni Vercel Hobby ni Firebase ne mettent le projet **en pause sur
> inactivité** — adapté à un usage par à-coups (quelques courses par an).

Coût total cible : **0 €**.

## 8) Stratégie multi-device et offline

1. **Source de vérité** : Firestore (cloud). Toute écriture confirmée y est persistée.
2. **Temps réel** : les écrans s'abonnent aux documents via `onSnapshot` → mise à jour
   automatique sur tous les appareils connectés.
3. **Offline terrain** : `enableIndexedDbPersistence()` du SDK Firestore met en cache les
   données localement ; les saisies hors-ligne sont mises en file et **synchronisées au
   retour réseau** (géré nativement par le SDK). La PWA assure le chargement de l'app
   hors-ligne.
4. **Cohérence** : en mono-utilisateur, conflits rares ; horodatage `updatedAt`
   (`serverTimestamp()`) et stratégie « dernière écriture gagne ».

## 9) Structure du projet

```
trail-app/
├── app/
│   ├── (dashboard)/page.tsx          # Dashboard courses
│   ├── course/[id]/segments/page.tsx # Planificateur de segments
│   ├── course/[id]/ravito/page.tsx   # Plan ravitaillement
│   ├── course/[id]/resultat/page.tsx # Analyse de résultat
│   └── login/page.tsx                # Écran de connexion (Firebase Auth)
├── components/                       # MetricCard, DataRow, StatusChip, etc.
├── lib/
│   ├── calc.ts                       # Calculs purs (testés)
│   ├── types.ts                      # Types Course/Segment/...
│   ├── firebase.ts                   # Init app Firebase (client)
│   └── courses.repo.ts               # Lecture/écriture Firestore + zod
├── firestore.rules                   # Règles de sécurité
├── styles/tokens.ts                  # Tokens Stitch (couleurs, typo, spacing)
└── public/ (manifest PWA, icônes)
```

## 10) Mapping écrans Stitch → composants

| Écran Stitch | Route | Composants clés |
|--------------|-------|-----------------|
| Dashboard courses | `/` | Liste cartes course, FAB « Nouvelle course » |
| Planificateur de segments | `/course/[id]/segments` | Table éditable, DataRow, ligne Totaux, StatusChip (avance/retard barrière) |
| Plan ravitaillement | `/course/[id]/ravito` | Timeline prises, synthèse stock, alertes glucides/stock |
| Analyse de résultat | `/course/[id]/resultat` | MetricCard (allure réelle, écart), graphe prévu vs réel |

Design tokens à porter dans Tailwind (déjà fournis par Stitch) :
- Couleurs : primary `#003426`, error `#ba1a1a`, surfaces `#f8f9ff`/`#ffffff`.
- Typo : Inter, chiffres tabulaires (`tnum`) pour les données numériques.
- Touch target min 48px, baseline 4px.

## 11) Critères d'acceptation techniques

- [ ] Projet Firebase créé, Firestore activé, règles de sécurité déployées.
- [ ] Firebase Auth en place (connexion + protection des routes).
- [ ] Règles Firestore testant `ownerUid == request.auth.uid` (lecture + écriture).
- [ ] CRUD course via `lib/courses.repo.ts` validé par `zod`.
- [ ] Calculs `lib/calc.ts` couverts par tests unitaires (km-effort, temps, heure, allure réelle, marge barrière).
- [ ] Recalcul automatique à chaque modification (distance, D+, D-, allure, heure départ, nuit).
- [ ] Synchronisation temps réel (`onSnapshot`) : données identiques mobile/desktop.
- [ ] Persistance offline Firestore activée + PWA installable.
- [ ] Déploiement Vercel fonctionnel, coût 0 €.

## 12) Points d'attention

- **Quotas free tier** : vérifier Vercel Hobby + Firebase Spark avant mise en prod (cf. §7).
- **Règles Firestore = sécurité réelle** : la clé API client est publique ; tout repose sur
  des règles correctes → les tester soigneusement.
- **Conflits de sync** : faibles en mono-utilisateur, mais prévoir « last write wins ».
- **Pas de pause inactivité** : avantage décisif vs Supabase pour un usage intermittent.
- **Évolutivité** : multi-utilisateur déjà possible grâce à `ownerUid` + Firebase Auth.

## 13) Séquencement

| Ordre | Lot | Contenu | Dépend de |
|-------|-----|---------|-----------|
| 1 | Setup | Next.js + Tailwind tokens + projet Firebase + règles | — |
| 2 | Calculs | `lib/calc.ts` + tests | 1 |
| 3 | Données | `lib/firebase.ts` + `courses.repo.ts` + zod | 1 |
| 4 | Écran Segments | Table éditable + totaux + barrières | 2,3 |
| 5 | Écran Ravito | Plan de prise + stock + alertes glucides | 2,3 |
| 6 | Écran Résultat | Allure réelle + comparaison | 2,3 |
| 7 | Dashboard | Liste + duplication + archivage | 3 |
| 8 | Auth | Firebase Auth + protection des routes | 3 |
| 9 | PWA/Offline | Manifest + persistance Firestore + service worker | 4-8 |
| 10 | Deploy | Déploiement Vercel | 9 |

## 14) Prochaines étapes proposées

1. Je génère le squelette Next.js (structure §9 + tokens Tailwind Stitch).
2. J'implémente `lib/calc.ts` avec tests dès le départ.
3. Je configure Firebase (`lib/firebase.ts`), le repository Firestore et les règles de sécurité.

> ⚠️ Avant de coder, **confirmer** : méthode de connexion Firebase Auth souhaitée
> (Google, ou e-mail/mot de passe) ?
