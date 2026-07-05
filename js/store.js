// Logique métier — modèle de données et opérations sur les événements.
//
// Un événement = { id: string, timestamp: number (ms), dateKey: "YYYY-MM-DD" }

import { loadEvents, saveEvents } from './storage.js';
import { dateKey, currentWeekDays } from './date.js';

let events = loadEvents();

/** Génère un identifiant unique. */
function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Enregistre un caca. Par défaut à l'instant présent.
 * On peut passer une Date précise (ex. un oubli plus tôt dans la journée).
 * Retourne l'événement créé.
 */
export function addEvent(when = new Date()) {
  const date = when instanceof Date ? when : new Date(when);
  const event = {
    id: newId(),
    timestamp: date.getTime(),
    dateKey: dateKey(date),
  };
  events.push(event);
  saveEvents(events);
  return event;
}

/**
 * Enregistre un caca oublié pour AUJOURD'HUI à l'heure hh:mm choisie.
 * Retourne l'événement créé.
 */
export function addForgottenToday(hh, mm) {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return addEvent(d);
}

/** Supprime un événement par son id. */
export function removeEvent(id) {
  events = events.filter((e) => e.id !== id);
  saveEvents(events);
}

/** Événements d'un jour donné (par défaut aujourd'hui), du plus récent au plus ancien. */
export function getEventsForDay(key = dateKey()) {
  return events
    .filter((e) => e.dateKey === key)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Le dernier événement du jour (le plus récent), ou null. */
export function getLastEventOfDay(key = dateKey()) {
  return getEventsForDay(key)[0] ?? null;
}

/**
 * Tous les événements groupés par jour, du jour le plus récent au plus ancien,
 * et à l'intérieur d'un jour du plus récent au plus ancien.
 * Retourne : [{ dateKey, events: [...] }, ...]
 */
export function getHistoryByDay() {
  const groups = new Map();
  for (const e of events) {
    if (!groups.has(e.dateKey)) groups.set(e.dateKey, []);
    groups.get(e.dateKey).push(e);
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // dateKey décroissant
    .map(([key, list]) => ({
      dateKey: key,
      events: list.sort((a, b) => b.timestamp - a.timestamp),
    }));
}

/** Nombre total d'événements enregistrés. */
export function totalCount() {
  return events.length;
}

/**
 * Série en cours : nombre de jours consécutifs avec au moins un caca.
 * Si aujourd'hui n'a encore rien, on ne casse pas la série (la balade
 * n'a peut-être pas eu lieu) : on part de la veille.
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

/**
 * Statut de la semaine courante pour les pastilles.
 * Retourne [{ key, letter, isToday, isFuture, count }, ...] (lundi → dimanche).
 */
export function getWeekStatus() {
  return currentWeekDays().map((day) => ({
    ...day,
    count: getEventsForDay(day.key).length,
  }));
}
