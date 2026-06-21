import React, { useState, useEffect } from 'react';
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

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const maskCPF = (value) => {
  const n = (value || '').replace(/\D/g, '');
  if (n.length !== 11) return value || '-';
  return `***.${n.slice(3, 6)}.${n.slice(6, 9)}-**`;
};

const maskCNPJ = (value) => {
  const n = (value || '').replace(/\D/g, '');
  if (n.length !== 14) return value || '-';
  return `**.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-**`;
};

const formatDoc = (cpf, cnpj) => {
  if (cpf) {
    const n = cpf.replace(/\D/g, '');
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
  }
  if (cnpj) {
    const n = cnpj.replace(/\D/g, '');
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12, 14)}`;
  }
  return '-';
};

const formatEndereco = (c) => {
  if (!c.logradouro) return c.endereco || '-';
  const partes = [c.logradouro];
  if (c.numero) partes[0] += `, ${c.numero}`;
  if (c.complemento) partes.push(c.complemento);
  if (c.bairro) partes.push(c.bairro);
  if (c.cidade) partes.push(c.uf ? `${c.cidade}/${c.uf}` : c.cidade);
  if (c.cep) partes.push(`CEP ${c.cep}`);
  return partes.join(' — ');
};

const FORM_VAZIO = {
  nome: '', cpf_cnpj: '', telefone: '', email: '', tipo_cliente: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
};

const Clientes = ({ usuario }) => {
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(FORM_VAZIO);

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [revealedDocs, setRevealedDocs] = useState(new Set());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canEdit = usuario && (usuario.role === 'admin' || usuario.role === 'editor');
  const canDelete = usuario && usuario.role === 'admin';

  useEffect(() => { fetchClientes(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTipo]);

  const fetchClientes = async () => {
    try {
      const response = await axios.get('http://https://locatech-backend.onrender.com/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRevealDoc = (id, e) => {
    e.stopPropagation();
    setRevealedDocs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatTelefone = (value) => {
    const n = value.replace(/\D/g, '');
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
  };

  const formatCPF = (value) => {
    const n = value.replace(/\D/g, '');
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
  };

  const formatCNPJ = (value) => {
    const n = value.replace(/\D/g, '');
    if (n.length <= 2) return n;
    if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
    if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
    if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
    return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12, 14)}`;
  };

  const formatCEP = (value) => {
    const n = value.replace(/\D/g, '');
    if (n.length <= 5) return n;
    return `${n.slice(0, 5)}-${n.slice(5, 8)}`;
  };

  const buscarCEP = async (cepRaw) => {
    const digits = cepRaw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
        return;
      }
      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
      }));
      // Foca no campo número depois do preenchimento automático
      setTimeout(() => document.getElementById('campo-numero')?.focus(), 50);
    } catch {
      setCepError('Erro ao consultar o CEP. Tente novamente.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'telefone') newValue = formatTelefone(value);
    if (name === 'cep') {
      newValue = formatCEP(value);
      setFormData(prev => ({ ...prev, cep: newValue }));
      if (newValue.replace(/\D/g, '').length === 8) buscarCEP(newValue);
      return;
    }
    if (name === 'cpf_cnpj') {
      if (formData.tipo_cliente === 'Pessoa Física') newValue = formatCPF(value);
      else if (formData.tipo_cliente === 'Pessoa Jurídica') newValue = formatCNPJ(value);
      else newValue = value.replace(/\D/g, '');
    }
    if (name === 'tipo_cliente') {
      setFormData(prev => ({ ...prev, [name]: newValue, cpf_cnpj: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tipoParaEnviar = formData.tipo_cliente === 'Pessoa Física' ? 'PF' :
      formData.tipo_cliente === 'Pessoa Jurídica' ? 'PJ' : formData.tipo_cliente;
    const cpfCnpjLimpo = formData.cpf_cnpj.replace(/\D/g, '');
    const dataToSend = {
      nome: formData.nome,
      e_mail: formData.email,
      telefone: formData.telefone,
      tipo_cliente: tipoParaEnviar,
      cpf: tipoParaEnviar === 'PF' ? cpfCnpjLimpo : null,
      cnpj: tipoParaEnviar === 'PJ' ? cpfCnpjLimpo : null,
      cep: formData.cep,
      logradouro: formData.logradouro,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      uf: formData.uf,
    };
    try {
      if (editingId) {
        await axios.put(`http://https://locatech-backend.onrender.com/clientes/${editingId}`, dataToSend);
        alert('Cliente atualizado com sucesso!');
      } else {
        await axios.post('http://https://locatech-backend.onrender.com/clientes', dataToSend);
        alert('Cliente cadastrado com sucesso!');
      }
      resetForm();
      fetchClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`http://https://locatech-backend.onrender.com/clientes/${id}`);
      const c = response.data;
      const tipoExibicao = c.tipo_cliente === 'PF' ? 'Pessoa Física' :
        c.tipo_cliente === 'PJ' ? 'Pessoa Jurídica' : c.tipo_cliente;
      setFormData({
        nome: c.nome || '',
        cpf_cnpj: c.cpf || c.cnpj || '',
        telefone: c.telefone || '',
        email: c.e_mail || '',
        tipo_cliente: tipoExibicao,
        cep: c.cep || '',
        logradouro: c.logradouro || c.endereco || '',
        numero: c.numero || '',
        complemento: c.complemento || '',
        bairro: c.bairro || '',
        cidade: c.cidade || '',
        uf: c.uf || '',
      });
      setEditingId(id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      alert('Erro ao carregar dados do cliente: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await axios.delete(`http://https://locatech-backend.onrender.com/clientes/${id}`);
        alert('Cliente excluído com sucesso!');
        fetchClientes();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData(FORM_VAZIO);
    setCepError('');
    setEditingId(null);
    setShowForm(false);
  };

  const clearFilters = () => { setSearchTerm(''); setFilterTipo(''); };
  const hasFilters = searchTerm || filterTipo;

  const filteredClientes = clientes.filter(cliente => {
    const matchSearch = !searchTerm ||
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.cpf || '').includes(searchTerm) ||
      (cliente.cnpj || '').includes(searchTerm) ||
      (cliente.telefone || '').includes(searchTerm) ||
      (cliente.e_mail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filterTipo || cliente.tipo_cliente === filterTipo;
    return matchSearch && matchTipo;
  });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ fontWeight: '700' }}>Clientes</h2>
          <p className="text-muted mb-0">Gerencie seus clientes</p>
        </div>
        {canEdit && (
          <button
            className="btn btn-success"
            onClick={() => { if (showForm && !editingId) setShowForm(false); else { resetForm(); setShowForm(true); } }}
          >
            {showForm && !editingId ? 'Cancelar' : '+ Novo Cliente'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>

              {/* Dados pessoais */}
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Nome Completo / Razão Social <span className="text-danger">*</span></label>
                    <input type="text" name="nome" className="form-control" placeholder="Digite o nome completo"
                      value={formData.nome} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Tipo de Cliente <span className="text-danger">*</span></label>
                    <select name="tipo_cliente" className="form-select" value={formData.tipo_cliente} onChange={handleInputChange} required>
                      <option value="">Selecione o tipo</option>
                      <option value="Pessoa Física">Pessoa Física (PF)</option>
                      <option value="Pessoa Jurídica">Pessoa Jurídica (PJ)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      {formData.tipo_cliente === 'Pessoa Física' ? 'CPF' : formData.tipo_cliente === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF / CNPJ'}
                      <span className="text-danger"> *</span>
                    </label>
                    <input type="text" name="cpf_cnpj" className="form-control"
                      placeholder={formData.tipo_cliente === 'Pessoa Física' ? '000.000.000-00' : formData.tipo_cliente === 'Pessoa Jurídica' ? '00.000.000/0000-00' : 'Selecione o tipo primeiro'}
                      value={formData.cpf_cnpj} onChange={handleInputChange}
                      maxLength={formData.tipo_cliente === 'Pessoa Física' ? 14 : 18}
                      disabled={!formData.tipo_cliente} required />
                    {!formData.tipo_cliente && <small className="text-warning">Selecione o tipo de cliente primeiro</small>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Telefone <span className="text-danger">*</span></label>
                    <input type="text" name="telefone" className="form-control" placeholder="(00) 00000-0000"
                      value={formData.telefone} onChange={handleInputChange} maxLength={15} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">E-mail <span className="text-danger">*</span></label>
                    <input type="email" name="email" className="form-control" placeholder="cliente@email.com"
                      value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <hr className="my-3" />
              <p className="form-label mb-3" style={{ fontWeight: 700, color: 'var(--text)' }}>Endereço</p>

              <div className="row">
                {/* CEP */}
                <div className="col-md-3">
                  <div className="form-group mb-3">
                    <label className="form-label">CEP <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input
                        type="text"
                        name="cep"
                        className={`form-control ${cepError ? 'is-invalid' : ''}`}
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={handleInputChange}
                        maxLength={9}
                        required
                      />
                      {cepLoading && (
                        <span className="input-group-text">
                          <span className="spinner-border spinner-border-sm" role="status" />
                        </span>
                      )}
                    </div>
                    {cepError && <div className="invalid-feedback d-block">{cepError}</div>}
                    <small className="text-muted">Preenchimento automático ao digitar</small>
                  </div>
                </div>

                {/* Número */}
                <div className="col-md-2">
                  <div className="form-group mb-3">
                    <label className="form-label">Número <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      id="campo-numero"
                      name="numero"
                      className="form-control"
                      placeholder="Ex: 123"
                      value={formData.numero}
                      onChange={handleInputChange}
                      maxLength={20}
                      required
                    />
                  </div>
                </div>

                {/* Complemento */}
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Complemento</label>
                    <input
                      type="text"
                      name="complemento"
                      className="form-control"
                      placeholder="Apto, sala, bloco..."
                      value={formData.complemento}
                      onChange={handleInputChange}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* UF */}
                <div className="col-md-3">
                  <div className="form-group mb-3">
                    <label className="form-label">UF</label>
                    <input
                      type="text"
                      name="uf"
                      className="form-control"
                      placeholder="SP"
                      value={formData.uf}
                      onChange={handleInputChange}
                      maxLength={2}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                {/* Logradouro */}
                <div className="col-md-5">
                  <div className="form-group mb-3">
                    <label className="form-label">Logradouro (Rua / Av.) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="logradouro"
                      className="form-control"
                      placeholder="Preenchido automaticamente pelo CEP"
                      value={formData.logradouro}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Bairro */}
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Bairro</label>
                    <input
                      type="text"
                      name="bairro"
                      className="form-control"
                      placeholder="Preenchido automaticamente"
                      value={formData.bairro}
                      onChange={handleInputChange}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Cidade */}
                <div className="col-md-3">
                  <div className="form-group mb-3">
                    <label className="form-label">Cidade</label>
                    <input
                      type="text"
                      name="cidade"
                      className="form-control"
                      placeholder="Preenchido automaticamente"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-success">{editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Clientes{hasFilters ? ` — ${filteredClientes.length} de ${clientes.length}` : ` (${clientes.length})`}
          </h5>
        </div>

        <div className="p-3 border-bottom bg-light">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail..."
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
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
            {hasFilters && (
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          {filteredClientes.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {hasFilters ? 'Nenhum cliente encontrado com os filtros aplicados.' : 'Nenhum cliente cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>CPF / CNPJ</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.map((cliente) => {
                      const isExpanded = expandedRows.has(cliente.id);
                      const isRevealed = revealedDocs.has(cliente.id);
                      const docMasked = cliente.tipo_cliente === 'PF'
                        ? maskCPF(cliente.cpf)
                        : maskCNPJ(cliente.cnpj);
                      const docFull = formatDoc(cliente.cpf, cliente.cnpj);

                      return (
                        <React.Fragment key={cliente.id}>
                          <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(cliente.id)}>
                            <td className="text-muted" style={{ verticalAlign: 'middle' }}>
                              {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            </td>
                            <td className="text-muted" style={{ verticalAlign: 'middle' }}>#{cliente.id}</td>
                            <td style={{ verticalAlign: 'middle' }}>
                              <strong>{cliente.nome}</strong>
                            </td>
                            <td style={{ verticalAlign: 'middle' }}>
                              <span className={`badge ${cliente.tipo_cliente === 'PF' ? 'bg-info' : 'bg-warning'}`}>
                                {cliente.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                              </span>
                            </td>
                            <td style={{ verticalAlign: 'middle' }}>
                              <span className="font-monospace me-2" style={{ color: '#555' }}>
                                {isRevealed ? docFull : docMasked}
                              </span>
                              <button
                                className="btn btn-link btn-sm p-0 text-muted"
                                onClick={(e) => toggleRevealDoc(cliente.id, e)}
                                title={isRevealed ? 'Ocultar documento' : 'Revelar documento'}
                                style={{ lineHeight: 1 }}
                              >
                                {isRevealed ? <IconEyeOff /> : <IconEye />}
                              </button>
                            </td>
                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                              {canEdit && (
                                <button
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={(e) => { e.stopPropagation(); handleEdit(cliente.id); }}
                                  title="Editar"
                                >
                                  <IconEdit />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(cliente.id); }}
                                  title="Excluir"
                                >
                                  <IconTrash />
                                </button>
                              )}
                              {!canEdit && !canDelete && (
                                <span className="text-muted small">Apenas visualização</span>
                              )}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr style={{ backgroundColor: '#f8f9ff' }}>
                              <td></td>
                              <td colSpan={4} className="py-3">
                                <div className="d-flex flex-wrap gap-4 ps-2" style={{ fontSize: '0.9rem' }}>
                                  <div>
                                    <span className="text-muted d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefone</span>
                                    <span>{cliente.telefone || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</span>
                                    <span>{cliente.e_mail || '-'}</span>
                                  </div>
                                  <div style={{ flex: 1, minWidth: '200px' }}>
                                    <span className="text-muted d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço</span>
                                    <span>{formatEndereco(cliente)}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredClientes.length}
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

export default Clientes;
