import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard/';
import Clientes from './pages/Clientes/';
import Equipamentos from './pages/Equipamentos/';
import Contratos from './pages/Contratos/';
import Usuarios from './pages/Usuarios/';
import Login from './pages/Login/';

axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconMonitor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconChevronsLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="11 17 6 12 11 7"/>
    <polyline points="18 17 13 12 18 7"/>
  </svg>
);

const IconChevronsRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 17 18 12 13 7"/>
    <polyline points="6 17 11 12 6 7"/>
  </svg>
);

function Sidebar({ usuario, isOpen, isCollapsed, onCollapse, onMobileClose }) {
  const location = useLocation();
  const isActive = (path) => location.pathname.toLowerCase() === path.toLowerCase();
  const handleLinkClick = () => { if (onMobileClose) onMobileClose(); };

  const navItems = [
    { to: '/', icon: <IconHome />, label: 'Dashboard' },
    { to: '/clientes', icon: <IconUsers />, label: 'Clientes' },
    { to: '/equipamentos', icon: <IconMonitor />, label: 'Equipamentos' },
    { to: '/contratos', icon: <IconFile />, label: 'Contratos' },
  ];

  if (usuario && usuario.role === 'admin') {
    navItems.push({ to: '/usuarios', icon: <IconShield />, label: 'Usuários' });
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}${isCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          className="sidebar-collapse-btn"
          onClick={onCollapse}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? <IconChevronsRight /> : <IconChevronsLeft />}
        </button>
      </div>

      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li key={item.to} className="sidebar-nav-item">
            <Link
              to={item.to}
              className={`sidebar-nav-link${isActive(item.to) ? ' active' : ''}`}
              onClick={handleLinkClick}
              title={isCollapsed ? item.label : ''}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-text">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function AppContent({ usuario, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Admin', color: '#e74c3c' },
      editor: { text: 'Editor', color: '#3498db' },
      viewer: { text: 'Viewer', color: '#95a5a6' }
    };
    return badges[role] || badges.viewer;
  };

  const badge = getRoleBadge(usuario.role);

  return (
    <>
      <nav className="main-navbar">
        <div className="d-flex align-items-center gap-2">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Abrir menu de navegação"
          >
            <IconMenu />
          </button>
          <Link to="/" className="navbar-brand">LocaTech</Link>
        </div>
        <div className="navbar-actions">
          <div className="user-info">
            <span className="user-name">{usuario.nome}</span>
            <span
              className="badge"
              style={{
                backgroundColor: badge.color,
                padding: '5px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem'
              }}
            >
              {badge.text}
            </span>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={onLogout}
              style={{ borderRadius: '20px' }}
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="app-layout">
        <Sidebar
          usuario={usuario}
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(prev => !prev)}
          onMobileClose={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          <Routes>
            <Route path='/' element={<Dashboard usuario={usuario} />} />
            <Route path='/clientes' element={<Clientes usuario={usuario} />} />
            <Route path='/equipamentos' element={<Equipamentos usuario={usuario} />} />
            <Route path='/contratos' element={<Contratos usuario={usuario} />} />
            <Route path='/usuarios' element={<Usuarios usuario={usuario} />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('usuario');
    if (token && usuarioSalvo) setUsuario(JSON.parse(usuarioSalvo));
    setLoading(false);
  }, []);

  const handleLogin = (dadosUsuario) => setUsuario(dadosUsuario);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <BrowserRouter>
        {!usuario ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <AppContent usuario={usuario} onLogout={handleLogout} />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
