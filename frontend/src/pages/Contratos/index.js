import { useState, useEffect } from 'react';
import axios from 'axios';
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

const Contratos = ({ usuario }) => {
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: '', equipamento_id: '', data_inicio: '', data_fim: '', valor_mensal: ''
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDataDe, setFilterDataDe] = useState('');
  const [filterDataAte, setFilterDataAte] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canEdit = usuario && (usuario.role === 'admin' || usuario.role === 'editor');
  const canDelete = usuario && usuario.role === 'admin';

  useEffect(() => {
    fetchContratos();
    fetchClientes();
    fetchEquipamentos();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterDataDe, filterDataAte]);

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
    setFormData({ cliente_id: '', equipamento_id: '', data_inicio: '', data_fim: '', valor_mensal: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterDataDe('');
    setFilterDataAte('');
  };
  const hasFilters = searchTerm || filterStatus || filterDataDe || filterDataAte;

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

    const matchSearch = !searchTerm ||
      clienteNome.includes(search) ||
      equipDesc.includes(search) ||
      contrato.id.toString().includes(search);

    const matchStatus = !filterStatus ||
      (contrato.status || '').toLowerCase() === filterStatus.toLowerCase();

    const dataInicio = contrato.data_inicio ? new Date(contrato.data_inicio) : null;
    const matchDe = !filterDataDe || (dataInicio && dataInicio >= new Date(filterDataDe));
    const matchAte = !filterDataAte || (dataInicio && dataInicio <= new Date(filterDataAte));

    return matchSearch && matchStatus && matchDe && matchAte;
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
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
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
                    <select name="equipamento_id" className="form-select" value={formData.equipamento_id} onChange={handleInputChange} required>
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
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-success">{editingId ? 'Salvar Alterações' : 'Cadastrar Contrato'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
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
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
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
            {hasFilters && (
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger ms-auto"
              onClick={exportPDF}
              disabled={filteredContratos.length === 0}
              title="Exportar lista atual como PDF"
            >
              Exportar PDF
            </button>
          </div>
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
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
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
                          <span className={`badge ${contrato.status === 'ativo' || contrato.status === 'Ativo' ? 'bg-success' : 'bg-secondary'}`}>
                            {contrato.status || '-'}
                          </span>
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
