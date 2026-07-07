// Shared Firebase (modular SDK) client — initialized once and imported by
// every page that needs it, instead of each page loading its own copy of the
// legacy `-compat` CDN bundles. Ordering is guaranteed by ES module import
// semantics: any page that imports { db } (etc.) from here is guaranteed
// initializeApp() has already run, since ES modules execute their imports'
// top-level code before their own — no more classic-script/document-order
// tricks needed (see Layout.astro history for what that used to require).
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey:            'AIzaSyC1Bt0frG8r97Io8uOdhVIjM3nK4deY2Pc',
    authDomain:        'tsnplayerlist.firebaseapp.com',
    databaseURL:       'https://tsnplayerlist-default-rtdb.europe-west1.firebasedatabase.app',
    projectId:         'tsnplayerlist',
    storageBucket:     'tsnplayerlist.firebasestorage.app',
    messagingSenderId: '961848779374',
    appId:             '1:961848779374:web:1be1f6422bc091564f3c7f',
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
