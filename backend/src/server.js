import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import { authenticateToken } from './routes/auth.js';

const app = express();

// Middleware para log de requisições
app.use((req, res, next) => {
  next();
});

// Middleware para log de erros
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Configuração do CORS
app.use(cors({
  origin: config.apiUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing de JSON
app.use(express.json());

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rota protegida de exemplo
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Rota protegida acessada com sucesso' });
});

// Iniciar servidor
const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
  console.log('Configurações:', {
    apiUrl: config.apiUrl,
    projectId: config.firebase.projectId
  });
}); 