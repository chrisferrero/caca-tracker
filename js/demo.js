// Données de démonstration — optionnelles et non intrusives.
// N'est PAS chargé automatiquement en usage réel.
// Pour l'activer : ouvrir la console et taper  seedDemo()   puis recharger.
// Pour tout effacer :  clearAll()

import { dateKey } from './date.js';

const STORAGE_KEY = 'caca-tracker:events:v1';

function at(daysAgo, hh, mm) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hh, mm, 0, 0);
  return { id: `${d.getTime()}-demo`, timestamp: d.getTime(), dateKey: dateKey(d) };
}

export function installDemoHelpers() {
  window.seedDemo = () => {
    const events = [
      at(3, 8, 5),
      at(3, 19, 40),
      at(2, 7, 50),
      at(2, 13, 10),
      at(2, 20, 15),
      at(1, 8, 14), // hier
      // aujourd'hui laissé vide volontairement pour illustrer l'état "à faire"
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    console.log('✅ Données de démo installées. Recharge la page.');
  };

  window.clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Données effacées. Recharge la page.');
  };
}
