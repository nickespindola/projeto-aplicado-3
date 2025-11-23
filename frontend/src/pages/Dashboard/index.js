import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

      // Carregar todas as estatísticas
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
        contratosAtivos: contratosAtivos,
        contratosProximosVencimento: proximosVencimento
      });

      // Pegar os 5 contratos mais recentes
      const recentes = contratos
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);
      setRecentContratos(recentes);

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

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #667eea' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            👥
          </div>
          <div className="stat-content">
            <h3>{stats.totalClientes}</h3>
            <p>Total de Clientes</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #11998e' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            💻
          </div>
          <div className="stat-content">
            <h3>{stats.totalEquipamentos}</h3>
            <p>Equipamentos</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f093fb' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            📋
          </div>
          <div className="stat-content">
            <h3>{stats.totalContratos}</h3>
            <p>Total Contratos</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #4facfe' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            ✅
          </div>
          <div className="stat-content">
            <h3>{stats.contratosAtivos}</h3>
            <p>Contratos Ativos</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #fa709a' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            ⚠️
          </div>
          <div className="stat-content">
            <h3>{stats.contratosProximosVencimento}</h3>
            <p>Vencem em 30 dias</p>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">⚡ Ações Rápidas</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-3">
                <Link to="/clientes" className="btn btn-primary">
                  <span>👤</span> Novo Cliente
                </Link>
                <Link to="/equipamentos" className="btn btn-success">
                  <span>💻</span> Novo Equipamento
                </Link>
                <Link to="/contratos" className="btn" style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  <span>📝</span> Novo Contrato
                </Link>
                <Link to="/contratos" className="btn btn-outline-primary">
                  <span>📊</span> Ver Todos os Contratos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contratos Recentes */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">📋 Contratos Recentes</h5>
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
                            <span className={`badge ${contrato.status === 'ativo' || contrato.status === 'Ativo'
                              ? 'bg-success'
                              : 'bg-secondary'
                              }`}>
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

      {/* Alertas */}
      {stats.contratosProximosVencimento > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="alert alert-warning d-flex align-items-center" role="alert">
              <span style={{ fontSize: '2rem', marginRight: '1rem' }}>⚠️</span>
              <div>
                <strong>Atenção!</strong> Você tem {stats.contratosProximosVencimento} contrato(s)
                vencendo nos próximos 30 dias.
                <Link to="/contratos" className="alert-link ms-2">Ver contratos</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
