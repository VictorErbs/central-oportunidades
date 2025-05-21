const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();

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
  // Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula e um número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

// "Banco de dados" em memória
const users = [];
let tokens = [];

// Exemplo de dados para oportunidades
const opportunities = [
    { 
      id: 1, 
      title: "Estágio em Marketing Digital", 
      description: "Oportunidade de estágio para jovens em Olinda.",
      company: "Tech Solutions",
      location: "Olinda, PE",
      type: "Estágio",
      salary: "R$ 1.200,00",
      requirements: ["Conhecimento em redes sociais", "Inglês básico"],
      benefits: ["Vale transporte", "Vale refeição", "Plano de saúde"],
      createdAt: "2024-03-20",
      deadline: "2024-04-20",
      status: "active"
    },
    { 
      id: 2, 
      title: "Curso Gratuito de Programação", 
      description: "Aprenda a programar com cursos gratuitos para jovens.",
      company: "Escola de Tecnologia",
      location: "Online",
      type: "Curso",
      duration: "6 meses",
      requirements: ["Ensino médio completo"],
      benefits: ["Certificado", "Mentoria", "Networking"],
      createdAt: "2024-03-19",
      deadline: "2024-04-19",
      status: "active"
    },
    { 
      id: 3, 
      title: "Voluntariado em ONG", 
      description: "Ajude sua comunidade com oportunidades de voluntariado.",
      company: "ONG Social",
      location: "Olinda, PE",
      type: "Voluntário",
      duration: "Flexível",
      requirements: ["Disponibilidade de 4h semanais"],
      benefits: ["Certificado de voluntariado", "Experiência social"],
      createdAt: "2024-03-18",
      deadline: "2024-04-18",
      status: "active"
    },
    { 
      id: 4,
      title: "Desenvolvedor Web Júnior",
      description: "Vaga para desenvolvedor web em ambiente startup, trabalhando com tecnologias modernas.",
      company: "InnovaTech",
      location: "Olinda, PE",
      type: "Emprego",
      salary: "R$ 2.500,00",
      requirements: ["Conhecimento em JavaScript", "React ou Angular", "HTML/CSS"],
      benefits: ["Vale transporte", "Auxílio alimentação", "Seguro de vida"],
      createdAt: "2024-11-15",
      deadline: "2025-08-15",
      status: "active"
    },
    { 
      id: 5,
      title: "Mentoria para Jovens Empreendedores",
      description: "Programa de mentoria para jovens que desejam iniciar seus próprios negócios.",
      company: "Empreenda Olinda",
      location: "Olinda, PE",
      type: "Mentoria",
      duration: "4 meses",
      requirements: ["Ideia de negócio", "Proatividade"],
      benefits: ["Networking com empreendedores", "Workshops"],
      createdAt: "2024-12-01",
      deadline: "2025-09-30",
      status: "active"
    },
    { 
      id: 6,
      title: "Estágio em Desenvolvimento de Software",
      description: "Programa de estágio para jovens talentos que desejam iniciar carreira em desenvolvimento de software.",
      company: "InovaSoft",
      location: "Olinda, PE",
      type: "Estágio",
      salary: "R$ 1.500,00",
      requirements: ["Conhecimento básico em programação", "Lógica de programação"],
      benefits: ["Vale transporte", "Curso de aperfeiçoamento"],
      createdAt: "2024-12-15",
      deadline: "2025-10-20",
      status: "active"
    },
    { 
      id: 7,
      title: "Workshop de Inovação e Tecnologia",
      description: "Participe de workshops presenciais que exploram inovação e tecnologia com profissionais do setor.",
      company: "InovaLab",
      location: "Olinda, PE",
      type: "Workshop",
      duration: "2 dias",
      requirements: ["Interesse por inovação", "Disponibilidade nas datas"],
      benefits: ["Certificação", "Rede de contatos"],
      createdAt: "2025-01-05",
      deadline: "2025-10-05",
      status: "active"
    },
    {
      id: 8,
      title: "Analista de Dados Júnior",
      description: "Oportunidade para atuar com análise de dados em uma empresa inovadora.",
      company: "Data Insights",
      location: "Olinda, PE",
      type: "Emprego",
      salary: "R$ 3.000,00",
      requirements: ["Conhecimento em SQL", "Excel avançado", "Noções em Python"],
      benefits: ["Assistência médica", "Vale transporte", "Participação nos lucros"],
      createdAt: "2024-12-20",
      deadline: "2025-09-15",
      status: "active"
    },
    {
      id: 9,
      title: "Programa de Bolsas em Design",
      description: "Programa destinado a jovens talentos em design gráfico com bolsas integrais.",
      company: "Design Olinda",
      location: "Olinda, PE",
      type: "Bolsa",
      duration: "1 ano",
      requirements: ["Portfólio de design", "Ensino médio completo"],
      benefits: ["Bolsa de estudos", "Mentoria com profissionais"],
      createdAt: "2024-11-30",
      deadline: "2025-11-30",
      status: "active"
    },
    {
      id: 10,
      title: "Oficina de Empreendedorismo",
      description: "Oficina prática com foco em criação de startups e modelos de negócios inovadores.",
      company: "Startup Lab",
      location: "Olinda, PE",
      type: "Workshop",
      duration: "3 dias",
      requirements: ["Ideia inovadora", "Vontade de aprender"],
      benefits: ["Networking", "Certificado"],
      createdAt: "2024-12-05",
      deadline: "2025-10-31",
      status: "active"
    },
    {
      id: 11,
      title: "Trainee em Finanças",
      description: "Programa trainee para formação de profissionais na área financeira.",
      company: "Finance Corp",
      location: "Olinda, PE",
      type: "Trainee",
      salary: "R$ 2.800,00",
      requirements: ["Formação em Economia, Administração ou áreas afins", "Boa capacidade analítica"],
      benefits: ["Plano de carreira", "Treinamentos internos"],
      createdAt: "2024-12-10",
      deadline: "2025-09-20",
      status: "active"
    },
    {
      id: 12,
      title: "Estágio em Recursos Humanos",
      description: "Estágio que proporciona experiência na área de RH em uma empresa consolidada.",
      company: "RH Solutions",
      location: "Olinda, PE",
      type: "Estágio",
      salary: "R$ 1.100,00",
      requirements: ["Cursando Administração ou Psicologia", "Boa comunicação"],
      benefits: ["Vale transporte", "Auxílio alimentação"],
      createdAt: "2024-12-12",
      deadline: "2025-08-30",
      status: "active"
    },
    {
      id: 13,
      title: "Projeto de Inclusão Digital",
      description: "Projeto voltado para a inclusão digital de jovens, com treinamentos e oficinas práticas.",
      company: "TechInclusiva",
      location: "Olinda, PE",
      type: "Projeto",
      duration: "6 meses",
      requirements: ["Interesse em tecnologia", "Disponibilidade para treinamentos semanais"],
      benefits: ["Certificado", "Acesso a ferramentas digitais"],
      createdAt: "2024-12-15",
      deadline: "2025-08-15",
      status: "active"
    },
    {
      id: 14,
      title: "Bootcamp de Desenvolvimento Mobile",
      description: "Bootcamp intensivo para capacitar jovens na criação de aplicativos móveis.",
      company: "Mobile Makers",
      location: "Olinda, PE",
      type: "Bootcamp",
      duration: "8 semanas",
      requirements: ["Conhecimentos básicos em programação", "Disposição para aprender"],
      benefits: ["Certificação", "Mentorias", "Possibilidade de estágio"],
      createdAt: "2024-12-18",
      deadline: "2025-10-10",
      status: "active"
    },
    {
      id: 15,
      title: "Programa de Capacitação em E-commerce",
      description: "Curso de capacitação visando preparar jovens para o mercado de e-commerce.",
      company: "Digital Store",
      location: "Online",
      type: "Curso",
      duration: "3 meses",
      requirements: ["Interesse em vendas online e marketing digital"],
      benefits: ["Certificado", "Aulas ao vivo", "Suporte pós-curso"],
      createdAt: "2024-12-20",
      deadline: "2025-11-15",
      status: "active"
    },
    {
      id: 16,
      title: "Desenvolvedor Frontend Pleno",
      description: "Vaga para desenvolvedor frontend de nível pleno, focado em projetos web modernos.",
      company: "Web Innovators",
      location: "Olinda, PE",
      type: "Emprego",
      salary: "R$ 4.000,00",
      requirements: ["Experiência com React", "Conhecimento em CSS e HTML", "JavaScript avançado"],
      benefits: ["Vale transporte", "Seguro saúde", "Bônus trimestral"],
      createdAt: "2024-12-22",
      deadline: "2025-11-05",
      status: "active"
    },
    {
      id: 17,
      title: "Concurso Cultural Jovem",
      description: "Participe do concurso cultural que destaca o talento dos jovens em Olinda.",
      company: "Cultura Jovem",
      location: "Olinda, PE",
      type: "Concurso",
      duration: "Evento único",
      requirements: ["Envio de produção artística", "Ser jovem da região"],
      benefits: ["Premiações em dinheiro", "Exposição em galerias"],
      createdAt: "2024-12-25",
      deadline: "2025-11-25",
      status: "active"
    }
  ];
  
  

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
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Token não fornecido',
        message: 'É necessário estar logado para acessar este recurso'
      });
    }
    const token = authHeader.replace('Bearer ', '');
    if (!tokens.includes(token)) {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Sua sessão expirou. Por favor, faça login novamente'
      });
    }
    req.token = token;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro de autenticação',
      message: 'Ocorreu um erro ao verificar sua autenticação'
    });
  }
};

