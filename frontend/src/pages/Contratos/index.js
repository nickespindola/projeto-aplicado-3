import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Contratos = ({ usuario }) => {
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: '',
    equipamento_id: '',
    data_inicio: '',
    data_fim: '',
    valor_mensal: ''
  });

  // Verificar permissões
  const canEdit = usuario && (usuario.role === 'admin' || usuario.role === 'editor');
  const canDelete = usuario && usuario.role === 'admin';

  useEffect(() => {
    fetchContratos();
    fetchClientes();
    fetchEquipamentos();
  }, []);

  const fetchContratos = async () => {
    try {
      const response = await axios.get('http://localhost:8081/contrato');
      setContratos(response.data);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get('http://localhost:8081/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

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
        await axios.put(`http://localhost:8081/contrato/${editingId}`, formData);
        alert('Contrato atualizado com sucesso!');
      } else {
        await axios.post('http://localhost:8081/contrato', formData);
        alert('Contrato cadastrado com sucesso!');
      }
      resetForm();
      fetchContratos();
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      alert('Erro ao salvar contrato: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8081/contrato/${id}`);
      const contrato = response.data;

      setFormData({
        cliente_id: contrato.cliente_id || '',
        equipamento_id: contrato.equipamento_id || '',
        data_inicio: contrato.data_inicio ? contrato.data_inicio.split('T')[0] : '',
        data_fim: contrato.data_fim ? contrato.data_fim.split('T')[0] : '',
        valor_mensal: contrato.valor_mensal || ''
      });
      setEditingId(id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      alert('Erro ao carregar dados do contrato');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
      try {
        await axios.delete(`http://localhost:8081/contrato/${id}`);
        alert('Contrato excluído com sucesso!');
        fetchContratos();
      } catch (error) {
        console.error('Erro ao excluir contrato:', error);
        alert('Erro ao excluir contrato: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      equipamento_id: '',
      data_inicio: '',
      data_fim: '',
      valor_mensal: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getClienteNome = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nome : 'Desconhecido';
  };

  const getEquipamentoDescricao = (id) => {
    const equip = equipamentos.find(e => e.id === id);
    return equip ? `${equip.marca} ${equip.modelo}` : 'Desconhecido';
  };

  const filteredContratos = contratos.filter(contrato => {
    const clienteNome = getClienteNome(contrato.cliente_id).toLowerCase();
    const equipDesc = getEquipamentoDescricao(contrato.equipamento_id).toLowerCase();
    const search = searchTerm.toLowerCase();

    return clienteNome.includes(search) ||
      equipDesc.includes(search) ||
      contrato.id.toString().includes(search);
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>
            <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>📝</span>
            Contratos
          </h2>
          <p className="text-muted mb-0">Gerencie os contratos de locação</p>
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
            {showForm && !editingId ? '✕ Cancelar' : '+ Novo Contrato'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <h5 className="mb-0">{editingId ? '✏️ Editar Contrato' : '➕ Novo Contrato'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Cliente <span className="text-danger">*</span></label>
                    <select
                      name="cliente_id"
                      className="form-select"
                      value={formData.cliente_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome} - {cliente.cpf_cnpj}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Selecione o cliente que irá alugar o equipamento</small>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Equipamento <span className="text-danger">*</span></label>
                    <select
                      name="equipamento_id"
                      className="form-select"
                      value={formData.equipamento_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione um equipamento</option>
                      {equipamentos.map(equip => (
                        <option key={equip.id} value={equip.id}>
                          {equip.tipo} - {equip.marca} {equip.modelo} (S/N: {equip.numero_serie})
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Selecione o equipamento a ser locado</small>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Data de Início <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      name="data_inicio"
                      className="form-control"
                      value={formData.data_inicio}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Data de Fim <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      name="data_fim"
                      className="form-control"
                      value={formData.data_fim}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Valor Mensal (R$) <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      name="valor_mensal"
                      className="form-control"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.valor_mensal}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  {editingId ? '💾 Salvar Alterações' : '✓ Cadastrar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">📋 Lista de Contratos ({filteredContratos.length})</h5>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar por cliente, equipamento ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '350px', backgroundColor: 'rgba(255,255,255,0.9)' }}
            />
          </div>
        </div>
        <div className="card-body p-0">
          {filteredContratos.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {searchTerm ? '🔍 Nenhum contrato encontrado com esse critério' : '📭 Nenhum contrato cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Equipamento</th>
                    <th>Data Início</th>
                    <th>Data Fim</th>
                    <th>Valor Mensal</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContratos.map((contrato) => (
                    <tr key={contrato.id}>
                      <td>#{contrato.id}</td>
                      <td><strong>{getClienteNome(contrato.cliente_id)}</strong></td>
                      <td>{getEquipamentoDescricao(contrato.equipamento_id)}</td>
                      <td>{formatDate(contrato.data_inicio)}</td>
                      <td>{formatDate(contrato.data_fim)}</td>
                      <td>
                        <strong className="text-success">
                          R$ {parseFloat(contrato.valor_mensal).toFixed(2)}
                        </strong>
                      </td>
                      <td className="text-center">
                        {canEdit && (
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(contrato.id)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(contrato.id)}
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

export default Contratos;
