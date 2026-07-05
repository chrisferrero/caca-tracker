// Couche UI — rendu et interactions.

import {
  subscribe,
  addEvent,
  addForgottenToday,
  removeEvent,
  setEventLocation,
  getEventsForDay,
  getLastEventOfDay,
  getLocatedEvents,
  getStats,
} from './store.js';
import {
  dateKey,
  formatLongDate,
  formatTime,
  monthLabel,
  monthGrid,
  WEEKDAY_LETTERS,
} from './date.js';

// --- Références DOM ---
const el = {
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
  calMonth: document.getElementById('cal-month'),
  calPrev: document.getElementById('cal-prev'),
  calNext: document.getElementById('cal-next'),
  historyContent: document.getElementById('history-content'),
  mapCard: document.getElementById('map-card'),
  calStats: document.getElementById('cal-stats'),
  statsAvg: document.getElementById('stats-avg'),
  statsSub: document.getElementById('stats-sub'),
  viewToday: document.getElementById('view-today'),
  viewHistory: document.getElementById('view-history'),
  tabs: document.querySelectorAll('.tab'),
};

let currentDayKey = dateKey();

// --- Rendu de la vue « Aujourd'hui » ---
function renderToday() {
  currentDayKey = dateKey();
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

// --- Rendu de la vue « Historique » : calendrier mensuel ---
// Mois actuellement affiché (par défaut : le mois en cours).
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function renderHistory() {
  el.calMonth.textContent = monthLabel(calYear, calMonth);

  // On n'autorise pas d'aller dans le futur (rien à y voir).
  const now = new Date();
  el.calNext.disabled =
    calYear > now.getFullYear() ||
    (calYear === now.getFullYear() && calMonth >= now.getMonth());

  const todayKey = dateKey();
  const weeks = monthGrid(calYear, calMonth);

  let html = '<div class="cal-grid">';
  for (const letter of WEEKDAY_LETTERS) {
    html += `<div class="cal-wd">${letter}</div>`;
  }
  for (const week of weeks) {
    for (const cell of week) {
      if (!cell) {
        html += '<div class="cal-cell cal-cell--empty"></div>';
        continue;
      }
      const count = getEventsForDay(cell.key).length;
      const cls =
        'cal-cell' +
        (cell.key === todayKey ? ' is-today' : '') +
        (count > 0 ? ' has-events' : '');
      html += `<div class="${cls}">
        <span class="cal-day">${cell.day}</span>
        ${count > 0 ? `<span class="cal-count">${count}</span>` : ''}
      </div>`;
    }
  }
  html += '</div>';
  el.historyContent.innerHTML = html;

  renderStats();
  renderMap();
}

// --- Carte des lieux de caca (Leaflet + OpenStreetMap) ---
let map = null;
let markersLayer = null;

function renderMap() {
  const pts = getLocatedEvents();

  // Pas de position enregistrée, ou Leaflet non chargé (ex. hors-ligne) → on cache.
  if (pts.length === 0 || !window.L) {
    el.mapCard.hidden = true;
    return;
  }
  el.mapCard.hidden = false;

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
    const when = `${formatLongDate(e.dateKey)} · ${formatTime(e.timestamp)}`;
    L.marker([e.lat, e.lng]).addTo(markersLayer).bindPopup(when);
    latlngs.push([e.lat, e.lng]);
  }

  // Leaflet a besoin de recalculer sa taille quand la vue vient d'être affichée.
  map.invalidateSize();
  map.fitBounds(latlngs, { padding: [30, 30], maxZoom: 16 });
}

// Bloc statistiques globales sous le calendrier.
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

// --- Navigation ---
function switchView(view) {
  const isToday = view === 'today';
  el.viewToday.hidden = !isToday;
  el.viewHistory.hidden = isToday;
  el.btnAdd.hidden = !isToday; // le CTA fixe n'a de sens que sur "Aujourd'hui"
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
el.btnAdd.addEventListener('click', async () => {
  celebrate();
  if (navigator.vibrate) navigator.vibrate(30);

  // 1) On enregistre le caca tout de suite (sans attendre la géoloc).
  let ref;
  try {
    ref = await addEvent();
  } catch (e) {
    console.error('Enregistrement échoué:', e);
    return;
  }

  // 2) On tente d'ajouter la position (facultatif : si refusée/indisponible,
  //    le caca reste enregistré sans coordonnées).
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

el.calPrev.addEventListener('click', () => shiftMonth(-1));
el.calNext.addEventListener('click', () => shiftMonth(1));

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
