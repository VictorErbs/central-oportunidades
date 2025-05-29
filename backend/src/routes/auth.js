import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { createUser, findUserByEmail, findUserById } from '../firebase-setup.js';

const router = express.Router();

// Middleware para log de requisições
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
};

router.use(logRequest);

// Login
router.post('/login', async (req, res) => {
  console.log('=== INÍCIO DO PROCESSO DE LOGIN ===');
  try {
    const { email, password } = req.body;
    console.log('Dados recebidos:', { email, hasPassword: !!password });

    // Validação básica
    if (!email || !password) {
      console.log('Dados inválidos - campos obrigatórios faltando');
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário por email
    console.log('Buscando usuário no banco...');
    const user = await findUserByEmail(email);
    
    if (!user) {
      console.log('Usuário não encontrado no banco');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    console.log('Usuário encontrado:', {
      id: user.id,
      email: user.email,
      username: user.username
    });

    // Verificar senha
    console.log('Verificando senha...');
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Resultado da verificação de senha:', validPassword);

    if (!validPassword) {
      console.log('Senha inválida');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    console.log('Gerando token JWT...');
    const tokenPayload = {
      userId: user.id,
      email: user.email
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm
    });
    console.log('Token gerado com sucesso');

    // Remover senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = user;

    console.log('=== LOGIN REALIZADO COM SUCESSO ===');
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('=== ERRO NO PROCESSO DE LOGIN ===');
    console.error('Erro:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao realizar login',
      details: error.message 
    });
  }
});

// Registro de usuário
router.post('/register', async (req, res) => {
  console.log('=== INÍCIO DO PROCESSO DE REGISTRO ===');
  try {
    const { email, password, username } = req.body;
    console.log('Dados recebidos:', { email, username, hasPassword: !!password });

    // Validação básica
    if (!email || !password || !username) {
      console.log('Dados inválidos - campos obrigatórios faltando');
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verificar se usuário já existe
    console.log('Verificando se email já está cadastrado...');
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log('Email já cadastrado:', email);
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    console.log('Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    console.log('Hash gerado com sucesso');

    // Criar usuário
    console.log('Criando novo usuário...');
    const userData = {
      email,
      password: hashedPassword,
      username,
      createdAt: new Date().toISOString()
    };

    const user = await createUser(userData);
    console.log('Usuário criado com sucesso:', user.id);

    // Gerar token
    console.log('Gerando token JWT...');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.expiresIn,
        algorithm: config.jwt.algorithm
      }
    );
    console.log('Token gerado com sucesso');

    console.log('=== REGISTRO REALIZADO COM SUCESSO ===');
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
    console.error('=== ERRO NO PROCESSO DE REGISTRO ===');
    console.error('Erro:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Middleware de autenticação
export const authenticateToken = async (req, res, next) => {
  console.log('=== VERIFICANDO AUTENTICAÇÃO ===');
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    console.log('Verificando token JWT...');
    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('Token decodificado:', decoded);

    console.log('Buscando usuário no banco...');
    const user = await findUserById(decoded.userId);
    if (!user) {
      console.log('Usuário não encontrado:', decoded.userId);
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    console.log('Usuário autenticado:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

export default router; 