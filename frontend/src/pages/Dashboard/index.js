import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';

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

const COLORS_STATUS = ['#27ae60', '#95a5a6'];
const COLORS_CLIENTE = ['#3498db', '#e67e22'];
const COLORS_EQUIP = ['#667eea', '#11998e', '#f5576c', '#fee140', '#4facfe', '#fa709a', '#a18cd1', '#764ba2'];

const EmptyChart = ({ msg }) => (
  <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: 200 }}>
    <span>{msg || 'Sem dados suficientes'}</span>
  </div>
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
  const [chartData, setChartData] = useState({
    statusData: [],
    clientesTipoData: [],
    tipoEquipData: [],
    receitaData: []
  });

  useEffect(() => { carregarDashboard(); }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const [clientesRes, equipamentosRes, contratosRes] = await Promise.all([
        axios.get('http://localhost:8081/clientes'),
        axios.get('http://localhost:8081/equipamento'),
        axios.get('http://localhost:8081/contrato')
      ]);

      const contratos = contratosRes.data;
      const clientes = clientesRes.data;
      const equipamentos = equipamentosRes.data;
      const hoje = new Date();
      const proximoMes = new Date();
      proximoMes.setDate(proximoMes.getDate() + 30);

      const contratosAtivos = contratos.filter(c =>
        (c.status || '').toLowerCase() === 'ativo'
      ).length;

      const proximosVencimento = contratos.filter(c => {
        if (!c.data_fim) return false;
        const dataFim = new Date(c.data_fim);
        return dataFim >= hoje && dataFim <= proximoMes && (c.status || '').toLowerCase() === 'ativo';
      }).length;

      setStats({
        totalClientes: clientes.length,
        totalEquipamentos: equipamentos.length,
        totalContratos: contratos.length,
        contratosAtivos,
        contratosProximosVencimento: proximosVencimento
      });

      setRecentContratos(contratos.sort((a, b) => b.id - a.id).slice(0, 5));

      // --- Chart data ---

      // 1. Contratos por status
      const statusData = [
        { name: 'Ativos', value: contratosAtivos },
        { name: 'Inativos', value: contratos.length - contratosAtivos }
      ].filter(d => d.value > 0);

      // 2. Clientes PF/PJ
      const pfCount = clientes.filter(c => c.tipo_cliente === 'PF').length;
      const pjCount = clientes.filter(c => c.tipo_cliente === 'PJ').length;
      const clientesTipoData = [
        { name: 'Pessoa Física', value: pfCount },
        { name: 'Pessoa Jurídica', value: pjCount }
      ].filter(d => d.value > 0);

      // 3. Equipamentos por tipo
      const tipoCount = {};
      equipamentos.forEach(e => { tipoCount[e.tipo] = (tipoCount[e.tipo] || 0) + 1; });
      const tipoEquipData = Object.entries(tipoCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // 4. Receita mensal (últimos 12 meses)
      const revenueByMonth = {};
      contratos.forEach(c => {
        if (!c.data_inicio || !c.valor_mensal) return;
        const month = c.data_inicio.substring(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(c.valor_mensal);
      });
      const receitaData = Object.entries(revenueByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, value]) => ({
          name: new Date(month + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          receita: Math.round(value * 100) / 100
        }));

      setChartData({ statusData, clientesTipoData, tipoEquipData, receitaData });
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
          <h2 className="mb-1" style={{ fontWeight: '700' }}>Dashboard</h2>
          <p className="text-muted mb-0">Visão geral do sistema de gestão</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '3px solid #4f46e5' }}>
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <IconUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalClientes}</h3>
            <p>Total de Clientes</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #059669' }}>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <IconMonitor />
          </div>
          <div className="stat-content">
            <h3>{stats.totalEquipamentos}</h3>
            <p>Equipamentos</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #7c3aed' }}>
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <IconFile />
          </div>
          <div className="stat-content">
            <h3>{stats.totalContratos}</h3>
            <p>Total de Contratos</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #0284c7' }}>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <IconCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.contratosAtivos}</h3>
            <p>Contratos Ativos</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #d97706' }}>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <IconAlertTriangle />
          </div>
          <div className="stat-content">
            <h3>{stats.contratosProximosVencimento}</h3>
            <p>Vencem em 30 dias</p>
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="row mb-4">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Contratos por Status</h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {chartData.statusData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={95}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.statusData.map((_, i) => (
                        <Cell key={i} fill={COLORS_STATUS[i % COLORS_STATUS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Clientes por Tipo</h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {chartData.clientesTipoData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData.clientesTipoData}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={95}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.clientesTipoData.map((_, i) => (
                        <Cell key={i} fill={COLORS_CLIENTE[i % COLORS_CLIENTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="row mb-4">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Equipamentos por Tipo</h5>
            </div>
            <div className="card-body">
              {chartData.tipoEquipData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData.tipoEquipData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                    <Tooltip />
                    <Bar dataKey="value" name="Quantidade" radius={[4, 4, 0, 0]}>
                      {chartData.tipoEquipData.map((_, i) => (
                        <Cell key={i} fill={COLORS_EQUIP[i % COLORS_EQUIP.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Receita Mensal (R$)</h5>
            </div>
            <div className="card-body">
              {chartData.receitaData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData.receitaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      tick={{ fontSize: 11 }}
                      width={50}
                    />
                    <Tooltip formatter={v => [`R$ ${v.toFixed(2)}`, 'Receita']} />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fill="url(#gradReceita)"
                      dot={{ r: 4, fill: '#4f46e5' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
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
                <Link to="/contratos" className="btn" style={{ background: '#7c3aed', color: 'white' }}>
                  Novo Contrato
                </Link>
                <Link to="/contratos" className="btn btn-outline-primary">Ver Todos os Contratos</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent contracts */}
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
                          <td>{contrato.data_inicio ? new Date(contrato.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}</td>
                          <td>{contrato.data_fim ? new Date(contrato.data_fim).toLocaleDateString('pt-BR') : 'N/A'}</td>
                          <td>
                            <strong style={{ color: '#11998e' }}>
                              R$ {parseFloat(contrato.valor_mensal || 0).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span className={`badge ${(contrato.status || '').toLowerCase() === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
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
