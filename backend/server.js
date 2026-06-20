require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authenticateToken, canEdit, canDelete, canView, JWT_SECRET } = require("./middleware/auth");

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "LocaTech"
});

db.connect(err => {
  if (err) {
    console.error("Erro de conexão ao banco de dados:", err);
    process.exit(1);
  }
  console.log("Conectado ao banco de dados com sucesso.");
});

// ==================== AUTENTICAÇÃO ====================

// Login
app.post("/auth/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const sql = "SELECT * FROM USUARIO WHERE email = ? AND ativo = TRUE";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ error: "Erro no servidor" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const usuario = results[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      }
    });
  });
});

// Verificar token
app.get("/auth/verify", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    usuario: req.user
  });
});

// Logout (client-side apenas remove o token)
app.post("/auth/logout", (req, res) => {
  res.json({ message: "Logout realizado com sucesso" });
});

// ==================== USUÁRIOS (apenas admin) ====================

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// Listar todos os usuários
app.get("/usuarios", authenticateToken, requireAdmin, (req, res) => {
  const sql = "SELECT id, nome, email, role, ativo, created_at, updated_at FROM USUARIO ORDER BY id DESC";

  db.query(sql, (err, data) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json(data);
  });
});

// Buscar usuário por ID
app.get("/usuarios/:id", authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT id, nome, email, role, ativo, created_at, updated_at FROM USUARIO WHERE id = ?";

  db.query(sql, [userId], (err, data) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    return res.json(data[0]);
  });
});

// Criar novo usuário
app.post("/usuarios", authenticateToken, requireAdmin, (req, res) => {
  const { nome, email, senha, role, ativo } = req.body;

  if (!nome || !email || !senha || !role) {
    return res.status(400).json({ error: "Nome, email, senha e role são obrigatórios." });
  }

  // Validar role
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: "Role inválida. Use: admin, editor ou viewer." });
  }

  // Verificar se email já existe
  const checkEmailSql = "SELECT id FROM USUARIO WHERE email = ?";
  db.query(checkEmailSql, [email], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar email:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Este email já está cadastrado." });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);
    const sql = `
      INSERT INTO USUARIO (nome, email, senha, role, ativo)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [nome, email, hashedSenha, role, ativo !== false];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Erro ao criar usuário:", err);
        return res.status(500).json({ error: "Falha ao criar usuário." });
      }
      return res.status(201).json({
        id: result.insertId,
        message: "Usuário criado com sucesso"
      });
    });
  });
});

// Atualizar usuário
app.put("/usuarios/:id", authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { nome, email, senha, role, ativo } = req.body;

  if (!nome || !email || !role) {
    return res.status(400).json({ error: "Nome, email e role são obrigatórios." });
  }

  // Validar role
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: "Role inválida. Use: admin, editor ou viewer." });
  }

  // Verificar se email já existe em outro usuário
  const checkEmailSql = "SELECT id FROM USUARIO WHERE email = ? AND id != ?";
  db.query(checkEmailSql, [email, userId], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar email:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Este email já está cadastrado em outro usuário." });
    }

    let sql, values;

    if (senha) {
      const hashedSenha = await bcrypt.hash(senha, 10);
      sql = `
        UPDATE USUARIO
        SET nome = ?, email = ?, senha = ?, role = ?, ativo = ?
        WHERE id = ?
      `;
      values = [nome, email, hashedSenha, role, ativo !== false, userId];
    } else {
      // Atualizar sem alterar senha
      sql = `
        UPDATE USUARIO 
        SET nome = ?, email = ?, role = ?, ativo = ?
        WHERE id = ?
      `;
      values = [nome, email, role, ativo !== false, userId];
    }

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Erro ao atualizar usuário:", err);
        return res.status(500).json({ error: "Falha ao atualizar usuário." });
      }
      return res.json({ message: "Usuário atualizado com sucesso" });
    });
  });
});

// Deletar usuário
app.delete("/usuarios/:id", authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;

  // Não permitir que o admin delete a si mesmo
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: "Você não pode deletar seu próprio usuário." });
  }

  const sql = "DELETE FROM USUARIO WHERE id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar usuário:", err);
      return res.status(500).json({ error: "Erro ao deletar usuário." });
    }
    return res.json({ message: "Usuário deletado com sucesso." });
  });
});

// ==================== CLIENTES ====================

// Listar clientes (requer autenticação, qualquer role pode visualizar)
app.get("/clientes", authenticateToken, canView, (req, res) => {
  const sql = "SELECT * FROM CLIENTE";
  db.query(sql, (err, data) => {
    if (err) {
      console.error("Erro de solicitação: ", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json(data);
  });
});

// Criar cliente (requer autenticação e permissão de edição)
app.post("/clientes", authenticateToken, canEdit, (req, res) => {
  const { nome, endereco, e_mail, telefone, tipo_cliente, cpf, cnpj } = req.body;

  console.log("Dados recebidos:", req.body);

  if (!nome || !endereco || !e_mail || !telefone || !tipo_cliente) {
    return res.status(400).json({ error: "Faltou preencher dados obrigatórios." });
  }

  // Validar tipo_cliente
  if (tipo_cliente !== 'PF' && tipo_cliente !== 'PJ') {
    return res.status(400).json({ error: "Tipo de cliente inválido. Use 'PF' ou 'PJ'." });
  }

  const sql = `
    INSERT INTO CLIENTE 
    (nome, endereco, e_mail, telefone, tipo_cliente, cpf, cnpj) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [nome, endereco, e_mail, telefone, tipo_cliente, cpf, cnpj];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao inserir cliente:", err);
      console.error("SQL:", sql);
      console.error("Valores:", values);
      return res.status(500).json({
        error: "Falha ao inserir no banco de dados.",
        details: err.message
      });
    }
    return res.status(201).json({
      id: result.insertId,
      message: "Cliente cadastrado com sucesso"
    });
  });
});

