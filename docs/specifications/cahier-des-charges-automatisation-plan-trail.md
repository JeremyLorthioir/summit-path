# Cahier des charges - Automatisation de planification trail

## 1) Contexte et objectif

Vous planifiez actuellement vos courses trail via 1 fichier Excel par course.
Objectif: disposer d'un outil unique, simple, rapide, qui permet de:
- preparer une course (segments, ravitos, temps de passage),
- simuler des scenarios d'allure,
- suivre la strategie nutrition/hydratation,
- calculer l'allure reelle post-course,
- fonctionner facilement en local et etre deployable sur Vercel,
- sans grosse base de donnees.

## 2) Perimetre fonctionnel (MVP)

### 2.1 Planification par course

- Creation d'une course avec:
  - nom, date, heure de depart,
  - allure cible (min/km-effort),
  - liste des segments (point A -> point B),
  - barrieres horaires optionnelles.
- Duplication d'une course existante pour reutiliser une structure.
- Gestion de plusieurs courses dans la meme application.

### 2.2 Segmentation par ravito et calculs

Pour chaque segment:
- Nom du segment / point de passage.
- Distance (km).
- D+ (m).
- D- (m).
- km-effort (calcule automatiquement).
- Temps estime par segment (calcule automatiquement).
- Temps cumule (calcule automatiquement).
- Heure de passage estimee (calcule automatiquement depuis heure de depart).
- Commentaire libre (strategie materiel/alimentation).

Formules metier reprises d'Excel:
- km_effort = distance_km + dplus_m/100 + dminus_m/200
- temps_etape_heures = km_effort * allure_min_par_km_effort / 60
- temps_cumule = somme(temps_etape)
- heure_passage = heure_depart + temps_cumule

Formules observees dans le classeur source:
- km-effort: B + C/100 + D/200
- Temps estime (format Excel): E * (allure/60) / 24
- Heure: heure_depart + temps_cumule

### 2.3 Gestion des ravitaillements

Deux vues complementaires:

1. Plan horaire/etape:
- A chaque heure ou segment: produit, quantite, glucides.
- Calcul des glucides par prise.
- Visualisation du total glucides par tranche horaire.

2. Synthese de stock par produit:
- Quantite initiale.
- Quantite consommee avant course.
- Quantite consommee entre ravitos (R1, R2, ...).
- Total calcule.
- Verification total attendu vs total calcule.

Regles minimales:
- Parametrage de la cible glucidique (ex: 90 g/h).
- Alerte si une tranche horaire est sous la cible.
- Alerte si stock insuffisant avant un ravito.

### 2.4 Post-course - allure reelle

- Saisie du temps reel total (hh:mm:ss).
- Calcul de l'allure reelle globale sur km-effort total.
- Comparaison allure cible vs allure reelle.
- Ecart en min/km-effort et en temps total.

Formule reprise du template:
- allure_reelle_min_par_km_effort = temps_reel_total_min / km_effort_total

## 3) Donnees a gerer

### 3.1 Entites

Course:
- id
- nom
- date
- heure_depart
- allure_cible
- notes
- created_at
- updated_at

Segment:
- id
- course_id
- ordre
- nom
- distance_km
- dplus_m
- dminus_m
- km_effort (derive)
- temps_estime_min (derive)
- temps_cumule_min (derive)
- heure_estimee_passage (derive)
- barriere_horaire (optionnel)
- notes

PlanRavitoItem:
- id
- course_id
- type_ligne (avant, heure, segment, ravito)
- repere (ex: H+1, Ravito 1)
- produit
- quantite
- glucides_unitaire_g
- glucides_total_g (derive)

StockProduit:
- id
- course_id
- produit
- quantite_initiale
- quantite_avant
- quantite_ravito_1
- quantite_ravito_2
- quantite_ravito_n
- total_calcule

ResultatCourse:
- id
- course_id
- temps_reel_total_sec
- allure_reelle_min_km_effort
- ecart_allure
- ecart_temps_sec

## 4) Ecrans attendus

