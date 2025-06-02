# Central de Oportunidades

Sistema de gerenciamento de oportunidades para jovens, conectando-os com empresas e organizações.

## 🚀 Tecnologias

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Banco de Dados**: Firebase Realtime Database
- **Autenticação**: Firebase Auth
- **Testes**: Selenium WebDriver
- **Containerização**: Docker

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Git

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/central-oportunidades.git
cd central-oportunidades
```

2. Inicie os containers:
```bash
docker-compose up -d
```

## 🌐 Acessando a Aplicação

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Testes Selenium: http://localhost:3001/api/selenium/test

## 🧪 Testes

O projeto utiliza Selenium WebDriver para testes automatizados. Os testes verificam:

- Carregamento da página inicial
- Formulário de login
- Campos de autenticação
- Funcionalidades básicas

Para executar os testes:
```bash
curl http://localhost:3001/api/selenium/test
```

## 📦 Estrutura do Projeto

```
central-oportunidades/
├── frontend/           # Aplicação React
├── backend/           # API Node.js
├── docker-compose.yml # Configuração Docker
└── README.md
```

## 🔐 Funcionalidades

- Autenticação de usuários
- Cadastro de oportunidades
- Perfil de usuário
- Sistema de candidaturas
- Notificações
- Recomendações personalizadas

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request
