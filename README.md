# 🖥️ LocaTech - Gestão Inteligente de Equipamentos de Informática

Sistema completo de gestão de locação de equipamentos de informática com **controle de acesso baseado em permissões** (roles).

## ✨ Funcionalidades

- **🔐 Sistema de Autenticação:** Login com JWT, bcrypt para hash de senhas e controle de acesso por níveis (Admin, Editor, Viewer)
- **👥 Gestão de Usuários:** Administradores podem criar e gerenciar usuários do sistema
- **📋 Controle de Clientes:** Cadastro completo de Pessoas Físicas e Jurídicas com mascaramento de dados sensíveis
- **💻 Gestão de Equipamentos:** Catálogo de equipamentos com controle de disponibilidade
- **📝 Contratos de Locação:** Sistema completo com seletor inteligente de equipamentos e alertas de vencimento
- **📊 Dashboard com Gráficos:** Visão geral com estatísticas, gráficos interativos e alertas em tempo real
- **📄 Exportação em PDF:** Relatórios de contratos exportáveis diretamente do navegador
- **🔍 Filtros e Paginação:** Busca avançada e paginação em todas as listagens
- **📱 Interface Responsiva:** Menu sanduíche no mobile e sidebar recolhível no desktop

## 🔑 Níveis de Permissão

### 👑 Admin (Administrador)
- **Acesso Total:** Criar, editar, visualizar e **deletar** todos os registros
- **Gestão de Usuários:** Pode criar, editar e excluir usuários
- **Todas as funcionalidades** disponíveis

### ✏️ Editor
- **Criar e Editar:** Pode adicionar e modificar registros
- **Visualizar:** Acesso completo de leitura
- **Restrição:** NÃO pode deletar registros ou gerenciar usuários

### 👁️ Viewer (Visualizador)
- **Apenas Leitura:** Visualização de todos os dados
- **Restrição:** NÃO pode criar, editar, deletar ou gerenciar usuários

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19.1.0** - Framework JavaScript
- **React Router 7.6.2** - Navegação entre páginas
- **Bootstrap 5** - Framework CSS
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos interativos no Dashboard
- **jsPDF + jspdf-autotable** - Geração de relatórios PDF no navegador

