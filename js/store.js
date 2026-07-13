// Logique métier — synchronisée en temps réel via Firestore.
//
// Un événement = { id, timestamp (ms), dateKey: "YYYY-MM-DD" }
// La source de vérité est Firestore ; on garde une copie mémoire à jour
// (via onSnapshot) pour que les lectures restent synchrones et simples.

import {
  addDoc,
  deleteDoc,
  updateDoc,
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

/**
 * Enregistre un caca avec son type ('normal' | 'malade').
 * Par défaut maintenant, ou à une Date précise.
 * Retourne la référence du document créé (pour y ajouter la position ensuite).
 */
export function addEvent(when = new Date(), type = 'normal') {
  const date = when instanceof Date ? when : new Date(when);
  return addDoc(eventsCol, {
    timestamp: date.getTime(),
    dateKey: dateKey(date),
    type,
  });
}

/** Ajoute la position GPS à un événement (via sa référence). */
export function setEventLocation(ref, lat, lng) {
  return updateDoc(ref, { lat, lng });
}

/** Enregistre un caca oublié pour AUJOURD'HUI à l'heure hh:mm, avec son type. */
export function addForgottenToday(hh, mm, type = 'normal') {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return addEvent(d, type);
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

/** Compte les cacas d'un jour par type. Retourne { normal, malade }. */
export function getTypeCountsForDay(key = dateKey()) {
  const counts = { normal: 0, malade: 0 };
  for (const e of getEventsForDay(key)) {
    counts[e.type === 'malade' ? 'malade' : 'normal']++;
  }
  return counts;
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

/** Événements ayant une position GPS (optionnellement filtrés sur un jour). */
export function getLocatedEvents(key = null) {
  return events.filter(
    (e) =>
      typeof e.lat === 'number' &&
      typeof e.lng === 'number' &&
      (key === null || e.dateKey === key)
  );
}

/** Total de tous les cacas par type. Retourne { normal, malade }. */
export function getTotalTypeCounts() {
  const counts = { normal: 0, malade: 0 };
  for (const e of events) counts[e.type === 'malade' ? 'malade' : 'normal']++;
  return counts;
}

/**
 * Statistiques globales.
 * - total : nombre total de cacas enregistrés
 * - days : nombre de jours suivis (du 1er enregistrement à aujourd'hui, inclus)
 * - average : moyenne de cacas par jour sur cette période
 */
export function getStats() {
  const total = events.length;
  if (total === 0) return { total: 0, days: 0, average: 0 };

  const firstTs = Math.min(...events.map((e) => e.timestamp));
  const first = new Date(firstTs);
  first.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.floor((today - first) / 86400000) + 1;
  return { total, days, average: total / Math.max(days, 1) };
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
