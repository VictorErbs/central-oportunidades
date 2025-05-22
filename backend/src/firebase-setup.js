const { initializeApp } = require("firebase/app");
const {
  getDatabase,
  ref,
  set,
  onValue,
  update,
  remove,
  get,
  push,
  query,
  orderByChild,
  equalTo,
  serverTimestamp
} = require("firebase/database");

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

let app;
let db;

try {
  // Inicializa o Firebase e o Realtime Database
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log('Firebase inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  throw new Error('Falha na inicialização do Firebase: ' + error.message);
}

// Funções de validação
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Email inválido');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Formato de email inválido');
  }
};

const validateUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    throw new Error('Dados do usuário inválidos');
  }
  if (!userData.email) {
    throw new Error('Email é obrigatório');
  }
  validateEmail(userData.email);
};

// Funções do Firebase
const firebaseFunctions = {
  // Função para buscar usuário por email
  findUserByEmail: async (email) => {
    try {
      validateEmail(email);
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const users = snapshot.val();
      const user = Object.entries(users).find(([_, userData]) => userData.email === email);
      
      if (!user) {
        return null;
      }

      return { id: user[0], ...user[1] };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw new Error("Erro ao buscar usuário: " + error.message);
    }
  },

  // Função para criar novo usuário
  createUser: async (userData) => {
    try {
      validateUserData(userData);
      
      // Verifica se o usuário já existe
      const existingUser = await firebaseFunctions.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Usuário já existe com este email');
      }

      const usersRef = ref(db, "users");
      const newUserRef = push(usersRef);
      
      const userToSave = {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await set(newUserRef, userToSave);
      return { id: newUserRef.key, ...userData };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error("Erro ao criar usuário: " + error.message);
    }
  },

  // Função para atualizar dados do usuário
  updateUserData: async (userId, newData) => {
    try {
      if (!userId) {
        throw new Error('ID do usuário é obrigatório');
      }

      const userRef = ref(db, "users/" + userId);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const updateData = {
        ...newData,
        updatedAt: serverTimestamp()
      };

      await update(userRef, updateData);
      const updatedSnapshot = await get(userRef);
      return updatedSnapshot.val();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      throw new Error("Erro ao atualizar dados: " + error.message);
    }
  },

  // Função para salvar token
  saveToken: async (token, userId) => {
    try {
      if (!token || !userId) {
        throw new Error('Token e ID do usuário são obrigatórios');
      }

      const tokenRef = ref(db, "tokens/" + token);
      const tokenData = {
        userId,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp()
      };

      await set(tokenRef, tokenData);
      return true;
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      throw new Error("Erro ao salvar token: " + error.message);
    }
  },

  // Função para remover token
  removeToken: async (token) => {
    try {
      if (!token) {
        throw new Error('Token é obrigatório');
      }

      const tokenRef = ref(db, "tokens/" + token);
      const snapshot = await get(tokenRef);
      
      if (!snapshot.exists()) {
        throw new Error('Token não encontrado');
      }

      await remove(tokenRef);
      return true;
    } catch (error) {
      console.error('Erro ao remover token:', error);
      throw new Error("Erro ao remover token: " + error.message);
    }
  },

  // Função para verificar token
  verifyToken: async (token) => {
    try {
      if (!token) {
        throw new Error('Token é obrigatório');
      }

      const tokenRef = ref(db, "tokens/" + token);
      const snapshot = await get(tokenRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      // Atualiza o último uso do token
      await update(tokenRef, {
        lastUsed: serverTimestamp()
      });

      return snapshot.val();
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      throw new Error("Erro ao verificar token: " + error.message);
    }
  }
};

// Exporta todas as funções necessárias
module.exports = {
  firebaseConfig,
  db,
  ref,
  get,
  set,
  update,
  remove,
  push,
  query,
  orderByChild,
  equalTo,
  serverTimestamp,
  ...firebaseFunctions
};
