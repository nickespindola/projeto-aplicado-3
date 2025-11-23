const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'locatech-secret-key-2025';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar permissões específicas
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Sem permissão',
        message: `Esta ação requer permissão: ${allowedRoles.join(' ou ')}`
      });
    }

    next();
  };
};

// Verificar se pode editar (admin ou editor)
const canEdit = requireRole('admin', 'editor');

// Verificar se pode deletar (apenas admin)
const canDelete = requireRole('admin');

// Verificar se pode visualizar (qualquer um autenticado)
const canView = authenticateToken;

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
  canEdit,
  canDelete,
  canView
};
