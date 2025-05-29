import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './src/config.js';
import {
  db,
  createUser,
  findUserByEmail,
  updateUserData,
  ref,
  get,
  set,
  push
} from './src/firebase-setup.js';

const app = express();
const port = config.server.port;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Funções de validação
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  return password.length >= 8;
}

// Função para criar um perfil padrão
function createDefaultProfile(userType) {
  return {
    fullName: '',
    bio: '',
    location: '',
    education: '',
    skills: [],
    socialMedia: { linkedin: '', instagram: '', github: '', twitter: '' },
    interests: [],
    savedOpportunities: [],
    applications: [],
    userType,
    createdAt: new Date().toISOString()
  };
}

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    const decoded = jwt.verify(token, config.jwt.secret);
    const userRef = ref(db, `users/${decoded.userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    req.user = { id: decoded.userId, ...snapshot.val() };
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    const message = error.name === 'TokenExpiredError' 
      ? 'Token expirado' 
      : 'Token inválido';
    res.status(401).json({ message });
  }
};

const employerMiddleware = (req, res, next) => {
  if (req.user.profile.userType !== 'Empregador') {
    return res.status(403).json({ 
      message: 'Acesso restrito a empregadores' 
    });
  }
  next();
};

// Rotas de autenticação
const authRoutes = express.Router();

authRoutes.post('/register', async (req, res) => {
  try {
    const { username, password, email, userType } = req.body;
    const requiredFields = { username, password, email, userType };

    // Validação de campos
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        fields: missingFields
      });
    }

    if (!['Jovem', 'Empregador'].includes(userType)) {
      return res.status(400).json({ 
        error: 'Tipo de usuário inválido',
        validTypes: ['Jovem', 'Empregador']
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        error: 'Senha deve ter no mínimo 8 caracteres'
      });
    }

    if (await findUserByEmail(email)) {
      return res.status(409).json({ 
        error: 'Email já cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const newUser = await createUser({
      username,
      password: hashedPassword,
      email,
      profile: createDefaultProfile(userType)
    });

    // Geração do token JWT
    const token = jwt.sign({ userId: newUser.id }, config.jwt.secret, { 
      expiresIn: '1h' 
    });

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        profile: newUser.profile
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, { 
      expiresIn: '1h' 
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

authRoutes.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Rotas de perfil
const profileRoutes = express.Router();

profileRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    // Dados do usuário já estão disponíveis via middleware
    res.json(req.user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

profileRoutes.put('/', authMiddleware, async (req, res) => {
  try {
    // Atualiza apenas campos fornecidos
    const updates = {};
    const validFields = [
      'fullName', 'bio', 'location', 'education', 
      'skills', 'socialMedia', 'interests'
    ];

    Object.keys(req.body).forEach(key => {
      if (validFields.includes(key)) {
        updates[`profile/${key}`] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
    }

    await updateUserData(req.user.id, updates);
    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Rotas de oportunidades
const opportunityRoutes = express.Router();

// Cache simples para oportunidades
let opportunitiesCache = null;
let cacheTimestamp = 0;

opportunityRoutes.get('/', async (req, res) => {
  try {
    const { busca, type, location } = req.query;
    
    // Cache de 5 minutos
    if (!opportunitiesCache || Date.now() - cacheTimestamp > 300000) {
      const snapshot = await get(ref(db, 'opportunities'));
      opportunitiesCache = snapshot.exists() 
        ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }))
        : [];
      cacheTimestamp = Date.now();
    }

    let results = [...opportunitiesCache];

    // Filtros
    if (busca) {
      const searchTerm = busca.toLowerCase();
      results = results.filter(opp => 
        opp.title.toLowerCase().includes(searchTerm) ||
        opp.description.toLowerCase().includes(searchTerm) ||
        opp.company.toLowerCase().includes(searchTerm)
      );
    }

    if (type) {
      results = results.filter(opp => 
        opp.type.toLowerCase() === type.toLowerCase()
      );
    }

    if (location) {
      results = results.filter(opp => 
        opp.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Ordenação
    results.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

opportunityRoutes.get('/saved', authMiddleware, async (req, res) => {
  try {
    const savedIds = req.user.profile.savedOpportunities || [];
    if (savedIds.length === 0) return res.json([]);

    const opportunitiesRef = ref(db, 'opportunities');
    const snapshot = await get(opportunitiesRef);
    
    if (!snapshot.exists()) return res.json([]);

    const opportunities = Object.entries(snapshot.val())
      .filter(([id]) => savedIds.includes(id))
      .map(([id, data]) => ({ id, ...data }));

    res.json(opportunities);
  } catch (error) {
    console.error('Erro ao buscar oportunidades salvas:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

opportunityRoutes.post('/save/:id', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const opportunityId = req.params.id;
    
    // Verificar se oportunidade existe
    const opportunityRef = ref(db, `opportunities/${opportunityId}`);
    const snapshot = await get(opportunityRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    // Atualizar lista de salvos
    const saved = [...new Set([
      ...(req.user.profile.savedOpportunities || []), 
      opportunityId
    ])];

    await updateUserData(userId, {
      'profile/savedOpportunities': saved
    });

    res.json({ 
      message: 'Oportunidade salva com sucesso',
      savedOpportunities: saved
    });
  } catch (error) {
    console.error('Erro ao salvar oportunidade:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

opportunityRoutes.post('/apply/:id', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const opportunityId = req.params.id;
    
    // Verificar se oportunidade existe
    const opportunityRef = ref(db, `opportunities/${opportunityId}`);
    const snapshot = await get(opportunityRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    // Evitar candidaturas duplicadas
    const existingApplication = (req.user.profile.applications || [])
      .some(app => app.opportunityId === opportunityId);
    
    if (existingApplication) {
      return res.status(409).json({ 
        error: 'Candidatura já realizada' 
      });
    }

    const newApplication = {
      opportunityId,
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    const applications = [
      ...(req.user.profile.applications || []),
      newApplication
    ];

    await updateUserData(userId, {
      'profile/applications': applications
    });

    res.json({ 
      message: 'Candidatura realizada com sucesso',
      application: newApplication
    });
  } catch (error) {
    console.error('Erro ao aplicar para oportunidade:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

opportunityRoutes.get('/applications', authMiddleware, async (req, res) => {
  try {
    const applications = req.user.profile.applications || [];
    if (applications.length === 0) return res.json([]);

    const opportunitiesRef = ref(db, 'opportunities');
    const snapshot = await get(opportunitiesRef);
    
    if (!snapshot.exists()) return res.json([]);

    const opportunities = snapshot.val();
    const result = applications.map(app => {
      const opp = opportunities[app.opportunityId];
      return {
        ...app,
        opportunity: opp ? {
          id: app.opportunityId,
          title: opp.title,
          company: opp.company,
          type: opp.type
        } : null
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar candidaturas:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

opportunityRoutes.post('/', authMiddleware, employerMiddleware, async (req, res) => {
  try {
    const { title, description, type, location, salary, requirements, company } = req.body;
    const requiredFields = { title, description, type, location, company };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        fields: missingFields
      });
    }

    const opportunity = {
      title,
      description,
      type,
      location,
      salary: salary || '',
      requirements: requirements || [],
      company,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    const newOpportunityRef = ref(db, 'opportunities');
    const newRef = push(newOpportunityRef);
    await set(newRef, opportunity);

    // Invalidar cache
    opportunitiesCache = null;

    res.status(201).json({
      message: 'Vaga criada com sucesso',
      opportunity: {
        id: newRef.key,
        ...opportunity
      }
    });
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Registrando as rotas
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/opportunities', opportunityRoutes);

// Rota de health check
app.get('/health', async (req, res) => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      users: snapshot.exists() ? Object.keys(snapshot.val()).length : 0
    });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({ status: 'error' });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado'
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});