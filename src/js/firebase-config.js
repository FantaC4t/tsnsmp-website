// ─────────────────────────────────────────────────────────
//  FILL IN YOUR FIREBASE PROJECT DETAILS BELOW
//  Firebase console → Project settings → Your apps → Config
// ─────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyC1Bt0frG8r97Io8uOdhVIjM3nK4deY2Pc", // Retrieve from Firebase console
    authDomain:        "tsnplayerlist.firebaseapp.com",
    databaseURL:       "https://tsnplayerlist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:         "tsnplayerlist",
    storageBucket:     "tsnplayerlist.firebasestorage.app",
    messagingSenderId: "961848779374", // Retrieve from Firebase console
    appId:             "1:961848779374:web:1be1f6422bc091564f3c7f" // Retrieve from Firebase console
};

firebase.initializeApp(firebaseConfig);
