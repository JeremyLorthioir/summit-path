# Guide de démarrage rapide

## 5 minutes pour démarrer

### 1️⃣ Firebase Setup (3 min)

```bash
# 1. Créer un projet Firebase
https://console.firebase.google.com/

# 2. Créer une app Web et copier la config

# 3. Copier .env.local.example → .env.local
cp .env.local.example .env.local

# 4. Remplir .env.local avec vos clés
```

### 2️⃣ Installer les deps

```bash
npm install
```

### 3️⃣ Déployer firestore.rules

```
Firebase Console → Firestore → Rules
Remplacer le contenu par firestore.rules
Publier
```

### 4️⃣ Activer Google OAuth

```
Firebase Console → Authentication → Sign-in method
Ajouter Google Provider
```

### 5️⃣ Développement local

```bash
npm run dev
# → http://localhost:3000/login
```

## 📂 Structure après setup

```
✅ app/           → Pages (dashboard, login, accueil)
✅ lib/           → Types, Firebase, Calc functions + tests
✅ firestore.rules  → Règles de sécurité (à publier)
✅ maquettes/     → Écrans Stitch HTML
✅ docs/          → Cahier des charges + Solution technique
```

## 🎯 Prochaines étapes

1. Tester la connexion Google (`/login`)
2. Créer des composants UI pour dashboard
3. Implémenter les 4 écrans (dashboard, segments, ravito, résultat)
4. Connecter Firestore pour CRUD courses
5. Déployer sur Vercel

## ⚙️ Scripts

```bash
npm run dev        # Dev server
npm run build      # Build production
npm run test       # Tests (lib/calc.test.ts)
npm run test:watch # Watch mode
```

## 🔗 Ressources

- **Cahier des charges**: `docs/specifications/cahier-des-charges-automatisation-plan-trail.md`
- **Solution technique**: `docs/specifications/solution-technique-plan-trail.md`
- **Maquettes**: `maquettes/` (4 écrans HTML Stitch)
- **Design tokens**: `docs/specifications/DESIGN.md`

---

Besoin d'aide? Consultez la Solution technique.
