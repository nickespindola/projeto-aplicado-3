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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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

function Sidebar({ usuario }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.toLowerCase() === path.toLowerCase();
  };

  return (
    <div className="sidebar">
      <ul className="sidebar-nav">
        <li className="sidebar-nav-item">
          <Link to="/" className={`sidebar-nav-link ${isActive('/') ? 'active' : ''}`}>
            <span className="sidebar-nav-icon"><IconHome /></span>
            <span>Dashboard</span>
          </Link>
        </li>
        <li className="sidebar-nav-item">
          <Link to="/clientes" className={`sidebar-nav-link ${isActive('/clientes') ? 'active' : ''}`}>
            <span className="sidebar-nav-icon"><IconUsers /></span>
            <span>Clientes</span>
          </Link>
        </li>
        <li className="sidebar-nav-item">
          <Link to="/equipamentos" className={`sidebar-nav-link ${isActive('/equipamentos') ? 'active' : ''}`}>
            <span className="sidebar-nav-icon"><IconMonitor /></span>
            <span>Equipamentos</span>
          </Link>
        </li>
        <li className="sidebar-nav-item">
          <Link to="/contratos" className={`sidebar-nav-link ${isActive('/contratos') ? 'active' : ''}`}>
            <span className="sidebar-nav-icon"><IconFile /></span>
            <span>Contratos</span>
          </Link>
        </li>
        {usuario && usuario.role === 'admin' && (
          <li className="sidebar-nav-item">
            <Link to="/usuarios" className={`sidebar-nav-link ${isActive('/usuarios') ? 'active' : ''}`}>
              <span className="sidebar-nav-icon"><IconShield /></span>
              <span>Usuários</span>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

function AppContent({ usuario, onLogout }) {
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
        <Link to="/" className="navbar-brand">
          LocaTech
        </Link>
        <div className="navbar-actions">
          <div className="user-info">
            <span style={{ marginRight: '8px' }}>{usuario.nome}</span>
            <span
              className="badge"
              style={{
                backgroundColor: badge.color,
                padding: '5px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                marginRight: '15px'
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

      <div className="app-layout">
        <Sidebar usuario={usuario} />
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

    if (token && usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setLoading(false);
  }, []);

  const handleLogin = (dadosUsuario) => {
    setUsuario(dadosUsuario);
  };

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