// Rotas de autenticação
const authRoutes = express.Router();

authRoutes.post('/register', (req, res) => {
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

    if (users.find(u => u.username === username)) {
      return res.status(400).json({ 
        error: 'Usuário já existe',
        message: 'Este nome de usuário já está em uso'
      });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ 
        error: 'Email já cadastrado',
        message: 'Este email já está cadastrado'
      });
    }

    const newUser = {
      username,
      password,
      email,
      profile: createDefaultProfile()
    };
    users.push(newUser);
    res.status(201).json({ 
      message: 'Usuário cadastrado com sucesso',
      user: {
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

authRoutes.post('/login', (req, res) => {
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

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Garantir que o usuário tenha um perfil
    if (!user.profile) {
      user.profile = createDefaultProfile();
    }

    const token = Math.random().toString(36).substring(2);
    tokens.push(token);
    res.json({ 
      token,
      user: {
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

// Adicionar rota de logout
authRoutes.post('/logout', authMiddleware, (req, res) => {
  try {
    const token = req.token;
    tokens = tokens.filter(t => t !== token);
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

profileRoutes.put('/', authMiddleware, (req, res) => {
  try {
    const userIndex = users.findIndex(u => tokens.includes(req.token));
    
    if (userIndex === -1) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar seu usuário'
      });
    }

    const { profile } = req.body;
    
    if (profile.email && !isValidEmail(profile.email)) {
      return res.status(400).json({ 
        error: 'Email inválido',
        message: 'Por favor, forneça um email válido'
      });
    }

    users[userIndex].profile = { ...users[userIndex].profile, ...profile };
    
    res.json({ 
      message: 'Perfil atualizado com sucesso',
      profile: users[userIndex].profile
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao atualizar perfil',
      message: 'Ocorreu um erro ao atualizar seu perfil'
    });
  }
});

// Rotas de oportunidades
const opportunityRoutes = express.Router();

opportunityRoutes.get('/', (req, res) => {
  try {
    const { busca, type, location } = req.query;

    let filteredOpportunities = [...opportunities];

    if (busca) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.title.toLowerCase().includes(busca.toLowerCase()) ||
        opp.description.toLowerCase().includes(busca.toLowerCase()) ||
        opp.company.toLowerCase().includes(busca.toLowerCase()) ||
        opp.type.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (type) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.type.toLowerCase() === type.toLowerCase()
      );
    }

    if (location) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    filteredOpportunities.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(filteredOpportunities);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar oportunidades',
      message: 'Ocorreu um erro ao buscar as oportunidades'
    });
  }
});

opportunityRoutes.get('/saved', authMiddleware, (req, res) => {
  try {
    const user = users.find(u => tokens.includes(req.token));
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar seu usuário'
      });
    }

    const savedOpportunities = opportunities.filter(opp => 
      user.profile.savedOpportunities.includes(opp.id)
    );

    res.json(savedOpportunities);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar oportunidades salvas',
      message: 'Ocorreu um erro ao buscar suas oportunidades salvas'
    });
  }
});

