import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Clientes = ({ usuario }) => {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    tipo_cliente: ''
  });

  // Verificar permissões
  const canEdit = usuario && (usuario.role === 'admin' || usuario.role === 'editor');
  const canDelete = usuario && usuario.role === 'admin';

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await axios.get('http://localhost:8081/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const formatTelefone = (value) => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    } else {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'telefone') {
      newValue = formatTelefone(value);
    }

    if (name === 'cpf_cnpj') {
      // Determina se é CPF ou CNPJ baseado no tipo de cliente
      if (formData.tipo_cliente === 'Pessoa Física') {
        newValue = formatCPF(value);
      } else if (formData.tipo_cliente === 'Pessoa Jurídica') {
        newValue = formatCNPJ(value);
      } else {
        // Se não selecionou o tipo ainda, permite digitar apenas números
        newValue = value.replace(/\D/g, '');
      }
    }

    // Se mudar o tipo de cliente, limpa o CPF/CNPJ
    if (name === 'tipo_cliente') {
      setFormData(prev => ({ ...prev, [name]: newValue, cpf_cnpj: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tipoParaEnviar = formData.tipo_cliente === 'Pessoa Física' ? 'PF' :
      formData.tipo_cliente === 'Pessoa Jurídica' ? 'PJ' :
        formData.tipo_cliente;

    // Remover formatação do CPF/CNPJ
    const cpfCnpjLimpo = formData.cpf_cnpj.replace(/\D/g, '');

    const dataToSend = {
      nome: formData.nome,
      endereco: formData.endereco,
      e_mail: formData.email,
      telefone: formData.telefone,
      tipo_cliente: tipoParaEnviar,
      cpf: tipoParaEnviar === 'PF' ? cpfCnpjLimpo : null,
      cnpj: tipoParaEnviar === 'PJ' ? cpfCnpjLimpo : null
    };

    console.log('Enviando para backend:', dataToSend);

    try {
      if (editingId) {
        await axios.put(`http://localhost:8081/clientes/${editingId}`, dataToSend);
        alert('Cliente atualizado com sucesso!');
      } else {
        await axios.post('http://localhost:8081/clientes', dataToSend);
        alert('Cliente cadastrado com sucesso!');
      }
      resetForm();
      fetchClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      console.error('Resposta do servidor:', error.response?.data);
      alert('Erro ao salvar cliente: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = async (id) => {
    console.log('🔍 Tentando editar cliente com ID:', id);
    try {
      const url = `http://localhost:8081/clientes/${id}`;
      console.log('🌐 URL da requisição:', url);
      const response = await axios.get(url);
      console.log('✅ Resposta do servidor:', response.data);
      const cliente = response.data;

      const tipoExibicao = cliente.tipo_cliente === 'PF' ? 'Pessoa Física' :
        cliente.tipo_cliente === 'PJ' ? 'Pessoa Jurídica' :
          cliente.tipo_cliente;

      // Pegar CPF ou CNPJ do banco (eles vêm separados)
      const cpfCnpjValue = cliente.cpf || cliente.cnpj || '';

      setFormData({
        nome: cliente.nome || '',
        cpf_cnpj: cpfCnpjValue,
        telefone: cliente.telefone || '',
        email: cliente.e_mail || '',
        endereco: cliente.endereco || '',
        tipo_cliente: tipoExibicao
      });
      setEditingId(id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Dados:', error.response?.data);
      alert('Erro ao carregar dados do cliente: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      console.log('🗑️ Tentando deletar cliente com ID:', id);
      try {
        const url = `http://localhost:8081/clientes/${id}`;
        console.log('🌐 URL da requisição:', url);
        const response = await axios.delete(url);
        console.log('✅ Cliente deletado:', response.data);
        alert('Cliente excluído com sucesso!');
        fetchClientes();
      } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Dados:', error.response?.data);
        alert('Erro ao excluir cliente: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf_cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      tipo_cliente: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf_cnpj.includes(searchTerm) ||
    (cliente.telefone && cliente.telefone.includes(searchTerm))
  );

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>
            <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>👥</span>
            Clientes
          </h2>
          <p className="text-muted mb-0">Gerencie seus clientes</p>
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
            {showForm && !editingId ? '✕ Cancelar' : '+ Novo Cliente'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <h5 className="mb-0">{editingId ? '✏️ Editar Cliente' : '➕ Novo Cliente'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Nome Completo / Razão Social <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="nome"
                      className="form-control"
                      placeholder="Digite o nome completo"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Tipo de Cliente <span className="text-danger">*</span></label>
                    <select
                      name="tipo_cliente"
                      className="form-select"
                      value={formData.tipo_cliente}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="Pessoa Física">Pessoa Física (PF)</option>
                      <option value="Pessoa Jurídica">Pessoa Jurídica (PJ)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      {formData.tipo_cliente === 'Pessoa Física' ? 'CPF' :
                        formData.tipo_cliente === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF / CNPJ'}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="cpf_cnpj"
                      className="form-control"
                      placeholder={
                        formData.tipo_cliente === 'Pessoa Física' ? '000.000.000-00' :
                          formData.tipo_cliente === 'Pessoa Jurídica' ? '00.000.000/0000-00' :
                            'Selecione o tipo de cliente primeiro'
                      }
                      value={formData.cpf_cnpj}
                      onChange={handleInputChange}
                      maxLength={formData.tipo_cliente === 'Pessoa Física' ? 14 : 18}
                      disabled={!formData.tipo_cliente}
                      required
                    />
                    {!formData.tipo_cliente && (
                      <small className="text-warning">⚠️ Selecione o tipo de cliente primeiro</small>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">E-mail <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="cliente@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Telefone <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="telefone"
                      className="form-control"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Endereço Completo <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="endereco"
                      className="form-control"
                      placeholder="Rua, número, bairro, cidade - UF"
                      value={formData.endereco}
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
                  {editingId ? '💾 Salvar Alterações' : '✓ Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">📋 Lista de Clientes ({filteredClientes.length})</h5>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar por nome, CPF/CNPJ ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '350px', backgroundColor: 'rgba(255,255,255,0.9)' }}
            />
          </div>
        </div>
        <div className="card-body p-0">
          {filteredClientes.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {searchTerm ? '🔍 Nenhum cliente encontrado com esse critério' : '📭 Nenhum cliente cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>CPF/CNPJ</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th>Endereço</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>#{cliente.id}</td>
                      <td><strong>{cliente.nome}</strong></td>
                      <td>
                        <span className={`badge ${cliente.tipo_cliente === 'PF' ? 'bg-info' : 'bg-warning'}`}>
                          {cliente.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </span>
                      </td>
                      <td>{cliente.cpf || cliente.cnpj || '-'}</td>
                      <td>{cliente.telefone || '-'}</td>
                      <td>{cliente.e_mail || '-'}</td>
                      <td>{cliente.endereco}</td>
                      <td className="text-center">
                        {canEdit && (
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(cliente.id)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(cliente.id)}
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

export default Clientes;
