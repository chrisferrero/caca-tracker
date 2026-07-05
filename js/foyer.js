// Résolution de l'identifiant de « foyer » (l'espace partagé).
//
// Mode « lien secret » : l'identifiant n'est PAS dans le code (sinon il serait
// public via GitHub). Il arrive par le lien, dans le hash : #foyer=xxxxx
// - S'il est présent dans l'URL, on le mémorise localement.
// - Sinon on réutilise celui déjà mémorisé.
// - Sinon (visiteur inconnu, sans lien secret) on crée un espace privé neuf,
//   pour ne jamais atterrir dans le foyer de quelqu'un d'autre.

const KEY = 'caca-tracker:foyer';

function randomId() {
  const rnd =
    (crypto && crypto.randomUUID && crypto.randomUUID().replace(/-/g, '')) ||
    Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `foyer_${rnd}`;
}

export function getFoyerId() {
  const params = new URLSearchParams(location.hash.slice(1));
  const fromLink = params.get('foyer');
  if (fromLink) {
    localStorage.setItem(KEY, fromLink);
    return fromLink;
  }
  const saved = localStorage.getItem(KEY);
  if (saved) return saved;

  const fresh = randomId();
  localStorage.setItem(KEY, fresh);
  return fresh;
}