opportunityRoutes.post('/save/:id', authMiddleware, (req, res) => {
  try {
    const userIndex = users.findIndex(u => tokens.includes(req.token));
    const opportunityId = parseInt(req.params.id);
    
    if (userIndex === -1) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar seu usuário'
      });
    }

    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return res.status(404).json({ 
        error: 'Oportunidade não encontrada',
        message: 'Esta oportunidade não existe mais'
      });
    }

    if (!users[userIndex].profile.savedOpportunities.includes(opportunityId)) {
      users[userIndex].profile.savedOpportunities.push(opportunityId);
    }

    res.json({ 
      message: 'Oportunidade salva com sucesso',
      savedOpportunities: users[userIndex].profile.savedOpportunities
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao salvar oportunidade',
      message: 'Ocorreu um erro ao salvar a oportunidade'
    });
  }
});

// Adicionar sistema de candidaturas
opportunityRoutes.post('/apply/:id', authMiddleware, (req, res) => {
  try {
    const userIndex = users.findIndex(u => tokens.includes(req.token));
    const opportunityId = parseInt(req.params.id);
    
    if (userIndex === -1) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar seu usuário'
      });
    }

    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return res.status(404).json({ 
        error: 'Oportunidade não encontrada',
        message: 'Esta oportunidade não existe mais'
      });
    }

    // Verificar se já se candidatou
    if (users[userIndex].profile.applications?.includes(opportunityId)) {
      return res.status(400).json({ 
        error: 'Candidatura já realizada',
        message: 'Você já se candidatou a esta oportunidade'
      });
    }

    // Adicionar candidatura
    if (!users[userIndex].profile.applications) {
      users[userIndex].profile.applications = [];
    }
    users[userIndex].profile.applications.push({
      opportunityId,
      status: 'pending',
      appliedAt: new Date().toISOString()
    });

    res.json({ 
      message: 'Candidatura realizada com sucesso',
      application: {
        opportunityId,
        status: 'pending',
        appliedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao realizar candidatura',
      message: 'Ocorreu um erro ao processar sua candidatura'
    });
  }
});

