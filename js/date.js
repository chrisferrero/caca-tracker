// Utilitaires de date — tout est basé sur l'heure LOCALE de l'appareil.

const JOURS = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi',
];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/**
 * Clé de journée au format YYYY-MM-DD, en heure locale.
 * (On n'utilise pas toISOString() qui bascule en UTC et peut changer de jour.)
 */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Ex. "Jeudi 24 mars". Accepte une Date ou une dateKey "YYYY-MM-DD". */
export function formatLongDate(input = new Date()) {
  const date = toDate(input);
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]}`;
}

/** Ex. "08:14" à partir d'un timestamp (ms). */
export function formatTime(timestamp) {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Libellé relatif pour l'historique : "Aujourd'hui", "Hier", ou date longue. */
export function relativeDayLabel(key) {
  if (key === dateKey()) return "Aujourd'hui";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === dateKey(yesterday)) return 'Hier';
  return formatLongDate(key);
}

/** Ex. "Dim. 5 juil." — version courte pour la barre du haut. */
export function formatShortDate(input = new Date()) {
  const date = toDate(input);
  const jour = JOURS[date.getDay()].slice(0, 3);
  const mois = MOIS[date.getMonth()].slice(0, 4);
  return `${jour}. ${date.getDate()} ${mois}.`;
}

/**
 * Les 7 jours de la semaine courante (lundi → dimanche).
 * Chaque entrée : { key, letter, isToday, isFuture }.
 */
export function currentWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // getDay() : 0 = dimanche ; on ramène au lundi.
  const offsetToMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - offsetToMonday);

  const letters = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const todayKey = dateKey(today);

  return letters.map((letter, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dateKey(d);
    return {
      key,
      letter,
      isToday: key === todayKey,
      isFuture: d > today,
    };
  });
}

/** Convertit une dateKey "YYYY-MM-DD" (ou une Date) en Date locale. */
function toDate(input) {
  if (input instanceof Date) return input;
  const [y, m, d] = input.split('-').map(Number);
  return new Date(y, m - 1, d);
}
