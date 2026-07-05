// Persistance locale via localStorage.
// Responsabilité unique : lire / écrire le tableau d'événements.

const STORAGE_KEY = 'caca-tracker:events:v1';

/** Retourne le tableau d'événements (ou [] si vide / corrompu). */
export function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Sauvegarde le tableau d'événements. */
export function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Impossible de sauvegarder les données :', e);
  }
}
