# Central de Oportunidades para Jovens de Olinda

Este é um projeto moderno que centraliza oportunidades para jovens de Olinda. O projeto é composto por:

- **Backend:** Um servidor Express (Node.js) que fornece endpoints da API.
- **Frontend:** Um app React que consome a API e exibe as oportunidades.
- **Docker Compose:** Para rodar ambos os containers de forma isolada e portátil.

## Como Executar

1. **Pré-requisitos:**  
   Certifique-se de ter o [Docker](https://docs.docker.com/get-docker/) e o [Docker Compose](https://docs.docker.com/compose/install/) instalados.

2. **Build e Execução:**  
   No terminal, navegue até a pasta raiz do projeto e execute:
   docker-compose up --build
Acesso:

O Frontend estará disponível em: http://localhost:3000

A API do Backend pode ser testada em: http://localhost:3001/api/opportunities

Isolamento e Portabilidade: O ambiente está isolado via Docker. Basta compactar todo o diretório do projeto e, em qualquer outro computador com Docker instalado, executar os mesmos comandos para rodar o projeto.

Finalizando: Para interromper os containers, use Ctrl+C no terminal onde o Docker Compose está rodando. Para remover os containers, você pode usar:

docker-compose down