// Rota para listar candidaturas do usuário
opportunityRoutes.get('/applications', authMiddleware, (req, res) => {
  try {
    const user = users.find(u => tokens.includes(req.token));
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar seu usuário'
      });
    }

    const applications = (user.profile.applications || []).map(app => {
      const opportunity = opportunities.find(opp => opp.id === app.opportunityId);
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

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde'
  });
});

// Sistema de monitoramento de health check
let lastHealthCheck = {
  timestamp: new Date(),
  status: 'ok'
};

function checkHealth() {
  const currentTime = new Date();
  const timeSinceLastCheck = (currentTime - lastHealthCheck.timestamp) / 1000;

  if (timeSinceLastCheck >= 30) {
    console.log('------------------------');
    console.log(`[${currentTime.toISOString()}] Health Check - Status: ${lastHealthCheck.status}`);
    console.log(`Uptime: ${process.uptime()} segundos`);
    console.log(`Usuários ativos: ${users.length}`);
    console.log(`Tokens ativos: ${tokens.length}`);
    console.log('------------------------');

    lastHealthCheck = {
      timestamp: currentTime,
      status: 'ok'
    };
  }
}

// Iniciar o monitoramento
setInterval(checkHealth, 30000); // 30 segundos

// Rota de health check
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    users: users.length,
    activeTokens: tokens.length
  };
  res.json(healthData);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
