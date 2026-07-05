// Génère l'icône d'écran d'accueil (apple-touch-icon) en PNG au chargement.
//
// Pourquoi au runtime : iOS ne rend pas de façon fiable les icônes SVG/émoji
// pour l'écran d'accueil. On dessine donc l'émoji 💩 sur un canvas (rendu
// couleur natif de l'appareil) → PNG → on injecte le <link>. iOS le lit au
// moment du « Sur l'écran d'accueil ». Sans ça, iOS afficherait la 1re lettre
// du titre (« J »).

function makeIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fond vert profond de l'app (les coins seront arrondis par iOS).
  ctx.fillStyle = '#1C322D';
  ctx.fillRect(0, 0, size, size);

  ctx.font = `${Math.round(size * 0.62)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💩', size / 2, size * 0.56);

  return canvas.toDataURL('image/png');
}

function setIcons() {
  try {
    const href = makeIcon(180);

    let apple = document.querySelector('link[rel="apple-touch-icon"]');
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      document.head.appendChild(apple);
    }
    apple.href = href;
  } catch (e) {
    // En cas d'échec (canvas indisponible), on garde le favicon SVG.
    console.warn('Icône dynamique non générée:', e);
  }
}

setIcons();
