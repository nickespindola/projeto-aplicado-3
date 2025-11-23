# 🖥️ LocaTech - Gestão Inteligente de Equipamentos de Informática

Sistema completo de gestão de locação de equipamentos de informática com **controle de acesso baseado em permissões** (roles).

## ✨ Funcionalidades

- **🔐 Sistema de Autenticação:** Login com JWT e controle de acesso por níveis (Admin, Editor, Viewer)
- **👥 Gestão de Usuários:** Administradores podem criar e gerenciar usuários do sistema
- **📋 Controle de Clientes:** Cadastro completo de Pessoas Físicas e Jurídicas
- **💻 Gestão de Equipamentos:** Catálogo de equipamentos com controle de estado
- **📝 Contratos de Locação:** Sistema completo de acompanhamento de contratos com alertas de vencimento
- **📊 Dashboard Inteligente:** Visão geral com estatísticas e alertas em tempo real
- **🎨 Interface Moderna:** Design responsivo e intuitivo com animações

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

### Backend
- **Node.js** - Ambiente de execução
- **Express** - Framework web
- **MySQL 2** - Driver de banco de dados
- **JWT (jsonwebtoken)** - Autenticação
- **bcrypt** - Hash de senhas (preparado)
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
│   ├── database.sql             # Schema do banco de dados
│   ├── add_usuarios.sql         # Script de criação de usuários
│   ├── server.js                # Servidor Express com endpoints
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/       # Página inicial com estatísticas
│   │   │   ├── Clientes/        # CRUD de clientes
│   │   │   ├── Equipamentos/    # CRUD de equipamentos
│   │   │   ├── Contratos/       # CRUD de contratos
│   │   │   ├── Usuarios/        # CRUD de usuários (apenas admin)
│   │   │   └── Login/           # Tela de login
│   │   ├── App.js               # Rotas e autenticação
│   │   ├── App.css              # Estilos globais
│   │   └── index.js
│   └── package.json
│
├── AUTENTICACAO.md              # Documentação detalhada do sistema de auth
└── README.md                    # Este arquivo
```

## 🎯 Funcionalidades Detalhadas

### 🏠 Dashboard
- Estatísticas em tempo real
- Contratos ativos e próximos do vencimento
- Últimos 5 contratos cadastrados
- Ações rápidas para cadastros
- Alertas de vencimento

### 👥 Clientes
- Cadastro de Pessoa Física (CPF) e Pessoa Jurídica (CNPJ)
- Máscaras automáticas para telefone, CPF e CNPJ
- Busca por nome, CPF/CNPJ ou telefone
- Edição e exclusão (com permissão)

### 💻 Equipamentos
- Cadastro completo com marca, modelo e número de série
- Categorização por tipo
- Campo de observações
- Sistema de busca avançada

### 📝 Contratos
- Vinculação de cliente e equipamento
- Controle de datas (início e fim)
- Valor mensal da locação
- Status do contrato (ativo/inativo)
- Edição e cancelamento (com permissão)

### 🔐 Usuários (Apenas Admin)
- Criação de novos usuários
- Definição de permissões (Admin/Editor/Viewer)
- Ativação/desativação de contas
- Alteração de senhas
- Proteção contra auto-exclusão

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

- **JWT Token:** Autenticação baseada em tokens com validade de 8 horas
- **Middleware de Autorização:** Verifica permissões em cada endpoint
- **Proteção de Rotas:** Frontend redireciona usuários não autenticados
- **Axios Interceptor:** Adiciona token automaticamente em todas as requisições
- **Validação de Dados:** Backend valida todos os inputs antes de processar

## 📚 Documentação Adicional

Para mais detalhes sobre o sistema de autenticação e permissões, consulte:
- [AUTENTICACAO.md](./AUTENTICACAO.md) - Guia completo do sistema de auth

## 🎨 Interface do Usuário

- Design moderno com gradientes e animações
- Badges coloridos para identificar roles
- Botões aparecem/desaparecem baseado em permissões
- Menu lateral com ícones intuitivos
- Navbar com informações do usuário logado
- Feedback visual para todas as ações

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

## 📝 Próximas Melhorias

- [ ] Implementar bcrypt para hash de senhas
- [ ] Adicionar paginação nas listagens
- [ ] Sistema de filtros avançados
- [ ] Relatórios em PDF
- [ ] Gráficos no Dashboard
- [ ] Sistema de notificações por email
- [ ] Logs de auditoria
- [ ] Autenticação de dois fatores (2FA)

## 👨‍💻 Desenvolvimento

E o backend com o `server.js` que inclui todos os GET, POST, DELETE, query necessários para o CRUD, como também a conexão com o banco de dados SQL.

## API Endpoints

Alguns exemplos de funções já disponíveis do `server.js` são:

- **GET `/clientes`** - Lista todos os clientes, utilizado para selecionar um cliente na criação de um contrato
- **POST `/clientes`** - Registra um novo cliente
- **GET `/equipamento`** - Lista todos os equipamentos, utilizado para selecionar um equipamento na criação de um contrato
- **POST `/equipamento`** - Registra um novo equipamento
- **POST `/contrato`** - Cria um novo contrato
- **GET `/listarcontratos`** - Pesquisa por contratos utilizando parâmetros, utilizado na busca de contratos por características
- **GET `/contrato/:id`** - Coleta as informações do equipamento para a edição
- **PUT `/contrato/:id`** - Atualiza os dados do contrato conforme a edição
- **DELETE `/listarcontratos/:id`** - Apaga o contrato selecionado

## Solução de Problemas

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

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.

## 👨‍💻 Desenvolvido para

**Projeto Aplicado 3** - Gestão Inteligente de Equipamentos de Informática Locados

---

**LocaTech** © 2025 - Sistema de Gestão de Locação de Equipamentos 🖥️
