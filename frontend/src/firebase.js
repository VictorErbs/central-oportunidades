import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAHnb4hdTMkZpd5cWwbTBlIN-Dm1YNOWdY",
  authDomain: "apifaculdade.firebaseapp.com",
  databaseURL: "https://apifaculdade-default-rtdb.firebaseio.com",
  projectId: "apifaculdade",
  storageBucket: "apifaculdade.firebasestorage.app",
  messagingSenderId: "1064072295404",
  appId: "1:1064072295404:web:3dbcfd9d6ed14d39e746c9",
  measurementId: "G-0BHR81893G"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db }; 