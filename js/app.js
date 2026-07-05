// Couche UI — rendu et interactions.

import './icon.js';
import {
  subscribe,
  addEvent,
  addForgottenToday,
  removeEvent,
  getEventsForDay,
  getLastEventOfDay,
  getHistoryByDay,
} from './store.js';
import {
  dateKey,
  formatLongDate,
  formatShortDate,
  formatTime,
  relativeDayLabel,
} from './date.js';

// --- Références DOM ---
const el = {
  topbarDate: document.getElementById('topbar-date'),
  statusCard: document.getElementById('status-card'),
  heroLabel: document.getElementById('hero-label'),
  heroRing: document.getElementById('hero-ring'),
  ringCount: document.getElementById('ring-count'),
  statusTitle: document.getElementById('status-title'),
  statusSub: document.getElementById('status-sub'),
  btnAdd: document.getElementById('btn-add'),
  btnUndo: document.getElementById('btn-undo'),
  btnForgot: document.getElementById('btn-forgot'),
  forgotForm: document.getElementById('forgot-form'),
  forgotTime: document.getElementById('forgot-time'),
  timelineCard: document.getElementById('timeline-card'),
  todayList: document.getElementById('today-list'),
  historyContent: document.getElementById('history-content'),
  viewToday: document.getElementById('view-today'),
  viewHistory: document.getElementById('view-history'),
  tabs: document.querySelectorAll('.tab'),
};

let currentDayKey = dateKey();

// --- Rendu de la vue « Aujourd'hui » ---
function renderToday() {
  currentDayKey = dateKey();
  el.topbarDate.textContent = formatShortDate();
  el.heroLabel.textContent = `AUJOURD'HUI · ${formatLongDate().toUpperCase()}`;

  const todays = getEventsForDay();
  const count = todays.length;
  const last = getLastEventOfDay();

  // Le nombre de cacas du jour, en gros dans le rond.
  // La couleur du rond indique l'état : doré = fait, neutre = rien encore.
  el.ringCount.textContent = count;
  if (count === 0) {
    el.statusCard.classList.remove('is-done');
    el.heroRing.classList.remove('is-done');
    el.statusTitle.textContent = 'Pas encore aujourd’hui';
    el.statusSub.textContent = 'Aucun caca enregistré pour l’instant.';
  } else {
    el.statusCard.classList.add('is-done');
    el.heroRing.classList.add('is-done');
    el.statusTitle.textContent = 'Caca déjà fait !';
    const fois = count > 1 ? `${count} passages · ` : '';
    el.statusSub.textContent = `${fois}dernier à ${formatTime(last.timestamp)}`;
  }

  // Actions
  el.btnUndo.hidden = count === 0;

  // Passages du jour
  el.timelineCard.hidden = count === 0;
  el.todayList.innerHTML = '';
  for (const e of todays) {
    const li = document.createElement('li');
    li.className = 'entry';
    li.innerHTML = `
      <span class="entry-dot">💩</span>
      <span class="entry-time">${formatTime(e.timestamp)}</span>
      <button class="entry-del" type="button" aria-label="Supprimer" data-id="${e.id}">✕</button>
    `;
    el.todayList.appendChild(li);
  }
}

// --- Rendu de la vue « Historique » ---
function renderHistory() {
  const days = getHistoryByDay();
  el.historyContent.innerHTML = '';

  if (days.length === 0) {
    el.historyContent.innerHTML =
      '<p class="empty">Aucun enregistrement pour le moment.<br>Les jours passés apparaîtront ici. 🐾</p>';
    return;
  }

  days.forEach((day, i) => {
    const section = document.createElement('section');
    section.className = 'card history-day';
    section.style.setProperty('--i', i);

    const times = day.events
      .map((e) => `<span class="chip">${formatTime(e.timestamp)}</span>`)
      .join('');

    section.innerHTML = `
      <div class="history-day-head">
        <h2 class="history-day-title">${relativeDayLabel(day.dateKey)}</h2>
        <span class="history-day-count">${day.events.length} 💩</span>
      </div>
      <div class="history-day-times">${times}</div>
    `;
    el.historyContent.appendChild(section);
  });
}

// --- Navigation ---
function switchView(view) {
  const isToday = view === 'today';
  el.viewToday.hidden = !isToday;
  el.viewHistory.hidden = isToday;
  el.tabs.forEach((t) =>
    t.classList.toggle('is-active', t.dataset.view === view)
  );
  if (isToday) renderToday();
  else renderHistory();
}

// --- Confettis (micro-célébration ludique mais discrète) ---
function celebrate() {
  const emojis = ['🐾', '✨', '💩', '🌟'];
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  for (let i = 0; i < 14; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.textContent = emojis[i % emojis.length];
    piece.style.left = `${10 + Math.random() * 80}%`;
    piece.style.animationDelay = `${Math.random() * 0.15}s`;
    piece.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    piece.style.setProperty('--rot', `${(Math.random() - 0.5) * 220}deg`);
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1400);
}

// --- Écouteurs ---
// Les mutations écrivent dans Firestore ; l'affichage se met à jour tout seul
// via l'abonnement temps réel (subscribe), y compris quand l'autre téléphone agit.
el.btnAdd.addEventListener('click', () => {
  addEvent();
  celebrate();
  if (navigator.vibrate) navigator.vibrate(30);
});

el.btnForgot.addEventListener('click', () => {
  const willOpen = el.forgotForm.hidden;
  el.forgotForm.hidden = !willOpen;
  if (willOpen) {
    const now = new Date();
    el.forgotTime.value =
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0');
    el.forgotTime.focus();
  }
});

el.forgotForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const value = el.forgotTime.value;
  if (!value) return;
  const [hh, mm] = value.split(':').map(Number);
  addForgottenToday(hh, mm);
  el.forgotForm.hidden = true;
});

el.btnUndo.addEventListener('click', () => {
  const last = getLastEventOfDay();
  if (last) removeEvent(last.id);
});

el.todayList.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.entry-del');
  if (btn) removeEvent(btn.dataset.id);
});

el.tabs.forEach((tab) =>
  tab.addEventListener('click', () => switchView(tab.dataset.view))
);

// Rend la vue actuellement affichée.
function renderCurrent() {
  if (el.viewHistory.hidden) renderToday();
  else renderHistory();
}

// --- Réinitialisation quotidienne automatique ---
function checkDayRollover() {
  if (dateKey() !== currentDayKey) renderCurrent();
}
setInterval(checkDayRollover, 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDayRollover();
});

// --- Démarrage ---
// L'UI se (re)rend à chaque changement des données temps réel.
subscribe(renderCurrent);
