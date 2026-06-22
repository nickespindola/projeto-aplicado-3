const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';

const mockDb = {
  connect: jest.fn((callback) => {
    if (callback) callback(null);
  }),
  query: jest.fn(),
};

jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => mockDb),
}));

const app = require('../server');

// Hash pré-computado de 'admin123' para uso nos mocks
const SENHA_HASH = '$2b$10$F0PI98xpfgMUlc1lUkDHkOLZpaSy0JPYg0U/L0.xX06zoheUc0Js2';

const adminUser = {
  id: 1,
  nome: 'Administrador',
  email: 'admin@locatech.com',
  senha: SENHA_HASH,
  role: 'admin',
  ativo: true,
};

const viewerUser = {
  id: 2,
  nome: 'Visualizador',
  email: 'viewer@locatech.com',
  role: 'viewer',
  ativo: true,
};

const setDefaultQueryMock = () => {
  mockDb.query.mockImplementation((sql, params, callback) => {
    const cb = typeof params === 'function' ? params : callback;
    const args = Array.isArray(params) ? params : [];
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    if (normalizedSql === 'SELECT * FROM USUARIO WHERE email = ? AND ativo = TRUE') {
      const email = args[0];

      if (email === adminUser.email) {
        return cb(null, [adminUser]);
      }

      if (email === viewerUser.email) {
        return cb(null, [viewerUser]);
      }

      return cb(null, []);
    }

    if (
      normalizedSql ===
      'SELECT id, nome, email, role, ativo, created_at, updated_at FROM USUARIO ORDER BY id DESC'
    ) {
      return cb(null, [adminUser, viewerUser]);
    }

    if (normalizedSql === 'SELECT * FROM CLIENTE') {
      return cb(null, [
        {
          id: 10,
          nome: 'Cliente Teste',
          e_mail: 'cliente@teste.com',
        },
      ]);
    }

    return cb(null, []);
  });
};

describe('API de autenticação e permissões', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setDefaultQueryMock();
  });

  test('retorna 400 quando email ou senha não são enviados', async () => {
    const response = await request(app).post('/auth/login').send({ email: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Email e senha são obrigatórios' });
  });

  test('faz login com sucesso e devolve token JWT válido', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: adminUser.email, senha: 'admin123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.usuario).toMatchObject({
      id: adminUser.id,
      nome: adminUser.nome,
      email: adminUser.email,
      role: adminUser.role,
    });

    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({
      id: adminUser.id,
      email: adminUser.email,
      nome: adminUser.nome,
      role: adminUser.role,
    });
  });

  test('bloqueia login com senha incorreta', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: adminUser.email, senha: 'senha-errada' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Email ou senha incorretos' });
  });

  test('retorna 401 ao verificar token sem autenticação', async () => {
    const response = await request(app).get('/auth/verify');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token não fornecido' });
  });

  test('permite usuário autenticado visualizar clientes', async () => {
    const token = jwt.sign(
      {
        id: viewerUser.id,
        email: viewerUser.email,
        nome: viewerUser.nome,
        role: viewerUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const response = await request(app)
      .get('/clientes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ nome: 'Cliente Teste' });
  });

  test('bloqueia usuário viewer ao acessar usuários', async () => {
    const token = jwt.sign(
      {
        id: viewerUser.id,
        email: viewerUser.email,
        nome: viewerUser.nome,
        role: viewerUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const response = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Acesso negado. Apenas administradores.' });
  });

  test('permite admin listar usuários', async () => {
    const token = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        nome: adminUser.nome,
        role: adminUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const response = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toMatchObject({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
  });
});
