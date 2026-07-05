// Couche UI — rendu et interactions.

import {
  addEvent,
  addForgottenToday,
  removeEvent,
  getEventsForDay,
  getLastEventOfDay,
  getHistoryByDay,
  getStreak,
  getWeekStatus,
} from './store.js';
import {
  dateKey,
  formatLongDate,
  formatShortDate,
  formatTime,
  relativeDayLabel,
} from './date.js';
import { installDemoHelpers } from './demo.js';

// --- Références DOM ---
const el = {
  topbarDate: document.getElementById('topbar-date'),
  statusCard: document.getElementById('status-card'),
  heroLabel: document.getElementById('hero-label'),
  heroRing: document.getElementById('hero-ring'),
  statusIcon: document.getElementById('status-icon'),
  statusTitle: document.getElementById('status-title'),
  statusSub: document.getElementById('status-sub'),
  streakNum: document.getElementById('streak-num'),
  weekDots: document.getElementById('week-dots'),
  countNum: document.getElementById('count-num'),
  countHint: document.getElementById('count-hint'),
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

  // État principal (vert doré si fait, neutre sinon)
  if (count === 0) {
    el.statusCard.classList.remove('is-done');
    el.heroRing.classList.remove('is-done');
    el.statusIcon.textContent = '🐾';
    el.statusTitle.textContent = 'Pas encore aujourd’hui';
    el.statusSub.textContent = 'Aucun caca enregistré pour l’instant.';
  } else {
    el.statusCard.classList.add('is-done');
    el.heroRing.classList.add('is-done');
    el.statusIcon.textContent = '✅';
    el.statusTitle.textContent = 'Caca déjà fait !';
    el.statusSub.textContent = `Dernier passage à ${formatTime(last.timestamp)}`;
  }

  // Série + compteur
  el.streakNum.textContent = getStreak();
  el.countNum.textContent = count;
  el.countHint.textContent = count > 1 ? 'passages' : 'passage';

  renderWeekDots();

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

// Pastilles de la semaine (lundi → dimanche)
function renderWeekDots() {
  el.weekDots.innerHTML = '';
  for (const day of getWeekStatus()) {
    const dot = document.createElement('div');
    dot.className = 'week-dot';
    if (day.count > 0) dot.classList.add('is-filled');
    if (day.isToday) dot.classList.add('is-today');
    if (day.isFuture) dot.classList.add('is-future');
    dot.innerHTML = `<span class="week-dot-letter">${day.letter}</span>`;
    el.weekDots.appendChild(dot);
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
el.btnAdd.addEventListener('click', () => {
  addEvent();
  renderToday();
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
  renderToday();
});

el.btnUndo.addEventListener('click', () => {
  const last = getLastEventOfDay();
  if (last) {
    removeEvent(last.id);
    renderToday();
  }
});

el.todayList.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.entry-del');
  if (btn) {
    removeEvent(btn.dataset.id);
    renderToday();
  }
});

el.tabs.forEach((tab) =>
  tab.addEventListener('click', () => switchView(tab.dataset.view))
);

// --- Réinitialisation quotidienne automatique ---
function checkDayRollover() {
  if (dateKey() !== currentDayKey && !el.viewToday.hidden) {
    renderToday();
  }
}
setInterval(checkDayRollover, 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDayRollover();
});

// --- Démarrage ---
installDemoHelpers();
renderToday();
