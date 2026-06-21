import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

const EquipamentoSelector = ({ value, onChange, equipamentos, emUsoIds }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = equipamentos.find(e => e.id === Number(value));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const disponiveis = equipamentos.filter(e => !emUsoIds.has(e.id));
  const filtered = disponiveis.filter(e =>
    !search ||
    e.tipo.toLowerCase().includes(search.toLowerCase()) ||
    e.marca.toLowerCase().includes(search.toLowerCase()) ||
    e.modelo.toLowerCase().includes(search.toLowerCase()) ||
    e.numero_serie.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (equip) => {
    onChange(equip.id);
    setSearch('');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {selected ? (
        <div
          className="form-control d-flex justify-content-between align-items-center"
          style={{ background: '#f8f9fa', cursor: 'default', minHeight: '38px' }}
        >
          <span>
            <span className="badge bg-secondary me-2">{selected.tipo}</span>
            <strong>{selected.marca} {selected.modelo}</strong>
            <span className="text-muted ms-2" style={{ fontSize: '0.82em' }}>
              S/N: {selected.numero_serie}
            </span>
          </span>
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: '0.65rem' }}
            onClick={() => onChange('')}
            title="Remover seleção"
          />
        </div>
      ) : (
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por tipo, marca, modelo ou nº de série..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
      )}

      {open && !selected && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
          zIndex: 1050, background: 'white', border: '1px solid #dee2e6',
          borderRadius: '0.375rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: '260px', overflowY: 'auto'
        }}>
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-muted" style={{ fontSize: '0.9rem' }}>
              {disponiveis.length === 0
                ? 'Todos os equipamentos já estão em contratos ativos.'
                : 'Nenhum equipamento encontrado com este filtro.'}
            </div>
          ) : (
            filtered.map(equip => (
              <div
                key={equip.id}
                onMouseDown={() => handleSelect(equip)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f3f3' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span className="badge bg-secondary me-2" style={{ minWidth: '74px' }}>{equip.tipo}</span>
                <strong>{equip.marca} {equip.modelo}</strong>
                <span className="text-muted ms-2" style={{ fontSize: '0.82em' }}>
                  S/N: {equip.numero_serie}
                </span>
              </div>
            ))
          )}
          {disponiveis.length > 0 && (
            <div className="px-3 py-1 border-top" style={{ fontSize: '0.75rem', color: '#999' }}>
              {filtered.length} disponível(is) · {equipamentos.length - disponiveis.length} em uso
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Contratos = ({ usuario }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: '', equipamento_id: '', data_inicio: '', data_fim: '', valor_mensal: '', status: ''
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDataDe, setFilterDataDe] = useState('');
  const [filterDataAte, setFilterDataAte] = useState('');
  // Filtro "vence em N dias" vindo do Dashboard via ?vencimento=30
  const [filterVencimento, setFilterVencimento] = useState(() => {
    const v = parseInt(searchParams.get('vencimento'));
    return isNaN(v) ? 0 : v;
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // E-mail de alertas
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  const handleEnviarAlertas = async () => {
    if (!window.confirm('Enviar e-mail de alerta para todos os clientes com contratos ativos vencendo nos próximos 30 dias?')) return;
    setEnviandoEmail(true);
    setEmailResult(null);
    try {
      const res = await axios.post('http://localhost:8081/contratos/notificar-vencimento', { dias: 30 });
      setEmailResult({ ok: true, ...res.data });
    } catch (err) {
      setEmailResult({ ok: false, error: err.response?.data?.error || err.message });
    } finally {
      setEnviandoEmail(false);
    }
  };

  const canEdit = usuario && (usuario.role === 'admin' || usuario.role === 'editor');
  const canDelete = usuario && usuario.role === 'admin';

  useEffect(() => {
    fetchContratos();
    fetchClientes();
    fetchEquipamentos();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterDataDe, filterDataAte, filterVencimento]);

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
    if (!formData.equipamento_id) {
      alert('Selecione um equipamento.');
      return;
    }
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
        valor_mensal: contrato.valor_mensal || '',
        status: contrato.status || 'ativo'
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
    setFormData({ cliente_id: '', equipamento_id: '', data_inicio: '', data_fim: '', valor_mensal: '', status: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterDataDe('');
    setFilterDataAte('');
    setFilterVencimento(0);
    setSearchParams({});
  };
  const hasFilters = searchTerm || filterStatus || filterDataDe || filterDataAte || filterVencimento > 0;

  const getClienteNome = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nome : 'Desconhecido';
  };

  const getEquipamentoDescricao = (id) => {
    const equip = equipamentos.find(e => e.id === id);
    return equip ? `${equip.marca} ${equip.modelo}` : 'Desconhecido';
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pendente':   return { cls: 'bg-warning text-dark', label: 'Pendente' };
      case 'ativo':      return { cls: 'bg-success',           label: 'Ativo' };
      case 'finalizado': return { cls: '', style: { background: '#f97316', color: '#fff' }, label: 'Aguard. devolução' };
      case 'devolvido':  return { cls: 'bg-secondary',         label: 'Concluído' };
      case 'cancelado':  return { cls: 'bg-danger',            label: 'Cancelado' };
      default:           return { cls: 'bg-light text-dark',   label: status || '-' };
    }
  };

  // Bloqueia equipamentos em contratos ativos OU pendentes (reservados para início futuro)
  const emUsoIds = new Set(
    contratos
      .filter(c => ['ativo', 'pendente'].includes((c.status || '').toLowerCase()) && c.id !== editingId)
      .map(c => c.equipamento_id)
  );

  const filteredContratos = contratos.filter(contrato => {
    const clienteNome = getClienteNome(contrato.cliente_id).toLowerCase();
    const equipDesc = getEquipamentoDescricao(contrato.equipamento_id).toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchSearch = !searchTerm ||
      clienteNome.includes(search) ||
      equipDesc.includes(search) ||
      contrato.id.toString().includes(search);

    const matchStatus = !filterStatus ||
      (contrato.status || '').toLowerCase() === filterStatus.toLowerCase();

    const dataInicio = contrato.data_inicio ? new Date(contrato.data_inicio) : null;
    const matchDe = !filterDataDe || (dataInicio && dataInicio >= new Date(filterDataDe));
    const matchAte = !filterDataAte || (dataInicio && dataInicio <= new Date(filterDataAte));

    let matchVencimento = true;
    if (filterVencimento > 0) {
      if (!contrato.data_fim) return false;
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const limite = new Date(hoje); limite.setDate(hoje.getDate() + filterVencimento);
      const dataFim = new Date(contrato.data_fim);
      matchVencimento = dataFim >= hoje && dataFim <= limite && (contrato.status || '').toLowerCase() === 'ativo';
    }

    return matchSearch && matchStatus && matchDe && matchAte && matchVencimento;
  });

  const totalPages = Math.ceil(filteredContratos.length / itemsPerPage);
  const paginatedContratos = filteredContratos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const geradoEm = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('LocaTech — Relatório de Contratos', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Gerado em: ${geradoEm}`, 14, 26);
    doc.text(`Total: ${filteredContratos.length} contrato(s)`, 14, 32);
    if (hasFilters) {
      doc.text('* Relatório com filtros aplicados', 14, 38);
    }

    autoTable(doc, {
      startY: hasFilters ? 44 : 40,
      head: [['#', 'Cliente', 'Equipamento', 'Início', 'Fim', 'Valor Mensal', 'Status']],
      body: filteredContratos.map(c => [
        `#${c.id}`,
        getClienteNome(c.cliente_id),
        getEquipamentoDescricao(c.equipamento_id),
        formatDate(c.data_inicio),
        formatDate(c.data_fim),
        `R$ ${parseFloat(c.valor_mensal || 0).toFixed(2)}`,
        c.status || '-'
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
        5: { halign: 'right' },
        6: { halign: 'center', cellWidth: 22 }
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    }

    doc.save(`contratos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>Contratos</h2>
          <p className="text-muted mb-0">Gerencie os contratos de locação</p>
        </div>
        {canEdit && (
          <button
            className="btn btn-success"
            onClick={() => { if (showForm && !editingId) setShowForm(false); else { resetForm(); setShowForm(true); } }}
          >
            {showForm && !editingId ? 'Cancelar' : '+ Novo Contrato'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingId ? 'Editar Contrato' : 'Novo Contrato'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Cliente <span className="text-danger">*</span></label>
                    <select name="cliente_id" className="form-select" value={formData.cliente_id} onChange={handleInputChange} required>
                      <option value="">Selecione um cliente</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome} — {cliente.cpf || cliente.cnpj || ''}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Selecione o cliente que irá alugar o equipamento</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Equipamento <span className="text-danger">*</span></label>
                    <EquipamentoSelector
                      value={formData.equipamento_id}
                      onChange={(id) => setFormData(prev => ({ ...prev, equipamento_id: id }))}
                      equipamentos={equipamentos}
                      emUsoIds={emUsoIds}
                    />
                    <small className="text-muted">
                      {emUsoIds.size > 0
                        ? `${equipamentos.length - emUsoIds.size} disponível(is) de ${equipamentos.length}`
                        : 'Todos os equipamentos estão disponíveis'}
                    </small>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Data de Início <span className="text-danger">*</span></label>
                    <input type="date" name="data_inicio" className="form-control" value={formData.data_inicio} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Data de Fim <span className="text-danger">*</span></label>
                    <input type="date" name="data_fim" className="form-control" value={formData.data_fim} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Valor Mensal (R$) <span className="text-danger">*</span></label>
                    <input type="number" name="valor_mensal" className="form-control" placeholder="0.00" step="0.01" min="0"
                      value={formData.valor_mensal} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              {editingId && (
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Status</label>
                      <select name="status" className="form-select" value={formData.status} onChange={handleInputChange}>
                        <option value="pendente">Pendente — aguardando início</option>
                        <option value="ativo">Ativo — em andamento</option>
                        <option value="finalizado">Aguardando devolução — prazo vencido</option>
                        <option value="devolvido">Concluído — equipamento devolvido</option>
                        <option value="cancelado">Cancelado — rescindido</option>
                      </select>
                      <small className="text-muted">A data de vencimento continua ativando a finalização automática.</small>
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-success">{editingId ? 'Salvar Alterações' : 'Cadastrar Contrato'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Contratos
            {hasFilters
              ? ` — ${filteredContratos.length} de ${contratos.length}`
              : ` (${contratos.length})`}
          </h5>
        </div>

        {/* Barra de filtros */}
        <div className="p-3 border-bottom bg-light">
          <div className="d-flex flex-wrap gap-2 align-items-end">
            <div>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Buscar por cliente, equipamento ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: '280px' }}
              />
            </div>
            <div>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="ativo">Ativo</option>
                <option value="finalizado">Aguardando devolução</option>
                <option value="devolvido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="d-flex align-items-center gap-1">
              <label className="text-muted small mb-0" style={{ whiteSpace: 'nowrap' }}>Início de</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filterDataDe}
                onChange={(e) => setFilterDataDe(e.target.value)}
                style={{ width: '150px' }}
              />
            </div>
            <div className="d-flex align-items-center gap-1">
              <label className="text-muted small mb-0" style={{ whiteSpace: 'nowrap' }}>até</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filterDataAte}
                onChange={(e) => setFilterDataAte(e.target.value)}
                style={{ width: '150px' }}
              />
            </div>
            {filterVencimento > 0 && (
              <span
                className="badge d-flex align-items-center gap-1"
                style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', fontWeight: 600, fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              >
                Vence em {filterVencimento} dias
                <button
                  type="button"
                  onClick={() => { setFilterVencimento(0); setSearchParams({}); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', padding: 0, lineHeight: 1, marginLeft: '2px' }}
                  aria-label="Remover filtro"
                >✕</button>
              </span>
            )}
            {hasFilters && (
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleEnviarAlertas}
                disabled={enviandoEmail}
                style={{ borderColor: '#d97706', color: '#d97706' }}
                title="Enviar e-mail de alerta para clientes com contratos vencendo em 30 dias"
              >
                {enviandoEmail ? 'Enviando...' : 'Enviar alertas'}
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={exportPDF}
                disabled={filteredContratos.length === 0}
                title="Exportar lista atual como PDF"
              >
                Exportar PDF
              </button>
            </div>
          </div>
          {emailResult && (
            <div className={`mx-3 mt-2 mb-1 alert py-2 mb-0 ${emailResult.ok ? 'alert-success' : 'alert-danger'}`}>
              {emailResult.ok ? (
                emailResult.enviados === 0
                  ? emailResult.message
                  : <><strong>{emailResult.enviados}</strong> e-mail(s) enviado(s) com sucesso{emailResult.erros?.length > 0 && <span className="text-danger ms-2">· {emailResult.erros.length} falha(s)</span>}</>
              ) : (
                <><strong>Erro:</strong> {emailResult.error}</>
              )}
            </div>
          )}
        </div>

        <div className="card-body p-0">
          {filteredContratos.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {hasFilters ? 'Nenhum contrato encontrado com os filtros aplicados.' : 'Nenhum contrato cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Equipamento</th>
                      <th>Data Início</th>
                      <th>Data Fim</th>
                      <th>Valor Mensal</th>
                      <th>Status</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedContratos.map((contrato) => (
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
                        <td>
                          {(() => { const b = getStatusBadge(contrato.status); return <span className={`badge ${b.cls}`} style={b.style || {}}>{b.label}</span>; })()}
                        </td>
                        <td className="text-center">
                          {canEdit && (
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(contrato.id)} title="Editar">
                              <IconEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(contrato.id)} title="Excluir">
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
                totalItems={filteredContratos.length}
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

export default Contratos;
