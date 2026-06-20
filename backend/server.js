require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { authenticateToken, canEdit, canDelete, canView, JWT_SECRET } = require("./middleware/auth");

const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  const { nome, e_mail, telefone, tipo_cliente, cpf, cnpj,
          cep, logradouro, numero, complemento, bairro, cidade, uf } = req.body;

  if (!nome || !e_mail || !telefone || !tipo_cliente || !cep || !logradouro || !numero) {
    return res.status(400).json({ error: "Faltou preencher dados obrigatórios." });
  }

  if (tipo_cliente !== 'PF' && tipo_cliente !== 'PJ') {
    return res.status(400).json({ error: "Tipo de cliente inválido. Use 'PF' ou 'PJ'." });
  }

  const sql = `
    INSERT INTO CLIENTE
    (nome, e_mail, telefone, tipo_cliente, cpf, cnpj, cep, logradouro, numero, complemento, bairro, cidade, uf)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nome, e_mail, telefone, tipo_cliente,
    cpf || null, cnpj || null,
    cep, logradouro, numero,
    complemento || null, bairro || null, cidade || null, uf || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao inserir cliente:", err);
      return res.status(500).json({ error: "Falha ao inserir no banco de dados.", details: err.message });
    }
    return res.status(201).json({ id: result.insertId, message: "Cliente cadastrado com sucesso" });
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
  const { nome, e_mail, telefone, tipo_cliente, cpf, cnpj,
          cep, logradouro, numero, complemento, bairro, cidade, uf } = req.body;

  if (!nome || !e_mail || !telefone || !tipo_cliente || !cep || !logradouro || !numero) {
    return res.status(400).json({ error: "Faltou preencher dados obrigatórios." });
  }

  if (tipo_cliente !== 'PF' && tipo_cliente !== 'PJ') {
    return res.status(400).json({ error: "Tipo de cliente inválido. Use 'PF' ou 'PJ'." });
  }

  const sql = `
    UPDATE CLIENTE
    SET nome = ?, e_mail = ?, telefone = ?, tipo_cliente = ?, cpf = ?, cnpj = ?,
        cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?
    WHERE id = ?
  `;

  const values = [
    nome, e_mail, telefone, tipo_cliente,
    cpf || null, cnpj || null,
    cep, logradouro, numero,
    complemento || null, bairro || null, cidade || null, uf || null,
    clienteId
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("Erro ao atualizar cliente:", err);
      return res.status(500).json({ error: "Falha ao atualizar cliente.", details: err.message });
    }
    return res.json({ message: "Cliente atualizado com sucesso" });
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
  const sqlSelect = `
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

  // Duas queries encadeadas (multipleStatements não habilitado na conexão)
  db.query(
    `UPDATE CONTRATO SET status = 'ativo' WHERE data_inicio <= CURDATE() AND status = 'pendente'`,
    (err1) => {
      if (err1) console.error("Erro ao ativar contratos pendentes:", err1);

      db.query(
        `UPDATE CONTRATO SET status = 'finalizado' WHERE data_fim < CURDATE() AND status = 'ativo'`,
        (err2) => {
          if (err2) console.error("Erro ao finalizar contratos vencidos:", err2);

          db.query(sqlSelect, (err, data) => {
            if (err) {
              console.error("Erro ao buscar contratos:", err);
              return res.status(500).json({ error: "Erro do banco de dados." });
            }
            return res.json(data);
          });
        }
      );
    }
  );
});

