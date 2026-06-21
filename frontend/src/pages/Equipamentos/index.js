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

const TIPOS = ['Notebook', 'Desktop', 'Monitor', 'Impressora', 'Scanner', 'Projetor', 'Servidor', 'Outro'];

const Equipamentos = ({ usuario }) => {
  const [equipamentos, setEquipamentos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    marca: '', modelo: '', numero_serie: '', tipo: '', observacoes: ''
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canEdit = usuario && (usuario.role === 'admin' || usuario.role === 'editor');
  const canDelete = usuario && usuario.role === 'admin';

  useEffect(() => { fetchEquipamentos(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTipo]);

  const fetchEquipamentos = async () => {
    try {
      const response = await axios.get('http://localhost:8081/equipamento');
      setEquipamentos(response.data);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:8081/equipamento/${editingId}`, formData);
        alert('Equipamento atualizado com sucesso!');
      } else {
        await axios.post('http://localhost:8081/equipamento', formData);
        alert('Equipamento cadastrado com sucesso!');
      }
      resetForm();
      fetchEquipamentos();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      alert('Erro ao salvar equipamento: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8081/equipamento/${id}`);
      const equip = response.data;
      setFormData({
        marca: equip.marca || '', modelo: equip.modelo || '',
        numero_serie: equip.numero_serie || '', tipo: equip.tipo || '',
        observacoes: equip.observacoes || ''
      });
      setEditingId(id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      alert('Erro ao carregar dados do equipamento');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        await axios.delete(`http://localhost:8081/equipamento/${id}`);
        alert('Equipamento excluído com sucesso!');
        fetchEquipamentos();
      } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        alert('Erro ao excluir equipamento: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({ marca: '', modelo: '', numero_serie: '', tipo: '', observacoes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const clearFilters = () => { setSearchTerm(''); setFilterTipo(''); };
  const hasFilters = searchTerm || filterTipo;

  const filteredEquipamentos = equipamentos.filter(equip => {
    const matchSearch = !searchTerm ||
      equip.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equip.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equip.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equip.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filterTipo || equip.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const totalPages = Math.ceil(filteredEquipamentos.length / itemsPerPage);
  const paginatedEquipamentos = filteredEquipamentos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>Equipamentos</h2>
          <p className="text-muted mb-0">Gerencie seu inventário de equipamentos</p>
        </div>
        {canEdit && (
          <button
            className="btn btn-success"
            onClick={() => { if (showForm && !editingId) setShowForm(false); else { resetForm(); setShowForm(true); } }}
          >
            {showForm && !editingId ? 'Cancelar' : '+ Novo Equipamento'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingId ? 'Editar Equipamento' : 'Novo Equipamento'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Marca <span className="text-danger">*</span></label>
                    <input type="text" name="marca" className="form-control" placeholder="Ex: Lenovo, Dell, HP"
                      value={formData.marca} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Modelo <span className="text-danger">*</span></label>
                    <input type="text" name="modelo" className="form-control" placeholder="Ex: ThinkPad X1, Latitude 5420"
                      value={formData.modelo} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Número de Série <span className="text-danger">*</span></label>
                    <input type="text" name="numero_serie" className="form-control" placeholder="Ex: SN123456789"
                      value={formData.numero_serie} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Tipo de Equipamento <span className="text-danger">*</span></label>
                    <select name="tipo" className="form-select" value={formData.tipo} onChange={handleInputChange} required>
                      <option value="">Selecione o tipo</option>
                      {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Observações</label>
                <textarea name="observacoes" className="form-control"
                  placeholder="Informações adicionais sobre o equipamento"
                  value={formData.observacoes} onChange={handleInputChange} maxLength={255} rows={3} />
                <small className="text-muted">{formData.observacoes.length}/255 caracteres</small>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-success">{editingId ? 'Salvar Alterações' : 'Cadastrar Equipamento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Equipamentos
            {hasFilters
              ? ` — ${filteredEquipamentos.length} de ${equipamentos.length}`
              : ` (${equipamentos.length})`}
          </h5>
        </div>

        {/* Barra de filtros */}
        <div className="p-3 border-bottom bg-light">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar por marca, modelo ou nº de série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '320px' }}
            />
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {hasFilters && (
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          {filteredEquipamentos.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {hasFilters ? 'Nenhum equipamento encontrado com os filtros aplicados.' : 'Nenhum equipamento cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Nº Série</th>
                      <th>Observações</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEquipamentos.map((equip) => (
                      <tr key={equip.id}>
                        <td>#{equip.id}</td>
                        <td><span className="badge bg-secondary">{equip.tipo}</span></td>
                        <td><strong>{equip.marca}</strong></td>
                        <td>{equip.modelo}</td>
                        <td><code>{equip.numero_serie}</code></td>
                        <td title={equip.observacoes || ''}>
                          {equip.observacoes
                            ? (equip.observacoes.length > 40 ? equip.observacoes.substring(0, 40) + '...' : equip.observacoes)
                            : '-'}
                        </td>
                        <td className="text-center">
                          {canEdit && (
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(equip.id)} title="Editar">
                              <IconEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(equip.id)} title="Excluir">
                              <IconTrash />
                            </button>
                          )}
                          {!canEdit && !canDelete && <span className="text-muted small">Apenas visualização</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredEquipamentos.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Equipamentos;
