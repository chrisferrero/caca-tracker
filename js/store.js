// Logique métier — synchronisée en temps réel via Firestore.
//
// Un événement = { id, timestamp (ms), dateKey: "YYYY-MM-DD" }
// La source de vérité est Firestore ; on garde une copie mémoire à jour
// (via onSnapshot) pour que les lectures restent synchrones et simples.

import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { eventsCol } from './db.js';
import { dateKey, currentWeekDays } from './date.js';

let events = [];
const listeners = new Set();

/** S'abonner aux changements. Rappelé immédiatement avec l'état courant. */
export function subscribe(cb) {
  listeners.add(cb);
  cb(events);
  return () => listeners.delete(cb);
}

function emit() {
  for (const cb of listeners) cb(events);
}

// Écoute temps réel : toute modif (locale ou de l'autre téléphone) met à jour
// la copie mémoire puis notifie l'UI.
onSnapshot(
  query(eventsCol, orderBy('timestamp', 'desc')),
  (snap) => {
    events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    emit();
  },
  (err) => console.error('Firestore onSnapshot:', err)
);

/** Enregistre un caca (par défaut maintenant, ou à une Date précise). */
export function addEvent(when = new Date()) {
  const date = when instanceof Date ? when : new Date(when);
  return addDoc(eventsCol, {
    timestamp: date.getTime(),
    dateKey: dateKey(date),
  });
}

/** Enregistre un caca oublié pour AUJOURD'HUI à l'heure hh:mm. */
export function addForgottenToday(hh, mm) {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return addEvent(d);
}

/** Supprime un événement par son id. */
export function removeEvent(id) {
  return deleteDoc(doc(eventsCol, id));
}

// ---- Lectures (sur la copie mémoire, synchrones) ----

/** Événements d'un jour donné (défaut aujourd'hui), du plus récent au plus ancien. */
export function getEventsForDay(key = dateKey()) {
  return events
    .filter((e) => e.dateKey === key)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Le dernier événement du jour, ou null. */
export function getLastEventOfDay(key = dateKey()) {
  return getEventsForDay(key)[0] ?? null;
}

/** Tous les événements groupés par jour, du plus récent au plus ancien. */
export function getHistoryByDay() {
  const groups = new Map();
  for (const e of events) {
    if (!groups.has(e.dateKey)) groups.set(e.dateKey, []);
    groups.get(e.dateKey).push(e);
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, list]) => ({
      dateKey: key,
      events: list.sort((a, b) => b.timestamp - a.timestamp),
    }));
}

/** Nombre total d'événements. */
export function totalCount() {
  return events.length;
}

/**
 * Série en cours : jours consécutifs avec au moins un caca.
 * Si aujourd'hui n'a encore rien, on part de la veille (série non cassée).
 */
export function getStreak() {
  const d = new Date();
  if (getEventsForDay(dateKey(d)).length === 0) {
    d.setDate(d.getDate() - 1);
  }
  let streak = 0;
  while (getEventsForDay(dateKey(d)).length > 0) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Statut de la semaine courante (lundi → dimanche) pour les pastilles. */
export function getWeekStatus() {
  return currentWeekDays().map((day) => ({
    ...day,
    count: getEventsForDay(day.key).length,
  }));
}