// Criar contrato
app.post("/contrato", authenticateToken, canEdit, (req, res) => {
  const { cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal } = req.body;

  if (!cliente_id || !equipamento_id || !data_inicio || !data_fim || !valor_mensal) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  // Início no futuro → pendente; início hoje ou passado → ativo
  const hoje = new Date().toISOString().split('T')[0];
  const statusInicial = data_inicio > hoje ? 'pendente' : 'ativo';

  const sql = `
    INSERT INTO CONTRATO
    (cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal, statusInicial], (err, result) => {
    if (err) {
      console.error("Erro ao criar contrato:", err);
      return res.status(500).json({ error: "Falha ao criar contrato." });
    }
    return res.json({ id: result.insertId, message: "Contrato criado com sucesso", status: statusInicial });
  });
});

// Endpoint de busca avançada de contratos
app.get("/listarcontratos", authenticateToken, canView, (req, res) => {
  const searchTerm = req.query.search || '';
  const searchParam = `%${searchTerm}%`;

  const sqlSelect = `
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
  const params = [searchParam, searchParam, searchParam, searchParam, searchParam];

  db.query(
    `UPDATE CONTRATO SET status = 'ativo' WHERE data_inicio <= CURDATE() AND status = 'pendente'`,
    (err1) => {
      if (err1) console.error("Erro ao ativar contratos pendentes:", err1);

      db.query(
        `UPDATE CONTRATO SET status = 'finalizado' WHERE data_fim < CURDATE() AND status = 'ativo'`,
        (err2) => {
          if (err2) console.error("Erro ao finalizar contratos vencidos:", err2);

          db.query(sqlSelect, params, (err, data) => {
            if (err) {
              console.error("Erro de solicitação: ", err);
              return res.status(500).json({ error: "Erro do banco de dados." });
            }
            return res.json(data);
          });
        }
      );
    }
  );
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
  const { cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal, status } = req.body;

  if (!cliente_id || !equipamento_id || !data_inicio || !data_fim || !valor_mensal) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const statusValidos = ['pendente', 'ativo', 'finalizado', 'cancelado', 'devolvido'];
  const statusFinal = statusValidos.includes(status) ? status : 'ativo';

  const sql = `
    UPDATE CONTRATO
    SET cliente_id = ?, equipamento_id = ?, data_inicio = ?, data_fim = ?, valor_mensal = ?, status = ?
    WHERE id = ?
  `;

  db.query(sql, [cliente_id, equipamento_id, data_inicio, data_fim, valor_mensal, statusFinal, contratoId], (err) => {
    if (err) {
      console.error("Erro ao atualizar contrato:", err);
      return res.status(500).json({ error: "Falha ao atualizar contrato.", details: err.message });
    }
    return res.json({ message: "Contrato atualizado com sucesso" });
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

// ==================== NOTIFICAÇÕES ====================

// POST /contratos/notificar-vencimento
// Envia e-mail para clientes cujos contratos vencem nos próximos N dias (padrão: 30)
app.post('/contratos/notificar-vencimento', authenticateToken, canEdit, (req, res) => {
  const dias = parseInt(req.body.dias) || 30;

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'seu-email@gmail.com') {
    return res.status(503).json({
      error: 'E-mail não configurado. Preencha EMAIL_USER e EMAIL_PASS no arquivo .env do backend.'
    });
  }

  const sql = `
    SELECT
      c.id,
      DATE_FORMAT(c.data_fim, '%Y-%m-%d') AS data_fim,
      c.valor_mensal,
      cl.nome AS cliente_nome,
      cl.e_mail AS cliente_email,
      CONCAT(e.marca, ' ', e.modelo) AS equipamento
    FROM CONTRATO c
    JOIN CLIENTE cl ON c.cliente_id = cl.id
    JOIN EQUIPAMENTO e ON c.equipamento_id = e.id
    WHERE c.status = 'ativo'
      AND c.data_fim BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND cl.e_mail IS NOT NULL AND cl.e_mail != ''
    ORDER BY c.data_fim ASC
  `;

  db.query(sql, [dias], async (err, contratos) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar contratos.' });

    if (contratos.length === 0) {
      return res.json({ enviados: 0, total: 0, semEmail: 0, erros: [],
        message: `Nenhum contrato ativo vence nos próximos ${dias} dias (ou nenhum cliente tem e-mail cadastrado).` });
    }

    let enviados = 0;
    const erros = [];

    for (const contrato of contratos) {
      const dataFim = new Date(contrato.data_fim + 'T12:00:00');
      const dataFimFormatada = dataFim.toLocaleDateString('pt-BR');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const diasRestantes = Math.ceil((dataFim - hoje) / (1000 * 60 * 60 * 24));

      try {
        await mailer.sendMail({
          from: `"LocaTech" <${process.env.EMAIL_USER}>`,
          to: contrato.cliente_email,
          subject: `[LocaTech] Seu contrato vence em ${diasRestantes} dia(s)`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
              <h2 style="color:#4f46e5;margin-top:0">LocaTech</h2>
              <p>Olá, <strong>${contrato.cliente_nome}</strong>!</p>
              <p>Informamos que seu contrato de locação está próximo do vencimento:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#f8fafc">
                  <td style="padding:8px 12px;font-weight:600">Equipamento</td>
                  <td style="padding:8px 12px">${contrato.equipamento}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;font-weight:600">Vencimento</td>
                  <td style="padding:8px 12px"><strong style="color:#d97706">${dataFimFormatada}</strong> (${diasRestantes} dia(s))</td>
                </tr>
                <tr style="background:#f8fafc">
                  <td style="padding:8px 12px;font-weight:600">Valor mensal</td>
                  <td style="padding:8px 12px">R$ ${parseFloat(contrato.valor_mensal).toFixed(2)}</td>
                </tr>
              </table>
              <p>Caso deseje renovar o contrato ou tenha dúvidas, entre em contato conosco.</p>
              <p style="color:#64748b;font-size:0.85em;margin-top:24px">Atenciosamente,<br><strong>LocaTech</strong></p>
            </div>
          `
        });
        enviados++;
      } catch (emailErr) {
        erros.push({ contratoId: contrato.id, email: contrato.cliente_email, erro: emailErr.message });
      }
    }

    return res.json({ enviados, total: contratos.length, erros });
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