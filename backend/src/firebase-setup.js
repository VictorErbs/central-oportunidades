import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  push, 
  update, 
  remove,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { config } from './config.js';
import crypto from 'crypto';

const app = initializeApp(config.firebase);
const db = getDatabase(app);

/**
 * Cria um novo usuário no banco de dados
 * @param {Object} userData - Dados do usuário
 * @returns {Promise<Object>} Usuário criado com ID
 */
const createUser = async (userData) => {
  const usersRef = ref(db, 'users');
  const newUserRef = push(usersRef);
  
  await set(newUserRef, userData);
  
  return { id: newUserRef.key, ...userData };
};

/**
 * Busca usuário por email
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|null>} Dados do usuário ou null
 */
const findUserByEmail = async (email) => {
  const usersRef = ref(db, 'users');
  const queryRef = query(usersRef, orderByChild('email'), equalTo(email));
  
  const snapshot = await get(queryRef);
  
  if (snapshot.exists()) {
    const userData = snapshot.val();
    const userId = Object.keys(userData)[0];
    const user = userData[userId];
    return { id: userId, ...user };
  }
  return null;
};

/**
 * Busca usuário por ID
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} Dados do usuário ou null
 */
const findUserById = async (userId) => {
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  
  return snapshot.exists() ? { id: userId, ...snapshot.val() } : null;
};

/**
 * Atualiza dados do usuário
 * @param {string} userId - ID do usuário
 * @param {Object} updates - Campos para atualizar
 * @returns {Promise<void>}
 */
const updateUserData = async (userId, updates) => {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, updates);
};

/**
 * Remove um token
 * @param {string} token - Token a ser removido
 * @returns {Promise<void>}
 */
const removeToken = async (token) => {
  // Decodificar o token para pegar o userId
  const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  const userId = decodedToken.userId;
  
  const tokenRef = ref(db, `tokens/${userId}`);
  await remove(tokenRef);
};

export {
  db,
  createUser,
  findUserByEmail,
  findUserById,
  updateUserData,
  removeToken,
  ref,
  get,
  set,
  push,
  update,
  remove
};