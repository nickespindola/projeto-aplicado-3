# 🔐 Sistema de Autenticação e Permissões - LocaTech

## 📋 Visão Geral

O sistema LocaTech agora possui um sistema completo de autenticação com controle de acesso baseado em **roles (funções)**.

## 👥 Níveis de Permissão

### 🔴 Admin (Administrador)
- **Acesso Total**: Pode criar, editar, visualizar e **deletar** todos os registros
- **Controle**: Gestão completa do sistema

### 🔵 Editor
- **Acesso Intermediário**: Pode criar, editar e visualizar registros
- **Restrição**: **NÃO pode deletar** registros

### 🟢 Viewer (Visualizador)
- **Acesso Limitado**: Apenas **visualizar** registros
- **Restrição**: NÃO pode criar, editar ou deletar

## 🔑 Credenciais de Teste

### Admin
- **Email**: `admin@locatech.com`
- **Senha**: `admin123`
- **Permissões**: Total (criar, editar, visualizar, deletar)

### Editor
- **Email**: `editor@locatech.com`
- **Senha**: `admin123`
- **Permissões**: Criar, editar e visualizar (sem deletar)

### Viewer
- **Email**: `viewer@locatech.com`
- **Senha**: `admin123`
- **Permissões**: Apenas visualizar (read-only)

## 🛠️ Implementação Técnica

### Backend (Node.js + Express)

#### 1. Middleware de Autenticação (`middleware/auth.js`)
```javascript
- authenticateToken: Verifica se o token JWT é válido
- canView: Permite visualizar (todas as roles)
- canEdit: Permite editar (admin e editor)
- canDelete: Permite deletar (apenas admin)
```

#### 2. Endpoints Protegidos
Todos os endpoints agora exigem autenticação:

**Clientes:**
- GET `/clientes` - Requer: autenticação + canView
- POST `/clientes` - Requer: autenticação + canEdit
- PUT `/clientes/:id` - Requer: autenticação + canEdit
- DELETE `/clientes/:id` - Requer: autenticação + canDelete

**Equipamentos:**
- GET `/equipamento` - Requer: autenticação + canView
- POST `/equipamento` - Requer: autenticação + canEdit
- PUT `/equipamento/:id` - Requer: autenticação + canEdit
- DELETE `/equipamento/:id` - Requer: autenticação + canDelete

**Contratos:**
- GET `/contrato` - Requer: autenticação + canView
- POST `/contrato` - Requer: autenticação + canEdit
- PUT `/contrato/:id` - Requer: autenticação + canEdit
- DELETE `/contrato/:id` - Requer: autenticação + canDelete

#### 3. Endpoints de Autenticação
- **POST** `/auth/login` - Fazer login e receber token JWT
- **GET** `/auth/verify` - Verificar se token é válido
- **POST** `/auth/logout` - Fazer logout

### Frontend (React)

#### 1. Proteção de Rotas
- Usuários não autenticados são redirecionados para `/login`
- Token JWT armazenado no `localStorage`
- Axios interceptor adiciona token automaticamente em todas as requisições

#### 2. Interface Baseada em Permissões

**Navbar:**
- Exibe nome do usuário
- Badge colorido com a role (Admin/Editor/Viewer)
- Botão de logout

**Páginas (Clientes/Equipamentos/Contratos):**
- Botão "Novo" aparece apenas para `admin` e `editor`
- Botões de editar (✏️) aparecem apenas para `admin` e `editor`
- Botões de deletar (🗑️) aparecem apenas para `admin`
- Usuários `viewer` veem apenas "Apenas visualização"

## 🚀 Como Testar

### 1. Iniciar o Backend
```bash
cd backend
npm start
```

### 2. Iniciar o Frontend
```bash
cd frontend
npm start
```

### 3. Testar os Níveis de Permissão

#### Teste como Admin:
1. Acesse `http://localhost:3000`
2. Faça login com `admin@locatech.com` / `admin123`
3. **Verifique**: Você pode criar, editar e deletar

#### Teste como Editor:
1. Faça logout (botão no canto superior direito)
2. Faça login com `editor@locatech.com` / `admin123`
3. **Verifique**: Você pode criar e editar, MAS os botões de deletar desaparecem

#### Teste como Viewer:
1. Faça logout
2. Faça login com `viewer@locatech.com` / `admin123`
3. **Verifique**: Você só pode visualizar, botões "Novo", "Editar" e "Deletar" desaparecem

## 🔒 Segurança

### Token JWT
- **Validade**: 8 horas
- **Armazenamento**: localStorage (frontend)
- **Transmissão**: Header `Authorization: Bearer <token>`

### Proteção Backend
- Todos os endpoints verificam token antes de processar requisição
- Middleware verifica role antes de permitir ações sensíveis
- Senhas armazenadas com hash (preparado para bcrypt)

## 📊 Estrutura do Banco de Dados

### Tabela USUARIO
```sql
CREATE TABLE USUARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🎨 Indicadores Visuais

### Badges de Role na Navbar:
- **Admin**: 👑 Badge vermelho (#e74c3c)
- **Editor**: ✏️ Badge azul (#3498db)
- **Viewer**: 👁️ Badge cinza (#95a5a6)

### Botões Condicionais:
- Botões aparecem/desaparecem automaticamente baseado na role
- Mensagem "Apenas visualização" para usuários viewer

## 🔄 Fluxo de Autenticação

1. **Login**: 
   - Usuário envia email e senha para `/auth/login`
   - Backend verifica credenciais
   - Retorna token JWT + dados do usuário

2. **Requisições Protegidas**:
   - Frontend adiciona token no header `Authorization`
   - Backend verifica token em cada requisição
   - Backend verifica se a role tem permissão para a ação

3. **Logout**:
   - Frontend remove token do localStorage
   - Usuário é redirecionado para tela de login

## ✅ Recursos Implementados

- ✅ Sistema de login com JWT
- ✅ 3 níveis de permissão (admin/editor/viewer)
- ✅ Proteção de todas as rotas frontend
- ✅ Proteção de todos os endpoints backend
- ✅ Interface responsiva às permissões do usuário
- ✅ Indicadores visuais de role
- ✅ Axios interceptor para token automático
- ✅ Redirecionamento automático para login
- ✅ Persistência de sessão (8h)
- ✅ Tela de login moderna com animações

## 📝 Próximos Passos (Opcional)

- [ ] Implementar hash bcrypt para senhas (atualmente senha em texto)
- [ ] Criar página de gerenciamento de usuários (CRUD de usuários)
- [ ] Adicionar refresh token para renovar sessão
- [ ] Implementar "Esqueci minha senha"
- [ ] Adicionar logs de auditoria (quem fez o quê e quando)
- [ ] Implementar 2FA (autenticação de dois fatores)

---

**Desenvolvido para LocaTech** 🖥️
Sistema de Gestão de Locação de Equipamentos
