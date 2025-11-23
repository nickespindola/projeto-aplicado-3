import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Equipamentos = ({ usuario }) => {
  const [equipamentos, setEquipamentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    numero_serie: '',
    tipo: '',
    observacoes: ''
  });

  // Verificar permissões
  const canEdit = usuario && (usuario.role === 'admin' || usuario.role === 'editor');
  const canDelete = usuario && usuario.role === 'admin';

  useEffect(() => {
    fetchEquipamentos();
  }, []);

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
        marca: equip.marca || '',
        modelo: equip.modelo || '',
        numero_serie: equip.numero_serie || '',
        tipo: equip.tipo || '',
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
    setFormData({
      marca: '',
      modelo: '',
      numero_serie: '',
      tipo: '',
      observacoes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getIconeTipo = (tipo) => {
    const icones = {
      'Notebook': '💻',
      'Desktop': '🖥️',
      'Monitor': '📺',
      'Impressora': '🖨️',
      'Scanner': '📄',
      'Projetor': '📽️',
      'Servidor': '🗄️',
      'Outro': '📦'
    };
    return icones[tipo] || '📦';
  };

  const filteredEquipamentos = equipamentos.filter(equip =>
    equip.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>
            <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>💻</span>
            Equipamentos
          </h2>
          <p className="text-muted mb-0">Gerencie seu inventário de equipamentos</p>
        </div>
        {canEdit && (
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
            {showForm && !editingId ? '✕ Cancelar' : '+ Novo Equipamento'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
            <h5 className="mb-0">{editingId ? '✏️ Editar Equipamento' : '➕ Novo Equipamento'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Marca <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="marca"
                      className="form-control"
                      placeholder="Ex: Lenovo, Dell, HP, Positivo"
                      value={formData.marca}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Modelo <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="modelo"
                      className="form-control"
                      placeholder="Ex: ThinkPad X1, Latitude 5420"
                      value={formData.modelo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Número de Série <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="numero_serie"
                      className="form-control"
                      placeholder="Ex: SN123456789"
                      value={formData.numero_serie}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Tipo de Equipamento <span className="text-danger">*</span></label>
                    <select
                      name="tipo"
                      className="form-select"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="Notebook">💻 Notebook</option>
                      <option value="Desktop">🖥️ Desktop</option>
                      <option value="Monitor">📺 Monitor</option>
                      <option value="Impressora">🖨️ Impressora</option>
                      <option value="Scanner">📄 Scanner</option>
                      <option value="Projetor">📽️ Projetor</option>
                      <option value="Servidor">🗄️ Servidor</option>
                      <option value="Outro">📦 Outro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">💡 Observações</label>
                <textarea
                  name="observacoes"
                  className="form-control"
                  placeholder="Informações adicionais sobre o equipamento (estado, características especiais, etc.)"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  maxLength={255}
                  rows={4}
                />
                <small className="text-muted">
                  Máximo de 255 caracteres ({formData.observacoes.length}/255)
                </small>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  {editingId ? '💾 Salvar Alterações' : '✓ Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">📋 Lista de Equipamentos ({filteredEquipamentos.length})</h5>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar por marca, modelo, série ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '350px', backgroundColor: 'rgba(255,255,255,0.9)' }}
            />
          </div>
        </div>
        <div className="card-body p-0">
          {filteredEquipamentos.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {searchTerm ? '🔍 Nenhum equipamento encontrado com esse critério' : '📭 Nenhum equipamento cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
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
                  {filteredEquipamentos.map((equip) => (
                    <tr key={equip.id}>
                      <td>#{equip.id}</td>
                      <td>
                        <span style={{ fontSize: '1.5rem' }}>{getIconeTipo(equip.tipo)}</span>
                        <span className="ms-2">{equip.tipo}</span>
                      </td>
                      <td><strong>{equip.marca}</strong></td>
                      <td>{equip.modelo}</td>
                      <td><code>{equip.numero_serie}</code></td>
                      <td>
                        {equip.observacoes ? (
                          <span title={equip.observacoes}>
                            {equip.observacoes.length > 30 ? equip.observacoes.substring(0, 30) + '...' : equip.observacoes}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="text-center">
                        {canEdit && (
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(equip.id)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(equip.id)}
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        )}
                        {!canEdit && !canDelete && (
                          <span className="text-muted small">Apenas visualização</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Equipamentos;