1. Tableau de bord courses
- Liste des courses.
- Boutons creer/dupliquer/archiver/exporter.

2. Ecran course - Segments
- Tableau editable type grille (comme Excel).
- Colonnes calcules en lecture seule.
- Ligne Total.

3. Ecran course - Ravitaillement
- Vue plan de prise (timeline/tableau).
- Vue synthese stock par produit.
- Alertes glucides et stock.

4. Ecran course - Resultat
- Saisie temps reel.
- Calcul allure reelle.
- Comparaison avec le plan.

5. Import/Export
- Export JSON (sauvegarde).
- Export CSV des segments et ravitos.
- Import JSON pour restaurer une course.

## 5) Contraintes techniques

- Utilisable en local sans infrastructure lourde.
- Deployable facilement sur Vercel.
- Pas de grosse BD.
- Interface mobile et desktop.
- Sauvegarde fiable des donnees utilisateur.

## 6) Proposition technique recommandee

### 6.1 Option recommandee (Local-first, zero backend)

Stack:
- Next.js + TypeScript (App Router)
- UI: React + composant tableau editable
- Stockage: IndexedDB (via Dexie) + export/import JSON
- Deploiement: Vercel (site statique/dynamique sans base externe)

Pourquoi:
- Tres simple a maintenir.
- Aucune base serveur a administrer.
- Fonctionne localement immediatement.
- Compatible Vercel sans cout d'infra.

Limites:
- Donnees liees au navigateur/appareil tant qu'on n'exporte pas.

### 6.2 Option evolutive (si sync multi-device plus tard)

- Ajouter une couche backend serverless legere (API routes Vercel).
- Stockage leger manage (ex: SQLite compatible edge ou KV leger).
- Garder le mode local-first en fallback.

## 7) Regles de calcul (specification)

### 7.1 Temps de passage

- Toute modification sur distance, D+, D-, allure ou heure de depart recalcule:
  - km-effort segment,
  - temps estime segment,
  - temps cumule,
  - heure de passage.

### 7.2 Totaux

- Totaux segmentaires:
  - distance totale,
  - D+ total,
  - D- total,
  - km-effort total.
- Totaux ravito:
  - total glucides par heure/segment,
  - total par produit,
  - total global glucides course.

### 7.3 Validation

- Valeurs negatives interdites (distance, denivele, quantites).
- Alertes sur champs vides critiques.
- Unites explicites partout.

## 8) Critieres d'acceptation MVP

- Creation d'une course avec au moins 5 segments.
- Calcul automatique des km-effort et temps estimes conformes aux formules ci-dessus.
- Affichage du temps total estime.
- Saisie d'un plan ravito avec calcul des glucides.
- Affichage d'un recap stock par produit.
- Saisie du temps reel et calcul de l'allure reelle.
- Export puis re-import JSON sans perte de donnees.
- Fonctionnement local sans base externe.
- Deploiement Vercel fonctionnel.

## 9) Roadmap suggeree

Phase 1 (MVP):
- Ecrans Course/Segments/Ravito/Resultat
- Calculs et validations
- Import/Export JSON

Phase 2:
- Templates de courses (distance/type)
- Version mobile optimisee terrain
- Graphiques (ecart prevision vs reel)

Phase 3:
- Sync cloud optionnelle multi-appareils
- Partage de plan (lecture seule)

## 10) Mapping minimum depuis le fichier Excel actuel

Elements repris:
- Planification par course (onglets par course).
- Segmentation par points de passage/ravitos.
- Calcul km-effort.
- Calcul temps estime par etape et total selon allure cible.
- Calcul heure de passage.
- Prise en compte de barrieres horaires.
- Gestion des ravitaillements (plan de prise + stock par produit).
- Calcul de l'allure reelle apres course.

References de structure observees:
- Segments: Segment, Distance (km), D+ (m), D- (m), km-effort, Temps estime, Temps cumule, Heure, Barriere.
- Ravito: Heure, Produit, Quantite, Glucides, Total Glucides + tableau de synthese quantites.
- Post-course: champs Rythme reel et Temps reel.

