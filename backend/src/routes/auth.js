import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { createUser, findUserByEmail, findUserById } from '../firebase-setup.js';

const router = express.Router();

// Middleware para log de requisições
const logRequest = (req, res, next) => {
  next();
};

router.use(logRequest);

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário por email
    const user = await findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const tokenPayload = {
      userId: user.id,
      email: user.email
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm
    });

    // Remover senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao realizar login',
      details: error.message 
    });
  }
});

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validação básica
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verificar se usuário já existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Criar usuário
    const userData = {
      email,
      password: hashedPassword,
      username,
      createdAt: new Date().toISOString()
    };

    const user = await createUser(userData);

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.expiresIn,
        algorithm: config.jwt.algorithm
      }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Middleware de autenticação
export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

export default router; 