// src/firebase.ts

// Funzioni necessarie dall'SDK di Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// La TUA configurazione Firebase che hai fornito
const firebaseConfig = {
  apiKey: "AIzaSyAiW5zJjmA-J68X5pB9yuMKEhr7AQtK0yY",
  authDomain: "mio-report-fitness.firebaseapp.com",
  projectId: "mio-report-fitness",
  storageBucket: "mio-report-fitness.firebasestorage.app",
  messagingSenderId: "829870098198",
  appId: "1:829870098198:web:fceb94133793f75e73b237",
  measurementId: "G-34PRTFD0YK"
};

// Inizializza i servizi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Esporta i servizi per poterli usare nel resto dell'app
export { app, auth, db, analytics };