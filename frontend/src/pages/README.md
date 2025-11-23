# Páginas do Sistema LocaTech

Esta pasta contém todas as páginas da aplicação, organizadas por módulo.

## Estrutura de Pastas

```
pages/
├── Dashboard/
│   └── index.js       # Página inicial com estatísticas e visão geral
├── Clientes/
│   └── index.js       # CRUD completo de clientes (listar, criar, editar, deletar)
├── Equipamentos/
│   └── index.js       # CRUD completo de equipamentos (listar, criar, editar, deletar)
└── Contratos/
    └── index.js       # CRUD completo de contratos (listar, criar, editar, deletar)
```

## Páginas Ativas

### 🏠 Dashboard
- **Rota:** `/`
- **Função:** Exibe estatísticas gerais, contratos recentes e alertas
- **Componente:** `./Dashboard/`

### 👥 Clientes
- **Rota:** `/clientes`
- **Função:** Gerenciamento completo de clientes (PF e PJ)
- **Recursos:**
  - Listagem com busca/filtro
  - Cadastro inline com máscaras (CPF/CNPJ, telefone)
  - Edição inline
  - Exclusão com confirmação
- **Componente:** `./Clientes/`

### 💻 Equipamentos
- **Rota:** `/equipamentos`
- **Função:** Gerenciamento completo de equipamentos
- **Recursos:**
  - Listagem com busca/filtro
  - Cadastro inline
  - Edição inline
  - Exclusão com confirmação
  - Ícones por tipo de equipamento
- **Componente:** `./Equipamentos/`

### 📝 Contratos
- **Rota:** `/contratos`
- **Função:** Gerenciamento completo de contratos de locação
- **Recursos:**
  - Listagem com busca/filtro
  - Cadastro inline com seleção de cliente e equipamento
  - Edição inline
  - Exclusão com confirmação
- **Componente:** `./Contratos/`

## Padrão de Organização

Cada módulo segue o padrão:
- Uma pasta por módulo
- Arquivo `index.js` como ponto de entrada
- Tudo em um único componente (listagem + formulário)
- Formulário aparece/desaparece dinamicamente
- Scroll automático ao editar

## Histórico de Limpeza

**Data:** 23/11/2025

**Arquivos removidos (obsoletos):**
- `Cliente.js` - Substituído por `Clientes/index.js`
- `Contrato.js` - Substituído por `Contratos/index.js`
- `Equipamento.js` - Substituído por `Equipamentos/index.js`
- `EditarCliente.js` - Funcionalidade integrada em `Clientes/index.js`
- `EditarContrato.js` - Funcionalidade integrada em `Contratos/index.js`
- `EditarEquipamento.js` - Funcionalidade integrada em `Equipamentos/index.js`
- `ListarClientes.js` - Funcionalidade integrada em `Clientes/index.js`
- `ListarContrato.js` - Funcionalidade integrada em `Contratos/index.js`
- `ListarEquipamentos.js` - Funcionalidade integrada em `Equipamentos/index.js`

**Total:** 9 arquivos removidos, estrutura simplificada de 13 para 4 componentes.
