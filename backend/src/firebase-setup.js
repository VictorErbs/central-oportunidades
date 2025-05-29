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

console.log('Iniciando configuração do Firebase...');
console.log('Configurações:', {
  projectId: config.firebase.projectId,
  databaseURL: config.firebase.databaseURL
});

const app = initializeApp(config.firebase);
const db = getDatabase(app);

console.log('Firebase inicializado com sucesso');

// Funções auxiliares para tratamento de erros
const handleDatabaseError = (error, operation) => {
  console.error(`Erro na operação ${operation}:`, error.message);
  console.error('Stack trace:', error.stack);
  console.error('Detalhes do erro:', {
    code: error.code,
    name: error.name,
    message: error.message
  });
  throw error;
};

/**
 * Cria um novo usuário no banco de dados
 * @param {Object} userData - Dados do usuário
 * @returns {Promise<Object>} Usuário criado com ID
 */
const createUser = async (userData) => {
  console.log('Criando novo usuário:', { email: userData.email, username: userData.username });
  try {
    const usersRef = ref(db, 'users');
    const newUserRef = push(usersRef);
    console.log('Referência do usuário criada:', newUserRef.key);
    
    await set(newUserRef, userData);
    console.log('Usuário criado com sucesso:', newUserRef.key);
    
    return { id: newUserRef.key, ...userData };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    handleDatabaseError(error, 'createUser');
  }
};

/**
 * Busca usuário por email
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|null>} Dados do usuário ou null
 */
const findUserByEmail = async (email) => {
  console.log('Buscando usuário por email:', email);
  try {
    const usersRef = ref(db, 'users');
    const queryRef = query(usersRef, orderByChild('email'), equalTo(email));
    console.log('Query criada, buscando dados...');
    
    const snapshot = await get(queryRef);
    console.log('Snapshot recebido:', snapshot.exists() ? 'Usuário encontrado' : 'Usuário não encontrado');
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const userId = Object.keys(userData)[0];
      const user = userData[userId];
      console.log('Usuário encontrado:', {
        id: userId,
        email: user.email,
        hasPassword: !!user.password
      });
      return { id: userId, ...user };
    }
    console.log('Nenhum usuário encontrado com este email');
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    handleDatabaseError(error, 'findUserByEmail');
  }
};

/**
 * Busca usuário por ID
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} Dados do usuário ou null
 */
const findUserById = async (userId) => {
  console.log('Buscando usuário por ID:', userId);
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    console.log('Snapshot recebido:', snapshot.exists() ? 'Usuário encontrado' : 'Usuário não encontrado');
    
    return snapshot.exists() ? { id: userId, ...snapshot.val() } : null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    handleDatabaseError(error, 'findUserById');
  }
};

/**
 * Atualiza dados do usuário
 * @param {string} userId - ID do usuário
 * @param {Object} updates - Campos para atualizar
 * @returns {Promise<void>}
 */
const updateUserData = async (userId, updates) => {
  console.log('Atualizando dados do usuário:', { userId, updates });
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, updates);
    console.log('Dados do usuário atualizados com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    handleDatabaseError(error, 'updateUserData');
  }
};

/**
 * Remove um token
 * @param {string} token - Token a ser removido
 * @returns {Promise<void>}
 */
const removeToken = async (token) => {
  console.log('Removendo token');
  try {
    // Decodificar o token para pegar o userId
    const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userId = decodedToken.userId;
    
    console.log('ID do usuário do token:', userId);
    const tokenRef = ref(db, `tokens/${userId}`);
    await remove(tokenRef);
    console.log('Token removido com sucesso');
  } catch (error) {
    console.error('Erro ao remover token:', error);
    handleDatabaseError(error, 'removeToken');
  }
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