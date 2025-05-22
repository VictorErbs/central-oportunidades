import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { db } from './firebase';
import { ref, onValue, set, push, remove, update } from 'firebase/database';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Componente de feedback
function Feedback({ type, message, onClose }) {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  return (
    <div className={`feedback ${type}`}>
      <p>{message}</p>
      <button onClick={onClose} className="close-button">&times;</button>
    </div>
  );
}

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      const userData = {
        ...res.data.user,
        profile: res.data.user.profile || {
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
          savedOpportunities: []
        }
      };
      onLogin(res.data.token, userData);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Digite seu email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function Register({ onGoToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Por favor, insira um email válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        onGoToLogin();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Cadastro</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="username">Nome de Usuário</label>
          <input
            id="username"
            name="username"
            placeholder="Digite seu nome de usuário"
            value={formData.username}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Digite seu email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
          <small className="password-hint">
            A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Senha</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirme sua senha"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <button type="button" onClick={onGoToLogin} className="secondary-button">
          Já tenho conta
        </button>
      </form>
    </div>
  );
}

function Profile({ user, onUpdateProfile }) {
  const [profile, setProfile] = useState(user?.profile || {
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
    savedOpportunities: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar o perfil quando o usuário mudar
  useEffect(() => {
    if (user?.profile) {
      setProfile(user.profile);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(`${API_URL}/api/profile`, { profile }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      onUpdateProfile({ ...user, profile });
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Erro ao atualizar perfil'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="error">Usuário não encontrado</div>;
  }

  return (
    <div className="profile-container">
      <h2>Meu Perfil</h2>
      {message.text && (
        <Feedback
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: '', text: '' })}
        />
      )}
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="fullName">Nome completo</label>
            <input
              id="fullName"
              placeholder="Digite seu nome completo"
              value={profile.fullName || ''}
              onChange={e => setProfile({ ...profile, fullName: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Biografia</label>
            <textarea
              id="bio"
              placeholder="Conte um pouco sobre você"
              value={profile.bio || ''}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Localização</label>
            <input
              id="location"
              placeholder="Sua cidade"
              value={profile.location || ''}
              onChange={e => setProfile({ ...profile, location: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="education">Formação</label>
            <input
              id="education"
              placeholder="Sua formação acadêmica"
              value={profile.education || ''}
              onChange={e => setProfile({ ...profile, education: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="social-media">
            <h3>Redes Sociais</h3>
            <div className="form-group">
              <label htmlFor="linkedin">LinkedIn</label>
              <input
                id="linkedin"
                placeholder="URL do seu LinkedIn"
                value={profile.socialMedia?.linkedin || ''}
                onChange={e => setProfile({
                  ...profile,
                  socialMedia: { ...profile.socialMedia, linkedin: e.target.value }
                })}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="instagram">Instagram</label>
              <input
                id="instagram"
                placeholder="URL do seu Instagram"
                value={profile.socialMedia?.instagram || ''}
                onChange={e => setProfile({
                  ...profile,
                  socialMedia: { ...profile.socialMedia, instagram: e.target.value }
                })}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="github">GitHub</label>
              <input
                id="github"
                placeholder="URL do seu GitHub"
                value={profile.socialMedia?.github || ''}
                onChange={e => setProfile({
                  ...profile,
                  socialMedia: { ...profile.socialMedia, github: e.target.value }
                })}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="twitter">Twitter</label>
              <input
                id="twitter"
                placeholder="URL do seu Twitter"
                value={profile.socialMedia?.twitter || ''}
                onChange={e => setProfile({
                  ...profile,
                  socialMedia: { ...profile.socialMedia, twitter: e.target.value }
                })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="button-group">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="secondary-button"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-view">
          <div className="profile-header">
            <h3>{profile.fullName || user.username}</h3>
            <button onClick={() => setIsEditing(true)} className="edit-button">
              Editar Perfil
            </button>
          </div>
          <p className="bio">{profile.bio || 'Nenhuma biografia adicionada'}</p>
          <div className="profile-info">
            <p><strong>Localização:</strong> {profile.location || 'Não informado'}</p>
            <p><strong>Formação:</strong> {profile.education || 'Não informado'}</p>
          </div>
          <div className="social-links">
            {profile.socialMedia?.linkedin && (
              <a href={profile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            )}
            {profile.socialMedia?.instagram && (
              <a href={profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            )}
            {profile.socialMedia?.github && (
              <a href={profile.socialMedia.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            )}
            {profile.socialMedia?.twitter && (
              <a href={profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OpportunityCard({ opportunity, onSave, isSaved }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(opportunity.id);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const res = await axios.post(`${API_URL}/api/opportunities/apply/${opportunity.id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setApplicationStatus('pending');
    } catch (error) {
      console.error('Erro ao se candidatar:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div id={`opportunity-${opportunity.id}`} className="opportunity-card">
      <div className="opportunity-header">
        <h3>{opportunity.title}</h3>
        <div className="opportunity-actions">
          <button 
            onClick={handleApply}
            className={`apply-button ${applicationStatus ? 'applied' : ''}`}
            disabled={isApplying || applicationStatus}
          >
            {isApplying ? 'Candidatando...' : (applicationStatus ? 'Candidatado' : 'Candidatar-se')}
          </button>
          <button 
            onClick={handleSave}
            className={`save-button ${isSaved ? 'saved' : ''}`}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : (isSaved ? 'Salvo' : 'Salvar')}
          </button>
        </div>
      </div>
      <p className="company">{opportunity.company}</p>
      <p className="location">{opportunity.location}</p>
      <p className="type">{opportunity.type}</p>
      <p className="description">{opportunity.description}</p>
      {opportunity.salary && <p className="salary">{opportunity.salary}</p>}
      {opportunity.duration && <p className="duration">Duração: {opportunity.duration}</p>}
      <div className="requirements">
        <h4>Requisitos:</h4>
        <ul>
          {opportunity.requirements.map((req, index) => (
            <li key={index}>{req}</li>
          ))}
        </ul>
      </div>
      <div className="benefits">
        <h4>Benefícios:</h4>
        <ul>
          {opportunity.benefits.map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
      </div>
      <div className="opportunity-footer">
        <p className="deadline">Prazo: {new Date(opportunity.deadline).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

function Applications({ token }) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/opportunities/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
      setError('');
    } catch (error) {
      setError('Erro ao carregar candidaturas');
      console.error('Erro ao carregar candidaturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Carregando candidaturas...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (applications.length === 0) {
    return <div className="no-applications">Nenhuma candidatura encontrada</div>;
  }

  return (
    <div className="applications-container">
      <h2>Minhas Candidaturas</h2>
      <div className="applications-list">
        {applications.map(app => (
          <div key={app.opportunityId} className="application-card">
            <h3>{app.opportunity?.title}</h3>
            <p className="company">{app.opportunity?.company}</p>
            <p className="type">{app.opportunity?.type}</p>
            <p className="status">Status: {app.status}</p>
            <p className="date">Candidatura: {new Date(app.appliedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationEngine({ user, opportunities }) {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (user?.profile) {
      // Analisa o perfil do usuário e as oportunidades salvas
      const userSkills = user.profile.skills || [];
      const userInterests = user.profile.interests || [];
      const savedOpportunities = user.profile.savedOpportunities || [];

      // Calcula pontuação para cada oportunidade
      const scoredOpportunities = opportunities.map(opp => {
        let score = 0;
        
        // Pontua por tipo de oportunidade baseado em interesses
        if (userInterests.includes(opp.type)) {
          score += 3;
        }

        // Pontua por localização
        if (opp.location === user.profile.location) {
          score += 2;
        }

        // Pontua por habilidades requeridas
        const matchingSkills = opp.requirements.filter(req => 
          userSkills.some(skill => 
            skill.toLowerCase().includes(req.toLowerCase())
          )
        );
        score += matchingSkills.length;

        // Penaliza oportunidades já salvas
        if (savedOpportunities.includes(opp.id)) {
          score -= 5;
        }

        return { ...opp, score };
      });

      // Ordena por pontuação e pega as top 3
      const topRecommendations = scoredOpportunities
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setRecommendations(topRecommendations);
    }
  }, [user, opportunities]);

  const scrollToOpportunity = (opportunityId) => {
    const opportunityElement = document.getElementById(`opportunity-${opportunityId}`);
    if (opportunityElement) {
      opportunityElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      // Adiciona um destaque temporário
      opportunityElement.classList.add('highlight-opportunity');
      setTimeout(() => {
        opportunityElement.classList.remove('highlight-opportunity');
      }, 2000);
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="recommendations-container">
      <h3>Recomendadas para Você</h3>
      <div className="recommendations-grid">
        {recommendations.map(opp => (
          <div key={opp.id} className="recommendation-card">
            <h4>{opp.title}</h4>
            <p className="company">{opp.company}</p>
            <p className="match-score">
              {opp.score > 5 ? 'Alta compatibilidade' : 'Compatibilidade média'}
            </p>
            <button 
              className="view-button"
              onClick={() => scrollToOpportunity(opp.id)}
            >
              Ver Oportunidade
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Opportunities({ token, user, onLogout }) {
  const [opportunities, setOpportunities] = useState([]);
  const [savedOpportunities, setSavedOpportunities] = useState([]);
  const [filters, setFilters] = useState({
    busca: '',
    type: '',
    location: ''
  });
  const [activeTab, setActiveTab] = useState('todas');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOpportunities();
    loadSavedOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/opportunities`, {
        params: filters
      });
      setOpportunities(res.data);
      setError('');
    } catch (error) {
      setError('Erro ao carregar oportunidades');
      console.error('Erro ao carregar oportunidades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedOpportunities = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/opportunities/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedOpportunities(res.data);
    } catch (error) {
      console.error('Erro ao carregar oportunidades salvas:', error);
    }
  };

  const handleSaveOpportunity = async (id) => {
    try {
      await axios.post(`${API_URL}/api/opportunities/save/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSavedOpportunities();
    } catch (error) {
      console.error('Erro ao salvar oportunidade:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadOpportunities();
  };

  const displayedOpportunities = activeTab === 'salvas' ? savedOpportunities : opportunities;

  return (
    <div className="opportunities-container">
      <div className="opportunities-header">
        <h2>Oportunidades</h2>
        <button onClick={onLogout} className="logout-button">Sair</button>
      </div>
      
      {activeTab === 'todas' && (
        <RecommendationEngine user={user} opportunities={opportunities} />
      )}
      
      <form onSubmit={handleFilterSubmit} className="filters-form">
        <div className="filters-grid">
          <div className="form-group">
            <input
              name="busca"
              placeholder="Buscar oportunidades..."
              value={filters.busca}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>
          <div className="form-group">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Tipo de Oportunidade</option>
              <option value="Estágio">Estágio</option>
              <option value="Curso">Curso</option>
              <option value="Voluntário">Voluntário</option>
            </select>
          </div>
          <div className="form-group">
            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Localização</option>
              <option value="Olinda">Olinda</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <button type="submit" className="filter-button">Filtrar</button>
        </div>
      </form>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'todas' ? 'active' : ''}`}
          onClick={() => setActiveTab('todas')}
        >
          Todas as Oportunidades
        </button>
        <button
          className={`tab ${activeTab === 'salvas' ? 'active' : ''}`}
          onClick={() => setActiveTab('salvas')}
        >
          Oportunidades Salvas
        </button>
        <button
          className={`tab ${activeTab === 'candidaturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidaturas')}
        >
          Minhas Candidaturas
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      
      {isLoading ? (
        <div className="loading">Carregando oportunidades...</div>
      ) : activeTab === 'candidaturas' ? (
        <Applications token={token} />
      ) : displayedOpportunities.length === 0 ? (
        <div className="no-opportunities">
          Nenhuma oportunidade encontrada
        </div>
      ) : (
        <div className="opportunities-grid">
          {displayedOpportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSave={handleSaveOpportunity}
              isSaved={savedOpportunities.some(saved => saved.id === opp.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Carregar notificações do localStorage
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(savedNotifications);

    // Simular novas notificações a cada 5 minutos
    const interval = setInterval(() => {
      const newNotification = {
        id: Date.now(),
        type: 'info',
        message: 'Novas oportunidades disponíveis!',
        timestamp: new Date().toISOString()
      };
      
      const updatedNotifications = [newNotification, ...savedNotifications];
      setNotifications(updatedNotifications);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-system">
      <button 
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificações</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">Nenhuma notificação</p>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <p>{notif.message}</p>
                  <small>{new Date(notif.timestamp).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const userData = {
          ...parsedUser,
          profile: parsedUser.profile || {
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
            savedOpportunities: []
          }
        };
        setToken(savedToken);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = async (token, userData) => {
    try {
      // Salvar token no Firebase
      const tokenRef = ref(db, `tokens/${token}`);
      await set(tokenRef, {
        userId: userData.id,
        createdAt: new Date().toISOString()
      });

      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setPage('oportunidades');
      setFeedback({
        type: 'success',
        message: 'Login realizado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setFeedback({
        type: 'error',
        message: 'Erro ao fazer login. Tente novamente.'
      });
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Remover token do Firebase
        const tokenRef = ref(db, `tokens/${token}`);
        await remove(tokenRef);
      }

      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setPage('login');
      setFeedback({
        type: 'success',
        message: 'Logout realizado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setFeedback({
        type: 'error',
        message: 'Erro ao fazer logout. Tente novamente.'
      });
    }
  };

  const handleUpdateProfile = async (updatedUser) => {
    try {
      const userRef = ref(db, `users/${updatedUser.id}`);
      await update(userRef, {
        profile: updatedUser.profile
      });

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setFeedback({
        type: 'success',
        message: 'Perfil atualizado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setFeedback({
        type: 'error',
        message: 'Erro ao atualizar perfil. Tente novamente.'
      });
    }
  };

  if (!token) {
    return (
      <div className="app">
        <header>
          <div className="header-content">
            <h1>Central de Oportunidades para Jovens de Olinda</h1>
          </div>
        </header>
        {feedback.message && (
          <Feedback
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback({ type: '', message: '' })}
          />
        )}
        {page === 'login' ? (
          <>
            <Login onLogin={handleLogin} />
            <button onClick={() => setPage('cadastro')} className="switch-auth-button">
              Não tem conta? Cadastre-se
            </button>
          </>
        ) : (
          <Register onGoToLogin={() => setPage('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1>Central de Oportunidades para Jovens de Olinda</h1>
          {token && <NotificationSystem />}
        </div>
      </header>
      {feedback.message && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}
      <div className="main-content">
        <nav className="main-nav">
          <button
            className={`nav-button ${page === 'oportunidades' ? 'active' : ''}`}
            onClick={() => setPage('oportunidades')}
          >
            Oportunidades
          </button>
          <button
            className={`nav-button ${page === 'perfil' ? 'active' : ''}`}
            onClick={() => setPage('perfil')}
          >
            Meu Perfil
          </button>
        </nav>
        
        {page === 'oportunidades' ? (
          <Opportunities token={token} user={user} onLogout={handleLogout} />
        ) : (
          <Profile user={user} onUpdateProfile={handleUpdateProfile} />
        )}
      </div>
    </div>
  );
}

export default App;