// ==================== EQUIPAMENTOS ====================

// Listar equipamentos (requer autenticação, qualquer role pode visualizar)
app.get("/equipamento", authenticateToken, canView, (req, res) => {
  const sql = "SELECT * FROM EQUIPAMENTO";
  db.query(sql, (err, data) => {
    if (err) {
      console.error("Erro de solicitação: ", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json(data);
  });
});

// Criar equipamento (requer autenticação e permissão de edição)
app.post("/equipamento", authenticateToken, canEdit, (req, res) => {
  const { marca, modelo, numero_serie, tipo, observacoes } = req.body;

  if (!marca || !modelo || !numero_serie || !tipo) {
    return res.status(400).json({ error: "Faltou preencher dados." });
  }

  const sql = `
    INSERT INTO EQUIPAMENTO 
    (marca, modelo, numero_serie, tipo, observacoes) 
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [marca, modelo, numero_serie, tipo, observacoes || null];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).json({ error: "Falha ao inserir no banco de dados." });
    }
    return res.status(201).json({
      id: result.insertId,
      message: "Equipamento cadastrado com sucesso"
    });
  });
});

// ==================== CRUD CLIENTES ====================

// Buscar cliente por ID
app.get("/clientes/:id", authenticateToken, canView, (req, res) => {
  const clienteId = req.params.id;
  const sql = "SELECT * FROM CLIENTE WHERE id = ?";

  db.query(sql, [clienteId], (err, data) => {
    if (err) {
      console.error("Erro ao buscar cliente:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }
    return res.json(data[0]);
  });
});

// Atualizar cliente
app.put("/clientes/:id", authenticateToken, canEdit, (req, res) => {
  const clienteId = req.params.id;
  const { nome, endereco, e_mail, telefone, tipo_cliente, cpf, cnpj } = req.body;

  console.log("Atualizando cliente:", clienteId, req.body);

  if (!nome || !endereco || !e_mail || !telefone || !tipo_cliente) {
    return res.status(400).json({ error: "Faltou preencher dados obrigatórios." });
  }

  if (tipo_cliente !== 'PF' && tipo_cliente !== 'PJ') {
    return res.status(400).json({ error: "Tipo de cliente inválido. Use 'PF' ou 'PJ'." });
  }

  const sql = `
    UPDATE CLIENTE 
    SET nome = ?, endereco = ?, e_mail = ?, telefone = ?, tipo_cliente = ?, cpf = ?, cnpj = ?
    WHERE id = ?
  `;

  const values = [nome, endereco, e_mail, telefone, tipo_cliente, cpf, cnpj, clienteId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar cliente:", err);
      return res.status(500).json({
        error: "Falha ao atualizar cliente.",
        details: err.message
      });
    }
    return res.json({
      message: "Cliente atualizado com sucesso"
    });
  });
});

// Deletar cliente (requer role admin)
app.delete("/clientes/:id", authenticateToken, canDelete, (req, res) => {
  const clienteId = req.params.id;
  const sql = "DELETE FROM CLIENTE WHERE id = ?";

  db.query(sql, [clienteId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar cliente:", err);
      return res.status(500).json({ error: "Erro ao deletar cliente." });
    }
    return res.json({ message: "Cliente deletado com sucesso." });
  });
});

// ==================== CRUD EQUIPAMENTOS ====================

// Buscar equipamento por ID
app.get("/equipamento/:id", authenticateToken, canView, (req, res) => {
  const equipamentoId = req.params.id;
  const sql = "SELECT * FROM EQUIPAMENTO WHERE id = ?";

  db.query(sql, [equipamentoId], (err, data) => {
    if (err) {
      console.error("Erro ao buscar equipamento:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "Equipamento não encontrado." });
    }
    return res.json(data[0]);
  });
});

// Atualizar equipamento
app.put("/equipamento/:id", authenticateToken, canEdit, (req, res) => {
  const equipamentoId = req.params.id;
  const { marca, modelo, numero_serie, tipo, observacoes } = req.body;

  console.log("Atualizando equipamento:", equipamentoId, req.body);

  if (!marca || !modelo || !numero_serie || !tipo) {
    return res.status(400).json({ error: "Faltou preencher dados obrigatórios." });
  }

  const sql = `
    UPDATE EQUIPAMENTO 
    SET marca = ?, modelo = ?, numero_serie = ?, tipo = ?, observacoes = ?
    WHERE id = ?
  `;

  const values = [marca, modelo, numero_serie, tipo, observacoes || null, equipamentoId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar equipamento:", err);
      return res.status(500).json({
        error: "Falha ao atualizar equipamento.",
        details: err.message
      });
    }
    return res.json({
      message: "Equipamento atualizado com sucesso"
    });
  });
});

// Deletar equipamento (requer role admin)
app.delete("/equipamento/:id", authenticateToken, canDelete, (req, res) => {
  const equipamentoId = req.params.id;
  const sql = "DELETE FROM EQUIPAMENTO WHERE id = ?";

  db.query(sql, [equipamentoId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar equipamento:", err);
      return res.status(500).json({ error: "Erro ao deletar equipamento." });
    }
    return res.json({ message: "Equipamento deletado com sucesso." });
  });
});

// Buscar clientes (endpoint de busca)
app.get("/clientes/search", authenticateToken, canView, (req, res) => {
  const searchTerm = req.query.q || '';
  const sql = `
        SELECT * FROM CLIENTE 
        WHERE 
            nome LIKE ? OR 
            cpf LIKE ? OR 
            cnpj LIKE ? OR
            CONCAT(cpf, cnpj) LIKE ?
    `;

  const searchParam = `%${searchTerm}%`;
  db.query(sql, [searchParam, searchParam, searchParam], (err, data) => {
    if (err) {
      console.error("Erro de solicitação: ", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json(data);
  });
});

// ==================== CONTRATOS ====================

// Listar todos os contratos
app.get("/contrato", authenticateToken, canView, (req, res) => {
  const sql = `
    SELECT 
      c.id,
      c.cliente_id,
      c.equipamento_id,
      c.data_inicio,
      c.data_fim,
      c.valor_mensal,
      c.status,
      cl.nome as cliente,
      CONCAT(e.marca, ' ', e.modelo) as equipamento
    FROM CONTRATO c
    LEFT JOIN CLIENTE cl ON c.cliente_id = cl.id
    LEFT JOIN EQUIPAMENTO e ON c.equipamento_id = e.id
    ORDER BY c.id DESC
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("Erro ao buscar contratos:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json(data);
  });
});

// Criar contrato
app.post("/contrato", authenticateToken, canEdit, (req, res) => {
  const { cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal } = req.body;

  console.log("Dados recebidos para criar contrato:", req.body);

  if (!cliente_id || !equipamento_id || !data_inicio || !data_fim || !valor_mensal) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const sql = `
    INSERT INTO CONTRATO 
    (cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal, status)
    VALUES (?, ?, ?, ?, ?, 'ativo')
  `;

  const values = [cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao criar contrato:", err);
      return res.status(500).json({ error: "Falha ao criar contrato." });
    }
    return res.json({
      id: result.insertId,
      message: "Contrato criado com sucesso"
    });
  });
});

