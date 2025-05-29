import dotenv from 'dotenv';

dotenv.config();

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

export const config = {
  firebase: firebaseConfig,
  jwt: {
    secret: 'pLt3Bb6nGUvX+W97zTfMuI7XgqK0IExWML6AhdDe2eY=',
    expiresIn: '24h',
    algorithm: 'HS256'
  },
  api: {
    url: 'http://localhost:3001',
  },
  server: {
    port: 3001,
  },
  bcrypt: {
    saltRounds: 10
  }
}; 