## 11) Resume pret a integrer dans Stitch (generation maquettes HTML)

Copier/coller ce brief dans Stitch:

"""
Je veux une application web de planification trail, style outil perso simple et efficace, mobile + desktop.

Objectif principal:
- Planifier une course trail par segments (point de passage / ravito).
- Calculer automatiquement km-effort, temps estime par segment, temps cumule et heure de passage.
- Gerer le plan ravitaillement (produits, quantites, glucides, stock).
- Saisir le temps reel apres course et calculer l'allure reelle.

Formules metier obligatoires:
- km_effort = distance_km + dplus_m/100 + dminus_m/200
- temps_etape_min = km_effort * allure_min_par_km_effort
- temps_cumule = somme(temps_etape)
- heure_passage = heure_depart + temps_cumule
- allure_reelle_min_km_effort = temps_reel_total_min / km_effort_total

Ecrans a maquetter:
1) Dashboard Courses
- Liste des courses (nom, date, distance, D+, statut)
- Actions: creer, dupliquer, archiver, exporter

2) Ecran Course - Segments
- Tableau editable type Excel
- Colonnes: Segment, Distance, D+, D-, km-effort (auto), Temps estime (auto), Temps cumule (auto), Heure (auto), Barriere, Remarques
- Ligne Totaux en bas
- Affichage ecart a la barriere (en avance/en retard)

3) Ecran Course - Ravitaillement
- Vue plan de prise (par heure ou segment)
- Colonnes: repere, produit, quantite, glucides unitaires, glucides totaux
- Vue synthese stock par produit (initial, ravito 1, ravito 2, total)
- Alertes visuelles: objectif glucides/h non atteint, stock insuffisant

4) Ecran Course - Resultat
- Saisie temps reel total
- Calcul allure reelle et comparaison a l'allure cible
- Carte de score: ecart allure, ecart temps, segments les plus lents

Contraintes UX:
- Interface claire, tres lisible en effort/fatigue
- Gros champs de saisie, peu de clics, edition rapide clavier
- Mode mobile prioritaire pour usage terrain
- Code couleur simple: normal, alerte, critique

Contraintes techniques:
- Fonctionne en local sans grosse base de donnees
- Deployable facilement sur Vercel
- Sauvegarde locale + import/export JSON
"""

## 12) Fonctionnalites complementaires a envisager

### Priorite haute (forte valeur immediate)

- Remarques par segment et par ravito
  - Exemple: "batonnes a partir du km 35", "prendre coupe-vent si vent au col".
- Differenciation jour/nuit par segment
  - Champ "segment de nuit" + impact allure (ex: +8% temps).
- Gestion des barrieres avec marge de securite
  - Afficher la marge en minutes a chaque point.
- Plan materiel par segment
  - Eau mini, gels restants, veste, frontale, batterie.
- Check-list pre-course automatique
  - Selon distance/meteo/heure depart.

### Priorite moyenne (a ajouter apres MVP)

- Scenarios d'allure multiples
  - Scenario prudent, cible, ambitieux avec comparaison side-by-side.
- Facteur fatigue progressif
  - Degradation d'allure apres X km-effort.
- Facteur meteo
  - Ajustement temps selon chaleur/pluie/vent.
- Estimation sodium/cafeine
  - Au-dela des glucides: mg sodium/h, mg cafeine/h.
- Journal post-course
  - Saisie ressenti, digestion, crampes, points durs pour capitaliser.

### Priorite avancee (vision long terme)

- Import GPX et decoupage semi-automatique
  - Proposer des segments bases sur ravitos officiels.
- Prediction de risque de "mur"
  - Selon apport glucidique, denivele et historique de rythme.
- Mode assistance course en direct
  - Timer en live, prochaine prise dans X min, alerte barriere.
- Bibliotheque de templates par format
  - 30K, 50K, 80K, 100 miles, vertical, skyrace.
- Export plan imprimable
  - Version bracelet/fiche poche impermeable.
