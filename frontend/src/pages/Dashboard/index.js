import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const IconUsers = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconMonitor = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const IconFile = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalEquipamentos: 0,
    totalContratos: 0,
    contratosAtivos: 0,
    contratosProximosVencimento: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentContratos, setRecentContratos] = useState([]);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);

      const [clientesRes, equipamentosRes, contratosRes] = await Promise.all([
        axios.get('http://localhost:8081/clientes'),
        axios.get('http://localhost:8081/equipamento'),
        axios.get('http://localhost:8081/contrato')
      ]);

      const contratos = contratosRes.data;
      const hoje = new Date();
      const proximoMes = new Date();
      proximoMes.setDate(proximoMes.getDate() + 30);

      const contratosAtivos = contratos.filter(c =>
        c.status === 'ativo' || c.status === 'Ativo'
      ).length;

      const proximosVencimento = contratos.filter(c => {
        if (!c.data_fim) return false;
        const dataFim = new Date(c.data_fim);
        return dataFim >= hoje && dataFim <= proximoMes && (c.status === 'ativo' || c.status === 'Ativo');
      }).length;

      setStats({
        totalClientes: clientesRes.data.length,
        totalEquipamentos: equipamentosRes.data.length,
        totalContratos: contratos.length,
        contratosAtivos,
        contratosProximosVencimento: proximosVencimento
      });

      setRecentContratos(contratos.sort((a, b) => b.id - a.id).slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>Dashboard</h2>
          <p className="text-muted mb-0">Visão geral do sistema de gestão</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #667eea' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <IconUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalClientes}</h3>
            <p>Total de Clientes</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #11998e' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <IconMonitor />
          </div>
          <div className="stat-content">
            <h3>{stats.totalEquipamentos}</h3>
            <p>Equipamentos</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f093fb' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <IconFile />
          </div>
          <div className="stat-content">
            <h3>{stats.totalContratos}</h3>
            <p>Total de Contratos</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #4facfe' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <IconCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.contratosAtivos}</h3>
            <p>Contratos Ativos</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #fa709a' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <IconAlertTriangle />
          </div>
          <div className="stat-content">
            <h3>{stats.contratosProximosVencimento}</h3>
            <p>Vencem em 30 dias</p>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Ações Rápidas</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-3">
                <Link to="/clientes" className="btn btn-primary">Novo Cliente</Link>
                <Link to="/equipamentos" className="btn btn-success">Novo Equipamento</Link>
                <Link to="/contratos" className="btn" style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  Novo Contrato
                </Link>
                <Link to="/contratos" className="btn btn-outline-primary">Ver Todos os Contratos</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Contratos Recentes</h5>
            </div>
            <div className="card-body">
              {recentContratos.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Equipamento</th>
                        <th>Início</th>
                        <th>Fim</th>
                        <th>Valor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentContratos.map((contrato) => (
                        <tr key={contrato.id}>
                          <td><strong>#{contrato.id}</strong></td>
                          <td>{contrato.cliente || 'N/A'}</td>
                          <td>{contrato.equipamento || 'N/A'}</td>
                          <td>
                            {contrato.data_inicio
                              ? new Date(contrato.data_inicio).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </td>
                          <td>
                            {contrato.data_fim
                              ? new Date(contrato.data_fim).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </td>
                          <td>
                            <strong style={{ color: '#11998e' }}>
                              R$ {parseFloat(contrato.valor_mensal || 0).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span className={`badge ${contrato.status === 'ativo' || contrato.status === 'Ativo' ? 'bg-success' : 'bg-secondary'}`}>
                              {contrato.status || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center mb-0">Nenhum contrato cadastrado ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {stats.contratosProximosVencimento > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="alert alert-warning" role="alert">
              <strong>Atenção!</strong> Você tem {stats.contratosProximosVencimento} contrato(s) vencendo nos próximos 30 dias.{' '}
              <Link to="/contratos" className="alert-link">Ver contratos</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
