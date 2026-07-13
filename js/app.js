// Couche UI — rendu et interactions.

import {
  subscribe,
  addEvent,
  addForgottenToday,
  removeEvent,
  setEventLocation,
  getEventsForDay,
  getTypeCountsForDay,
  getStreak,
  getWeekStatus,
  getLocatedEvents,
  getTotalTypeCounts,
  getStats,
} from './store.js';
import {
  dateKey,
  formatShortDate,
  formatLongDate,
  formatTime,
  monthLabel,
  monthGrid,
  WEEKDAY_LETTERS,
} from './date.js';

const TYPE_LABEL = { normal: 'Normal', malade: 'Malade' };

// --- Références DOM ---
const el = {
  streakNum: document.getElementById('streak-num'),
  streakHint: document.getElementById('streak-hint'),
  flame: document.getElementById('flame'),
  weekRow: document.getElementById('week-row'),
  todayLabel: document.getElementById('today-label'),
  todayTitle: document.getElementById('today-title'),
  countNormal: document.getElementById('count-normal'),
  countMalade: document.getElementById('count-malade'),
  todayList: document.getElementById('today-list'),
  btnAdd: document.getElementById('btn-add'),
  btnForgot: document.getElementById('btn-forgot'),
  forgotForm: document.getElementById('forgot-form'),
  forgotTime: document.getElementById('forgot-time'),
  typeModal: document.getElementById('type-modal'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  modalCancel: document.getElementById('modal-cancel'),
  viewToday: document.getElementById('view-today'),
  viewHistory: document.getElementById('view-history'),
  tabs: document.querySelectorAll('.tab'),
  calMonth: document.getElementById('cal-month'),
  calPrev: document.getElementById('cal-prev'),
  calNext: document.getElementById('cal-next'),
  historyContent: document.getElementById('history-content'),
  typeSummary: document.getElementById('type-summary'),
  sumNormal: document.getElementById('sum-normal'),
  sumMalade: document.getElementById('sum-malade'),
  dayDetail: document.getElementById('day-detail'),
  dayDetailTitle: document.getElementById('day-detail-title'),
  dayList: document.getElementById('day-list'),
  mapWrap: document.getElementById('map-wrap'),
  calStats: document.getElementById('cal-stats'),
  statsAvg: document.getElementById('stats-avg'),
  statsSub: document.getElementById('stats-sub'),
};

let currentDayKey = dateKey();

// ===================== VUE AUJOURD'HUI =====================
function renderToday() {
  currentDayKey = dateKey();
  el.todayLabel.textContent = `AUJOURD'HUI · ${formatShortDate().toUpperCase()}`;

  // Série (jours consécutifs)
  const streak = getStreak();
  el.streakNum.textContent = String(streak).padStart(2, '0');
  el.flame.classList.toggle('is-dim', streak === 0);
  el.streakHint.textContent =
    streak === 0
      ? 'Commencez la série aujourd’hui !'
      : streak === 1
      ? '1 jour d’affilée, continuez ! 🎉'
      : `${streak} jours d’affilée, bravo ! 🎉`;

  renderWeek();

  // Compteurs par type + titre
  const { normal, malade } = getTypeCountsForDay();
  const total = normal + malade;
  el.countNormal.textContent = normal;
  el.countMalade.textContent = malade;
  el.todayTitle.textContent =
    total === 0 ? 'Aucun caca !' : `${total} caca${total > 1 ? 's' : ''}`;

  // Liste des passages du jour
  el.todayList.innerHTML = '';
  for (const e of getEventsForDay()) {
    const type = e.type === 'malade' ? 'malade' : 'normal';
    const li = document.createElement('li');
    li.className = 'entry';
    li.innerHTML = `
      <span class="entry-time">${formatTime(e.timestamp)}</span>
      <span class="entry-tag t-${type}">${TYPE_LABEL[type]}</span>
      <button class="entry-del" type="button" aria-label="Supprimer" data-id="${e.id}">✕</button>
    `;
    el.todayList.appendChild(li);
  }
}

function renderWeek() {
  el.weekRow.innerHTML = '';
  for (const day of getWeekStatus()) {
    const cell = document.createElement('div');
    cell.className = 'week-day';
    const cls =
      'week-dot' +
      (day.count > 0 ? ' is-filled' : '') +
      (day.isToday ? ' is-today' : '') +
      (day.isFuture ? ' is-future' : '');
    cell.innerHTML = `
      <span class="week-day-letter">${day.letter}</span>
      <span class="${cls}">${day.count > 0 ? '<span class="week-poop"></span>' : ''}</span>
    `;
    el.weekRow.appendChild(cell);
  }
}

// ===================== ENREGISTREMENT + TYPE =====================
function openTypeModal() {
  el.typeModal.hidden = false;
}
function closeTypeModal() {
  el.typeModal.hidden = true;
}

// Enregistre un caca MAINTENANT (avec type) + tente la géoloc.
async function recordNow(type) {
  closeTypeModal();
  celebrate();
  if (navigator.vibrate) navigator.vibrate(30);

  let ref;
  try {
    ref = await addEvent(new Date(), type);
  } catch (e) {
    console.error('Enregistrement échoué:', e);
    return;
  }
  if (navigator.geolocation && ref) {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setEventLocation(ref, pos.coords.latitude, pos.coords.longitude).catch(
          (e) => console.warn('Position non enregistrée:', e)
        ),
      (err) => console.warn('Géolocalisation indisponible:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }
}

// Enregistre un oubli à l'heure choisie (sans géoloc : on n'est plus sur place).
function submitForgot(type) {
  const value = el.forgotTime.value;
  if (!value) return;
  const [hh, mm] = value.split(':').map(Number);
  addForgottenToday(hh, mm, type);
  el.forgotForm.hidden = true;
}

// ===================== CONFETTIS =====================
function celebrate() {
  const emojis = ['💩', '✨', '🐾', '🎉'];
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

// ===================== VUE HISTORIQUE =====================
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let selectedDayKey = dateKey();

function renderHistory() {
  // Récap global par type
  const totals = getTotalTypeCounts();
  el.typeSummary.hidden = totals.normal + totals.malade === 0;
  el.sumNormal.textContent = totals.normal;
  el.sumMalade.textContent = totals.malade;

  el.calMonth.textContent = monthLabel(calYear, calMonth);
  const now = new Date();
  el.calNext.disabled =
    calYear > now.getFullYear() ||
    (calYear === now.getFullYear() && calMonth >= now.getMonth());

  const todayKey = dateKey();
  let html = '<div class="cal-grid">';
  for (const letter of WEEKDAY_LETTERS) html += `<div class="cal-wd">${letter}</div>`;
  for (const week of monthGrid(calYear, calMonth)) {
    for (const cell of week) {
      if (!cell) {
        html += '<div class="cal-cell cal-cell--empty"></div>';
        continue;
      }
      const count = getEventsForDay(cell.key).length;
      const cls =
        'cal-cell' +
        (cell.key === todayKey ? ' is-today' : '') +
        (cell.key === selectedDayKey ? ' is-selected' : '') +
        (count > 0 ? ' has-events' : '');
      html += `<button class="${cls}" type="button" data-key="${cell.key}">
        <span class="cal-day">${cell.day}</span>
        ${count > 0 ? `<span class="cal-count">${count}</span>` : ''}
      </button>`;
    }
  }
  html += '</div>';
  el.historyContent.innerHTML = html;

  renderDayDetail(selectedDayKey);
  renderStats();
}

function selectDay(key) {
  selectedDayKey = key;
  renderHistory();
}

// Détail du jour sélectionné : liste (avec type) + carte des points de CE jour.
function renderDayDetail(key) {
  const label = formatLongDate(key);
  el.dayDetailTitle.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  const dayEvents = getEventsForDay(key);
  el.dayList.innerHTML = '';
  if (dayEvents.length === 0) {
    el.dayList.innerHTML = '<li class="day-empty">Aucun caca ce jour.</li>';
  } else {
    for (const e of dayEvents) {
      const type = e.type === 'malade' ? 'malade' : 'normal';
      const li = document.createElement('li');
      li.className = 'entry';
      li.innerHTML = `
        <span class="entry-time">${formatTime(e.timestamp)}</span>
        <span class="entry-tag t-${type}">${TYPE_LABEL[type]}</span>
      `;
      el.dayList.appendChild(li);
    }
  }
  renderDayMap(key);
}

function renderStats() {
  const { total, days, average } = getStats();
  if (total === 0) {
    el.calStats.hidden = true;
    return;
  }
  el.calStats.hidden = false;
  el.statsAvg.textContent = average.toFixed(1).replace('.', ',');
  const totalTxt = `${total} caca${total > 1 ? 's' : ''}`;
  const daysTxt = `${days} jour${days > 1 ? 's' : ''} suivi${days > 1 ? 's' : ''}`;
  el.statsSub.textContent = `${totalTxt} en tout · ${daysTxt}`;
}

let map = null;
let markersLayer = null;
function renderDayMap(key) {
  const pts = getLocatedEvents(key);
  if (pts.length === 0 || !window.L) {
    el.mapWrap.hidden = true;
    return;
  }
  el.mapWrap.hidden = false;
  if (!map) {
    map = L.map('map', { attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  }
  markersLayer.clearLayers();
  const latlngs = [];
  for (const e of pts) {
    const type = e.type === 'malade' ? 'Malade' : 'Normal';
    L.marker([e.lat, e.lng])
      .addTo(markersLayer)
      .bindPopup(`${formatTime(e.timestamp)} · ${type}`);
    latlngs.push([e.lat, e.lng]);
  }
  map.invalidateSize();
  map.fitBounds(latlngs, { padding: [30, 30], maxZoom: 16 });
}

function shiftMonth(delta) {
  calMonth += delta;
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  } else if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  renderHistory();
}

// ===================== NAVIGATION =====================
function switchView(view) {
  const isToday = view === 'today';
  el.viewToday.hidden = !isToday;
  el.viewHistory.hidden = isToday;
  el.btnAdd.hidden = !isToday;
  if (!isToday) closeTypeModal();
  el.tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.view === view));
  if (isToday) renderToday();
  else renderHistory();
}

function renderCurrent() {
  if (el.viewHistory.hidden) renderToday();
  else renderHistory();
}

// ===================== ÉCOUTEURS =====================
el.btnAdd.addEventListener('click', openTypeModal);
el.modalCancel.addEventListener('click', closeTypeModal);
el.modalBackdrop.addEventListener('click', closeTypeModal);

document.querySelectorAll('#type-modal .type-btn').forEach((b) =>
  b.addEventListener('click', () => recordNow(b.dataset.type))
);
document.querySelectorAll('#forgot-form .type-btn').forEach((b) =>
  b.addEventListener('click', () => submitForgot(b.dataset.type))
);

el.btnForgot.addEventListener('click', () => {
  const willOpen = el.forgotForm.hidden;
  el.forgotForm.hidden = !willOpen;
  if (willOpen) {
    const now = new Date();
    el.forgotTime.value =
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0');
  }
});

el.todayList.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.entry-del');
  if (btn) removeEvent(btn.dataset.id);
});

el.tabs.forEach((tab) =>
  tab.addEventListener('click', () => switchView(tab.dataset.view))
);
el.calPrev.addEventListener('click', () => shiftMonth(-1));
el.calNext.addEventListener('click', () => shiftMonth(1));

// Sélection d'un jour dans le calendrier → détail du jour
el.historyContent.addEventListener('click', (ev) => {
  const cell = ev.target.closest('.cal-cell[data-key]');
  if (cell) selectDay(cell.dataset.key);
});

// Réinitialisation quotidienne automatique
function checkDayRollover() {
  if (dateKey() !== currentDayKey) renderCurrent();
}
setInterval(checkDayRollover, 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDayRollover();
});

// Démarrage
subscribe(renderCurrent);