// Endpoint de busca avançada de contratos
app.get("/listarcontratos", authenticateToken, canView, (req, res) => {
  const searchTerm = req.query.search || '';
  const searchParam = `%${searchTerm}%`;

  const sql = `
    SELECT 
        c.id,
        cl.nome as cliente,
        CONCAT(e.marca, ' ', e.modelo) as equipamento,
        c.observacoes,
        DATE_FORMAT(c.data_inicio, '%Y-%m-%d') as dataInicio,
        DATE_FORMAT(c.data_fim, '%Y-%m-%d') as dataFim,
        FORMAT(c.valor_mensal, 2) as valor,
        c.status
    FROM CONTRATO c
    JOIN CLIENTE cl ON c.cliente_id = cl.id  
    JOIN EQUIPAMENTO e ON c.equipamento_id = e.id
    WHERE 
        c.id LIKE ? OR 
        cl.nome LIKE ? OR 
        e.marca LIKE ? OR 
        e.modelo LIKE ? OR 
        e.numero_serie LIKE ?
    ORDER BY c.id DESC
`;

  const params = [
    searchParam,
    searchParam,
    searchParam,
    searchParam,
    searchParam
  ];

  db.query(sql, params, (err, data) => {
    if (err) {
      console.error("Erro de solicitação: ", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json(data);
  });
});

// Deletar contrato (requer role admin)
app.delete("/listarcontratos/:id", authenticateToken, canDelete, (req, res) => {
  const contratoId = req.params.id;
  const sql = "DELETE FROM CONTRATO WHERE id = ?";

  db.query(sql, [contratoId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar contrato:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json({ message: "Contrato deletado com sucesso." });
  });
});

// ==================== CRUD CONTRATOS ====================

// Buscar contrato por ID
app.get("/contrato/:id", authenticateToken, canView, (req, res) => {
  const contractId = req.params.id;
  const sql = `
        SELECT 
            c.*,
            COALESCE(cl.cpf, cl.cnpj) as cliente_identificador,
            c.observacoes
        FROM CONTRATO c
        JOIN CLIENTE cl ON c.cliente_id = cl.id
        JOIN EQUIPAMENTO e ON c.equipamento_id = e.id 
        WHERE c.id = ?
    `;

  db.query(sql, [contractId], (err, data) => {
    if (err) {
      console.error("Erro ao buscar contrato:", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "Contrato não encontrado." });
    }

    const contract = data[0];
    return res.json({
      ...contract,
      cliente: contract.cliente_identificador,
      observacoes: contract.observacoes,
      FK_EQUIPAMENTO_id: contract.equipamento_id,  // Para compatibilidade
      data_locacao: contract.data_inicio,
      data_devolucao: contract.data_fim,
      valor: contract.valor_mensal
    });
  });
});

// Atualizar contrato
app.put("/contrato/:id", authenticateToken, canEdit, (req, res) => {
  const contratoId = req.params.id;
  const { cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal } = req.body;

  console.log("Atualizando contrato:", contratoId, req.body);

  if (!cliente_id || !equipamento_id || !data_inicio || !data_fim || !valor_mensal) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const sql = `
    UPDATE CONTRATO 
    SET cliente_id = ?, equipamento_id = ?, data_inicio = ?, data_fim = ?, valor_mensal = ?
    WHERE id = ?
  `;

  const values = [cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal, contratoId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar contrato:", err);
      return res.status(500).json({
        error: "Falha ao atualizar contrato.",
        details: err.message
      });
    }
    return res.json({
      message: "Contrato atualizado com sucesso"
    });
  });
});

// Deletar contrato (requer role admin)
app.delete("/contrato/:id", authenticateToken, canDelete, (req, res) => {
  const contratoId = req.params.id;
  const sql = "DELETE FROM CONTRATO WHERE id = ?";

  db.query(sql, [contratoId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar contrato:", err);
      return res.status(500).json({ error: "Erro ao deletar contrato." });
    }
    return res.json({ message: "Contrato deletado com sucesso." });
  });
});

// Buscar cliente por CPF/CNPJ
app.get("/clientes/find", authenticateToken, canView, (req, res) => {
  const identifier = req.query.q || '';
  const sql = `
    SELECT * FROM CLIENTE 
    WHERE cpf = ? OR cnpj = ?
  `;

  db.query(sql, [identifier, identifier], (err, data) => {
    if (err) {
      console.error("Erro de solicitação: ", err);
      return res.status(500).json({ error: "Erro do banco de dados." });
    }
    return res.json(data.length > 0 ? data[0] : null);
  });
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 8081;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.db = db;