import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Usuarios = ({ usuario }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'viewer',
    ativo: true
  });

  // Apenas admin pode acessar esta página
  const isAdmin = usuario && usuario.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios();
    }
  }, [isAdmin]);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('http://localhost:8081/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      alert('Erro ao carregar usuários');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.email || (!editingId && !formData.senha)) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Email inválido');
      return;
    }

    try {
      if (editingId) {
        // Atualizar usuário
        const dataToSend = {
          nome: formData.nome,
          email: formData.email,
          role: formData.role,
          ativo: formData.ativo
        };

        // Só enviar senha se foi preenchida
        if (formData.senha) {
          dataToSend.senha = formData.senha;
        }

        await axios.put(`http://localhost:8081/usuarios/${editingId}`, dataToSend);
        alert('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        await axios.post('http://localhost:8081/usuarios', formData);
        alert('Usuário criado com sucesso!');
      }

      resetForm();
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8081/usuarios/${id}`);
      const user = response.data;

      setFormData({
        nome: user.nome,
        email: user.email,
        senha: '', // Não preencher a senha ao editar
        role: user.role,
        ativo: user.ativo
      });
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      alert('Erro ao carregar dados do usuário');
    }
  };

  const handleDelete = async (id) => {
    if (id === usuario.id) {
      alert('Você não pode deletar seu próprio usuário!');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8081/usuarios/${id}`);
      alert('Usuário excluído com sucesso!');
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      role: 'viewer',
      ativo: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Admin', color: '#e74c3c', icon: '👑' },
      editor: { text: 'Editor', color: '#3498db', icon: '✏️' },
      viewer: { text: 'Viewer', color: '#95a5a6', icon: '👁️' }
    };
    return badges[role] || badges.viewer;
  };

  const filteredUsuarios = usuarios.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="fade-in">
        <div className="alert alert-danger">
          <h4>🚫 Acesso Negado</h4>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>
            <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>👥</span>
            Usuários
          </h2>
          <p className="text-muted mb-0">Gerencie os usuários do sistema</p>
        </div>
        <button
          className="btn btn-success"
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
        >
          {showForm && !editingId ? '✕ Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <h5 className="mb-0">{editingId ? '✏️ Editar Usuário' : '➕ Novo Usuário'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Nome Completo <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">E-mail <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="usuario@exemplo.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Senha {editingId ? '(deixe em branco para manter a atual)' : <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      placeholder={editingId ? 'Nova senha (opcional)' : 'Digite a senha'}
                      required={!editingId}
                      minLength="6"
                    />
                    {!editingId && (
                      <small className="text-muted">Mínimo de 6 caracteres</small>
                    )}
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Permissão <span className="text-danger">*</span></label>
                    <select
                      className="form-control"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="viewer">👁️ Viewer (Visualização)</option>
                      <option value="editor">✏️ Editor (Criar/Editar)</option>
                      <option value="admin">👑 Admin (Total)</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="form-group mb-3">
                    <label className="form-label">Status</label>
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="ativo"
                        checked={formData.ativo}
                        onChange={handleInputChange}
                        style={{ width: '3rem', height: '1.5rem' }}
                      />
                      <label className="form-check-label ms-2">
                        {formData.ativo ? 'Ativo' : 'Inativo'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingId ? '💾 Atualizar' : '➕ Cadastrar'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  ✕ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h5 className="mb-0">📋 Lista de Usuários ({filteredUsuarios.length})</h5>
            </div>
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          {filteredUsuarios.length === 0 ? (
            <p className="text-center text-muted mb-0">
              {searchTerm ? 'Nenhum usuário encontrado com essa busca.' : 'Nenhum usuário cadastrado ainda.'}
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Permissão</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map((user) => {
                    const badge = getRoleBadge(user.role);
                    return (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td><strong>{user.nome}</strong></td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: badge.color,
                              padding: '5px 12px',
                              borderRadius: '12px'
                            }}
                          >
                            {badge.icon} {badge.text}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${user.ativo ? 'bg-success' : 'bg-secondary'}`}>
                            {user.ativo ? '✓ Ativo' : '✗ Inativo'}
                          </span>
                        </td>
                        <td>
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(user.id)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(user.id)}
                            title="Excluir"
                            disabled={user.id === usuario.id}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Informações sobre permissões */}
      <div className="card mt-4" style={{ borderLeft: '4px solid #3498db' }}>
        <div className="card-body">
          <h6 className="mb-3"><strong>ℹ️ Sobre as Permissões:</strong></h6>
          <ul className="mb-0">
            <li><strong>👑 Admin:</strong> Acesso total ao sistema - pode criar, editar, visualizar e deletar todos os registros, incluindo usuários</li>
            <li><strong>✏️ Editor:</strong> Pode criar, editar e visualizar registros, mas NÃO pode deletar</li>
            <li><strong>👁️ Viewer:</strong> Apenas visualização - não pode criar, editar ou deletar nenhum registro</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
