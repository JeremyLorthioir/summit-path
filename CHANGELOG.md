# Changelog

## \[Non publie\]

### Modifie
- **Socle Next** - mise a jour de Next, React, types React et `eslint-config-next` dans `package.json`
- **Segments** - ajout de la saisie distance/denivele en mode segment ou cumul depuis depart
- **Parcours segments** - separation en page visualisation et page formulaire dediees
- **Libelles auto** - affichage automatise des segments (Depart -> point, point -> point, dernier -> Arrivee)
- **Segments par defaut** - l'onglet Segments ouvre directement la visualisation complete
- **UI segments** - alignement visuel renforce avec la maquette (cartes KPI, grille dense, badges, bandeau statut)

### Corrige
- **PostCSS** - export `plugins` explicite dans `postcss.config.js` pour Next
- **CSS global** - import corrige dans `app/layout.tsx` vers `styles/globals.css`
- **Build Next** - suppression du bloc `webpack` obsolete dans `next.config.js` pour compatibilite Turbopack
- **Import CSV** - import des segments depuis CSV Excel avec mapping auto des colonnes distance et denivele
- **Prises segment** - ajout d'un champ prises en formulaire, visualisation et import CSV
