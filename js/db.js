// Initialisation Firebase + Firestore, avec cache hors-ligne.
// Expose la collection des événements du foyer courant.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { getFoyerId } from './foyer.js';

const app = initializeApp(firebaseConfig);

// Cache local persistant → l'app marche hors-ligne et se resynchronise
// automatiquement au retour du réseau.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const foyerId = getFoyerId();

// Chemin : foyers/{foyerId}/events  (cf. règles de sécurité Firestore)
export const eventsCol = collection(db, 'foyers', foyerId, 'events');
