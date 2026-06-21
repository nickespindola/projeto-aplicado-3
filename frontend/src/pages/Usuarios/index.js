import { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../../components/Pagination';

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const Usuarios = ({ usuario }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '', email: '', senha: '', role: 'viewer', ativo: true
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAdmin = usuario && usuario.role === 'admin';

  useEffect(() => { if (isAdmin) fetchUsuarios(); }, [isAdmin]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRole, filterStatus]);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('http://https://locatech-backend.onrender.com/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      alert('Erro ao carregar usuários');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || (!editingId && !formData.senha)) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { alert('Email inválido'); return; }

    try {
      if (editingId) {
        const dataToSend = { nome: formData.nome, email: formData.email, role: formData.role, ativo: formData.ativo };
        if (formData.senha) dataToSend.senha = formData.senha;
        await axios.put(`http://https://locatech-backend.onrender.com/usuarios/${editingId}`, dataToSend);
        alert('Usuário atualizado com sucesso!');
      } else {
        await axios.post('http://https://locatech-backend.onrender.com/usuarios', formData);
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
      const response = await axios.get(`http://https://locatech-backend.onrender.com/usuarios/${id}`);
      const user = response.data;
      setFormData({ nome: user.nome, email: user.email, senha: '', role: user.role, ativo: user.ativo });
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      alert('Erro ao carregar dados do usuário');
    }
  };

  const handleDelete = async (id) => {
    if (id === usuario.id) { alert('Você não pode deletar seu próprio usuário!'); return; }
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await axios.delete(`http://https://locatech-backend.onrender.com/usuarios/${id}`);
      alert('Usuário excluído com sucesso!');
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', email: '', senha: '', role: 'viewer', ativo: true });
    setEditingId(null);
    setShowForm(false);
  };

  const clearFilters = () => { setSearchTerm(''); setFilterRole(''); setFilterStatus(''); };
  const hasFilters = searchTerm || filterRole || filterStatus;

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Admin', color: '#e74c3c' },
      editor: { text: 'Editor', color: '#3498db' },
      viewer: { text: 'Viewer', color: '#95a5a6' }
    };
    return badges[role] || badges.viewer;
  };

  const filteredUsuarios = usuarios.filter(user => {
    const matchSearch = !searchTerm ||
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = !filterRole || user.role === filterRole;
    const matchStatus = !filterStatus ||
      (filterStatus === 'ativo' ? user.ativo : !user.ativo);
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isAdmin) {
    return (
      <div className="fade-in">
        <div className="alert alert-danger">
          <h4>Acesso Negado</h4>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>Usuários</h2>
          <p className="text-muted mb-0">Gerencie os usuários do sistema</p>
        </div>
        <button
          className="btn btn-success"
          onClick={() => { if (showForm && !editingId) setShowForm(false); else { resetForm(); setShowForm(true); } }}
        >
          {showForm && !editingId ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Nome Completo <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="nome" value={formData.nome}
                      onChange={handleInputChange} placeholder="Digite o nome completo" required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">E-mail <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" name="email" value={formData.email}
                      onChange={handleInputChange} placeholder="usuario@exemplo.com" required />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Senha {editingId ? '(deixe em branco para manter a atual)' : <span className="text-danger">*</span>}
                    </label>
                    <input type="password" className="form-control" name="senha" value={formData.senha}
                      onChange={handleInputChange} placeholder={editingId ? 'Nova senha (opcional)' : 'Digite a senha'}
                      required={!editingId} minLength="6" />
                    {!editingId && <small className="text-muted">Mínimo de 6 caracteres</small>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Permissão <span className="text-danger">*</span></label>
                    <select className="form-control" name="role" value={formData.role} onChange={handleInputChange} required>
                      <option value="viewer">Viewer — Visualização</option>
                      <option value="editor">Editor — Criar e editar</option>
                      <option value="admin">Admin — Acesso total</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group mb-3">
                    <label className="form-label">Status</label>
                    <div className="form-check form-switch mt-2">
                      <input className="form-check-input" type="checkbox" name="ativo" checked={formData.ativo}
                        onChange={handleInputChange} style={{ width: '3rem', height: '1.5rem' }} />
                      <label className="form-check-label ms-2">{formData.ativo ? 'Ativo' : 'Inativo'}</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">{editingId ? 'Atualizar' : 'Cadastrar'}</button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Usuários
            {hasFilters
              ? ` — ${filteredUsuarios.length} de ${usuarios.length}`
              : ` (${usuarios.length})`}
          </h5>
        </div>

        {/* Barra de filtros */}
        <div className="p-3 border-bottom bg-light">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '280px' }}
            />
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Todas as permissões</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            {hasFilters && (
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">
                {hasFilters ? 'Nenhum usuário encontrado com os filtros aplicados.' : 'Nenhum usuário cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
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
                    {paginatedUsuarios.map((user) => {
                      const badge = getRoleBadge(user.role);
                      return (
                        <tr key={user.id}>
                          <td>#{user.id}</td>
                          <td><strong>{user.nome}</strong></td>
                          <td>{user.email}</td>
                          <td>
                            <span className="badge" style={{ backgroundColor: badge.color, padding: '5px 12px', borderRadius: '12px' }}>
                              {badge.text}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${user.ativo ? 'bg-success' : 'bg-secondary'}`}>
                              {user.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(user.id)} title="Editar">
                              <IconEdit />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(user.id)} title="Excluir"
                              disabled={user.id === usuario.id}>
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredUsuarios.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </>
          )}
        </div>
      </div>

      <div className="card mt-4" style={{ borderLeft: '4px solid #3498db' }}>
        <div className="card-body">
          <h6 className="mb-3"><strong>Sobre as Permissões</strong></h6>
          <ul className="mb-0">
            <li><strong>Admin:</strong> Acesso total — pode criar, editar, visualizar e deletar todos os registros, incluindo usuários</li>
            <li><strong>Editor:</strong> Pode criar, editar e visualizar registros, mas não pode deletar</li>
            <li><strong>Viewer:</strong> Apenas visualização — não pode criar, editar ou deletar nenhum registro</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
