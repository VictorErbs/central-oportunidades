const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { 
  db, 
  createUser, 
  findUserByEmail, 
  updateUserData, 
  saveToken, 
  removeToken, 
  verifyToken,
  ref,
  get
} = require('./src/firebase-setup');

const app = express();
const port = process.env.PORT || 3001;

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
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

// Função para criar um perfil padrão
function createDefaultProfile() {
  return {
    fullName: '',
    bio: '',
    location: '',
    education: '',
    skills: [],
    socialMedia: {
      linkedin: '',
      instagram: '',
      github: '',
      twitter: ''
    },
    interests: [],
    savedOpportunities: [],
    applications: [],
    createdAt: new Date().toISOString()
  };
}

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.userId = tokenData.userId;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ message: 'Erro na autenticação' });
  }
};

// Rotas de autenticação
const authRoutes = express.Router();

authRoutes.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios',
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Email inválido',
        message: 'Por favor, forneça um email válido'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        error: 'Senha inválida',
        message: 'A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números'
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email já cadastrado',
        message: 'Este email já está cadastrado'
      });
    }

    const newUser = await createUser({
      username,
      password, // Em produção, deve-se usar hash da senha
      email,
      profile: createDefaultProfile()
    });

    res.status(201).json({ 
      message: 'Usuário cadastrado com sucesso',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        profile: newUser.profile
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro no cadastro',
      message: 'Ocorreu um erro ao realizar o cadastro'
    });
  }
});

authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios',
        message: 'Email e senha são obrigatórios'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Email inválido',
        message: 'Por favor, forneça um email válido'
      });
    }

    const user = await findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    const token = Math.random().toString(36).substring(2);
    await saveToken(token, user.id);

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
    res.status(500).json({ 
      error: 'Erro no login',
      message: 'Ocorreu um erro ao realizar o login'
    });
  }
});

authRoutes.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await removeToken(token);
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro no logout',
      message: 'Ocorreu um erro ao realizar o logout'
    });
  }
});

// Rotas de perfil
const profileRoutes = express.Router();

profileRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const userRef = ref(db, `users/${req.userId}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(snapshot.val());
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

profileRoutes.put('/', authMiddleware, async (req, res) => {
  try {
    const updatedUser = await updateUserData(req.userId, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// Rotas de oportunidades
const opportunityRoutes = express.Router();

opportunityRoutes.get('/', async (req, res) => {
  try {
    const { busca, type, location } = req.query;
    const opportunitiesRef = ref(db, 'opportunities');
    const snapshot = await get(opportunitiesRef);
    
    if (!snapshot.exists()) {
      return res.json([]);
    }

    let opportunities = Object.entries(snapshot.val()).map(([id, data]) => ({
      id,
      ...data
    }));

    if (busca) {
      const searchTerm = busca.toLowerCase();
      opportunities = opportunities.filter(opp =>
        opp.title.toLowerCase().includes(searchTerm) ||
        opp.description.toLowerCase().includes(searchTerm) ||
        opp.company.toLowerCase().includes(searchTerm) ||
        opp.type.toLowerCase().includes(searchTerm)
      );
    }

    if (type) {
      opportunities = opportunities.filter(opp =>
        opp.type.toLowerCase() === type.toLowerCase()
      );
    }

    if (location) {
      opportunities = opportunities.filter(opp =>
        opp.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    opportunities.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar oportunidades',
      message: 'Ocorreu um erro ao buscar as oportunidades'
    });
  }
});

opportunityRoutes.get('/saved', authMiddleware, async (req, res) => {
  try {
    const user = await findUserByEmail(req.userId);
    if (!user || !user.profile.savedOpportunities) {
      return res.json([]);
    }

    const opportunitiesRef = ref(db, 'opportunities');
    const opportunitiesSnapshot = await get(opportunitiesRef);
    
    if (!opportunitiesSnapshot.exists()) {
      return res.json([]);
    }

    const opportunities = Object.entries(opportunitiesSnapshot.val())
      .filter(([id]) => user.profile.savedOpportunities.includes(id))
      .map(([id, data]) => ({
        id,
        ...data
      }));

    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar oportunidades salvas',
      message: 'Ocorreu um erro ao buscar suas oportunidades salvas'
    });
  }
});

opportunityRoutes.post('/save/:id', authMiddleware, async (req, res) => {
  try {
    const user = await findUserByEmail(req.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar seu usuário'
      });
    }

    const opportunityRef = ref(db, 'opportunities/' + req.params.id);
    const opportunitySnapshot = await get(opportunityRef);

    if (!opportunitySnapshot.exists()) {
      return res.status(404).json({ 
        error: 'Oportunidade não encontrada',
        message: 'Esta oportunidade não existe mais'
      });
    }

    const savedOpportunities = user.profile.savedOpportunities || [];
    if (!savedOpportunities.includes(req.params.id)) {
      savedOpportunities.push(req.params.id);
      await updateUserData(user.id, {
        'profile/savedOpportunities': savedOpportunities
      });
    }

    res.json({ 
      message: 'Oportunidade salva com sucesso',
      savedOpportunities
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao salvar oportunidade',
      message: 'Ocorreu um erro ao salvar a oportunidade'
    });
  }
});

opportunityRoutes.post('/apply/:id', authMiddleware, async (req, res) => {
  try {
    const user = await findUserByEmail(req.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar seu usuário'
      });
    }

    const opportunityRef = ref(db, 'opportunities/' + req.params.id);
    const opportunitySnapshot = await get(opportunityRef);

    if (!opportunitySnapshot.exists()) {
      return res.status(404).json({ 
        error: 'Oportunidade não encontrada',
        message: 'Esta oportunidade não existe mais'
      });
    }

    const applications = user.profile.applications || [];
    if (applications.some(app => app.opportunityId === req.params.id)) {
      return res.status(400).json({ 
        error: 'Candidatura já realizada',
        message: 'Você já se candidatou a esta oportunidade'
      });
    }

    const application = {
      opportunityId: req.params.id,
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    applications.push(application);
    await updateUserData(user.id, {
      'profile/applications': applications
    });

    res.json({ 
      message: 'Candidatura realizada com sucesso',
      application
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao realizar candidatura',
      message: 'Ocorreu um erro ao processar sua candidatura'
    });
  }
});

opportunityRoutes.get('/applications', authMiddleware, async (req, res) => {
  try {
    const user = await findUserByEmail(req.userId);
    if (!user || !user.profile.applications) {
      return res.json([]);
    }

    const opportunitiesRef = ref(db, 'opportunities');
    const opportunitiesSnapshot = await get(opportunitiesRef);
    
    if (!opportunitiesSnapshot.exists()) {
      return res.json([]);
    }

    const opportunities = opportunitiesSnapshot.val();
    const applications = user.profile.applications.map(app => {
      const opportunity = opportunities[app.opportunityId];
      return {
        ...app,
        opportunity: opportunity ? {
          title: opportunity.title,
          company: opportunity.company,
          type: opportunity.type
        } : null
      };
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar candidaturas',
      message: 'Ocorreu um erro ao buscar suas candidaturas'
    });
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
    const tokensRef = ref(db, 'tokens');
    
    const [usersSnapshot, tokensSnapshot] = await Promise.all([
      get(usersRef),
      get(tokensRef)
    ]);

    const userCount = usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length : 0;
    const tokenCount = tokensSnapshot.exists() ? Object.keys(tokensSnapshot.val()).length : 0;

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      users: userCount,
      tokens: tokenCount
    });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar saúde do sistema',
      error: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Servidor backend rodando na porta ${port}`);
});