### Backend
- **Node.js** - Ambiente de execução
- **Express** - Framework web
- **MySQL 2** - Driver de banco de dados
- **JWT (jsonwebtoken)** - Autenticação baseada em tokens
- **bcrypt** - Hash seguro de senhas
- **dotenv** - Variáveis de ambiente
- **cors** - Controle de CORS

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [MySQL](https://www.mysql.com/) (versão 5.7 ou superior)
- npm (vem com Node.js)

## ⚙️ Como Rodar o Projeto

### 1. 🗄️ Configuração do Banco de Dados

```bash
# Acesse o MySQL
mysql -u root -p

# Crie o banco e as tabelas
source backend/database.sql

# Crie os usuários de teste (admin, editor, viewer)
source backend/add_usuarios.sql
```

### 2. 🔧 Configuração do Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente (opcional)
# Crie um arquivo .env na pasta backend:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=sua_senha
# DB_NAME=LocaTech
# JWT_SECRET=sua_chave_secreta_aqui
# PORT=8081

# Inicie o servidor
npm start
```

✅ Backend rodando em `http://localhost:8081`

### 3. 🎨 Configuração do Frontend

Em **outro terminal**:

```bash
# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie a aplicação React
npm start
```

✅ Frontend rodando em `http://localhost:3000`

## 🔐 Credenciais de Acesso

Após executar o script `add_usuarios.sql`, você terá 3 usuários de teste:

### Admin
- **Email:** `admin@locatech.com`
- **Senha:** `admin123`
- **Permissões:** Acesso total ao sistema

### Editor
- **Email:** `editor@locatech.com`
- **Senha:** `admin123`
- **Permissões:** Criar, editar e visualizar (sem deletar)

### Viewer
- **Email:** `viewer@locatech.com`
- **Senha:** `admin123`
- **Permissões:** Apenas visualizar

## 📁 Estrutura do Projeto

```
projeto-aplicado-3/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticação e autorização
│   ├── __tests__/
│   │   └── auth-api.test.js     # Testes de integração da API
│   ├── database.sql             # Schema do banco de dados
│   ├── add_usuarios.sql         # Script de criação de usuários (senhas com bcrypt)
│   ├── server.js                # Servidor Express com endpoints
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Pagination.js    # Componente reutilizável de paginação
│   │   ├── pages/
│   │   │   ├── Dashboard/       # Página inicial com estatísticas e gráficos
│   │   │   ├── Clientes/        # CRUD de clientes com privacidade de dados
│   │   │   ├── Equipamentos/    # CRUD de equipamentos
│   │   │   ├── Contratos/       # CRUD de contratos com export PDF
│   │   │   ├── Usuarios/        # CRUD de usuários (apenas admin)
│   │   │   └── Login/           # Tela de login com toggle de senha
│   │   ├── App.js               # Rotas, sidebar e navbar responsivos
│   │   ├── App.css              # Estilos globais
│   │   └── index.js
│   └── package.json
│
├── AUTENTICACAO.md              # Documentação detalhada do sistema de auth
└── README.md                    # Este arquivo
```

## 🎯 Funcionalidades Detalhadas

### 🏠 Dashboard
- Estatísticas em tempo real (clientes, equipamentos, contratos, vencimentos)
- **Gráficos interativos:**
  - Contratos por status (ativo/inativo) — gráfico de rosca
  - Clientes por tipo (PF/PJ) — gráfico de rosca
  - Equipamentos por tipo — gráfico de barras
  - Receita mensal — gráfico de área (últimos 12 meses)
- Últimos 5 contratos cadastrados
- Ações rápidas para cadastros
- Alertas de vencimento nos próximos 30 dias

### 👥 Clientes
- Cadastro de Pessoa Física (CPF) e Pessoa Jurídica (CNPJ)
- Máscaras automáticas para telefone, CPF e CNPJ
- **Privacidade de dados:** CPF/CNPJ mascarado por padrão (`***.456.789-**`) com botão de revelar por linha
- **Linha expansível:** telefone, e-mail e endereço ocultos até expandir a linha
- Filtros por nome, documento, telefone, e-mail e tipo (PF/PJ)
- Paginação com controle de itens por página (10 / 25 / 50)
- Edição e exclusão (com permissão)

### 💻 Equipamentos
- Cadastro completo com marca, modelo e número de série
- Categorização por tipo (Notebook, Desktop, Monitor, etc.)
- Campo de observações
- Filtros por texto e tipo
- Paginação

### 📝 Contratos
- **Seletor inteligente de equipamento:** campo pesquisável por tipo, marca, modelo ou nº de série
- **Controle de disponibilidade:** equipamentos já em contratos ativos não aparecem nas opções
- Controle de datas (início e fim) e valor mensal
- Status do contrato (ativo/inativo)
- Filtros por cliente, equipamento, status e intervalo de datas
- **Exportação em PDF:** gera relatório formatado com os contratos da listagem atual (respeita filtros ativos)
- Paginação

### 🔐 Usuários (Apenas Admin)
- Criação de novos usuários
- Definição de permissões (Admin / Editor / Viewer)
- Ativação/desativação de contas
- Alteração de senhas (hash bcrypt automático)
- Proteção contra auto-exclusão
- Filtros por nome, e-mail, permissão e status
- Paginação

### 📱 Navegação Responsiva
- **Mobile:** botão hambúrguer (☰) na navbar abre/fecha a sidebar como overlay com backdrop
- **Desktop:** botão `‹‹` / `››` recolhe a sidebar para 64px (apenas ícones) ou expande para largura completa
- Sidebar fecha automaticamente ao navegar para outra página no mobile

## 🛠️ API Endpoints

### Autenticação
- `POST /auth/login` - Fazer login
- `GET /auth/verify` - Verificar token
- `POST /auth/logout` - Fazer logout

### Usuários (Admin apenas)
- `GET /usuarios` - Listar usuários
- `GET /usuarios/:id` - Buscar usuário
- `POST /usuarios` - Criar usuário
- `PUT /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Deletar usuário

### Clientes
- `GET /clientes` - Listar clientes
- `POST /clientes` - Criar cliente
- `GET /clientes/:id` - Buscar cliente
- `PUT /clientes/:id` - Atualizar cliente
- `DELETE /clientes/:id` - Deletar cliente (Admin)

### Equipamentos
- `GET /equipamento` - Listar equipamentos
- `POST /equipamento` - Criar equipamento
- `GET /equipamento/:id` - Buscar equipamento
- `PUT /equipamento/:id` - Atualizar equipamento
- `DELETE /equipamento/:id` - Deletar equipamento (Admin)

### Contratos
- `GET /contrato` - Listar contratos
- `POST /contrato` - Criar contrato
- `GET /contrato/:id` - Buscar contrato
- `PUT /contrato/:id` - Atualizar contrato
- `DELETE /contrato/:id` - Deletar contrato (Admin)

## 🔒 Segurança

- **bcrypt:** Senhas armazenadas com hash seguro (salt rounds = 10)
- **JWT Token:** Autenticação baseada em tokens com validade de 8 horas
- **Middleware de Autorização:** Verifica permissões em cada endpoint
- **Proteção de Rotas:** Frontend redireciona usuários não autenticados
- **Axios Interceptor:** Adiciona token automaticamente em todas as requisições
- **Validação de Dados:** Backend valida todos os inputs antes de processar

## 🧪 Testes Automatizados

Testes automatizados no backend validam os fluxos de segurança e acesso:

- Login com JWT
- Validação de token
- Controle de acesso por perfil
- Permissão para visualizar dados
- Bloqueio de rotas administrativas para usuários sem permissão

### Como executar

No diretório `backend`:

```bash
npm install
npm test
```

### Cenários cobertos

- `POST /auth/login` com sucesso
- `POST /auth/login` com credenciais inválidas
- `GET /auth/verify` sem token
- `GET /clientes` com usuário autenticado
- `GET /usuarios` com viewer bloqueado
- `GET /usuarios` com admin autorizado

## 🚦 Como Testar as Permissões

1. **Teste como Admin:**
   - Login com `admin@locatech.com`
   - Veja que todos os botões estão disponíveis
   - Acesse a aba "Usuários" no menu

2. **Teste como Editor:**
   - Faça logout e login com `editor@locatech.com`
   - Botões de criar/editar disponíveis
   - Botões de deletar **desaparecem**
   - Aba "Usuários" **não aparece** no menu

3. **Teste como Viewer:**
   - Faça logout e login com `viewer@locatech.com`
   - Apenas visualização
   - Nenhum botão de ação disponível
   - Mensagem "Apenas visualização" nas tabelas

## ⚠️ Solução de Problemas

### Erro de conexão com o banco de dados

Verifique se:
- O MySQL está rodando
- As credenciais no arquivo `.env` (ou no `server.js`) estão corretas
- O banco de dados `LocaTech` foi criado
- Os usuários de teste foram criados com `add_usuarios.sql`

### Erro 401 Unauthorized

- Faça login novamente
- Verifique se o token não expirou (8 horas de validade)
- Limpe o localStorage do navegador

### Erro 403 Forbidden

- Você não tem permissão para esta ação
- Faça login com um usuário de role adequada (admin/editor)

### Porta já em uso

- Backend (8081): Altere a porta criando arquivo `.env` com `PORT=OUTRA_PORTA`
- Frontend (3000): React solicitará automaticamente para usar outra porta

### Botões não aparecem

- Verifique se está logado com o usuário correto
- Admin vê todos os botões
- Editor não vê botões de deletar
- Viewer não vê nenhum botão de ação

## 📝 Próximas Melhorias

- [ ] Sistema de notificações por e-mail
- [ ] Logs de auditoria
- [ ] Autenticação de dois fatores (2FA)

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.

## 👨‍💻 Desenvolvido para

**Projeto Aplicado 3** - Gestão Inteligente de Equipamentos de Informática Locados

---

**LocaTech** © 2025 - Sistema de Gestão de Locação de Equipamentos 🖥️
