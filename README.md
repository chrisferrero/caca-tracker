# 🐕 Caca du chien

Petite app mobile-first pour savoir en un coup d'œil **si le chien a déjà fait caca aujourd'hui**, et à quelle heure. Pratique quand on se relaie pour les balades.

Design inspiré du template **« Mindful Moments »** (vert profond, doré, pêche, cartes
crème ; typos Inter / Playfair Display / JetBrains Mono ; layout bento ; motion douce).

## Fonctionnalités

- **Vue « Aujourd'hui »** centrée sur la date du jour, avec un indicateur visuel fort :
  - 🐾 anneau neutre → aucun caca enregistré aujourd'hui
  - ✅ anneau doré → caca déjà fait, avec l'heure du dernier passage
- **Gros bouton « Caca fait »** qui enregistre un passage à l'heure exacte, avec
  micro-confettis 🐾✨ à la validation.
- **Série en cours (streak)** : nombre de jours consécutifs avec au moins un caca,
  + pastilles de la semaine (lundi → dimanche).
- **Compteur** du nombre de passages du jour + liste des horaires.
- **Ajouter un oubli** : enregistrer un caca à une heure choisie (pour aujourd'hui).
- **Annuler le dernier** passage (ou supprimer un horaire précis) en cas d'erreur.
- **Citation du jour** pour rythmer l'usage.
- **Réinitialisation quotidienne automatique** : chaque nouvelle journée repart à zéro, sans effacer l'historique.
- **Historique** : tous les jours passés, groupés par date, du plus récent au plus ancien.
- **Persistance locale** via `localStorage` — les données restent après fermeture.

> Les polices sont chargées via Google Fonts (nécessite une connexion au premier
> chargement). Des polices système équivalentes sont utilisées en repli hors-ligne.

## Lancer le projet

Aucune dépendance, aucun build. Il suffit de servir le dossier (les modules ES nécessitent `http://`, pas `file://`).

```bash
cd caca-tracker
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Ou avec Node :

```bash
npx serve .
```

> Sur mobile : ouvrir l'URL, puis « Ajouter à l'écran d'accueil » pour un usage plein écran.

## Données de démonstration (optionnel)

Non chargées par défaut. Dans la console du navigateur :

```js
seedDemo();  // installe quelques jours d'exemple, puis recharger
clearAll();  // efface tout, puis recharger
```

## Structure

```
caca-tracker/
├── index.html          # structure des 2 vues + navigation + décor ambiant
├── css/styles.css      # design « Mindful Moments », mobile-first
└── js/
    ├── date.js         # utilitaires de date (dateKey, formats FR, semaine)
    ├── storage.js      # persistance localStorage (lecture/écriture)
    ├── store.js        # logique métier (modèle, streak, semaine, opérations)
    ├── app.js          # rendu UI + interactions + confettis
    └── demo.js         # données de démo optionnelles
```

## Modèle de données

Un événement :

```js
{ id: string, timestamp: number /* ms */, dateKey: "YYYY-MM-DD" }
```

La `dateKey` est calculée en **heure locale** (et non UTC), pour que le changement de jour se fasse bien à minuit local.
