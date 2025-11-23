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

// Configurar interceptor do axios para incluir token
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

function Sidebar({ usuario }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.toLowerCase() === path.toLowerCase();
  };

  return (
    <div className="sidebar">
      <ul className="sidebar-nav">
        <li className="sidebar-nav-item">
          <Link
            to="/"
            className={`sidebar-nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">🏠</span>
            <span>Dashboard</span>
          </Link>
        </li>
        <li className="sidebar-nav-item">
          <Link
            to="/clientes"
            className={`sidebar-nav-link ${isActive('/clientes') ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">👥</span>
            <span>Clientes</span>
          </Link>
        </li>
        <li className="sidebar-nav-item">
          <Link
            to="/equipamentos"
            className={`sidebar-nav-link ${isActive('/equipamentos') ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">💻</span>
            <span>Equipamentos</span>
          </Link>
        </li>
        <li className="sidebar-nav-item">
          <Link
            to="/contratos"
            className={`sidebar-nav-link ${isActive('/contratos') ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">📝</span>
            <span>Contratos</span>
          </Link>
        </li>
        {usuario && usuario.role === 'admin' && (
          <li className="sidebar-nav-item">
            <Link
              to="/usuarios"
              className={`sidebar-nav-link ${isActive('/usuarios') ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">🔐</span>
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
      admin: { text: 'Admin', color: '#e74c3c', icon: '👑' },
      editor: { text: 'Editor', color: '#3498db', icon: '✏️' },
      viewer: { text: 'Viewer', color: '#95a5a6', icon: '👁️' }
    };
    return badges[role] || badges.viewer;
  };

  const badge = getRoleBadge(usuario.role);

  return (
    <>
      <nav className="main-navbar">
        <Link to="/" className="navbar-brand">
          <span className="navbar-icon">🖥️</span>
          <span>LocaTech</span>
        </Link>
        <div className="navbar-actions">
          <div className="user-info">
            <span>{badge.icon}</span>
            <span style={{ marginRight: '10px' }}>{usuario.nome}</span>
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
              🚪 Sair
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
    // Verificar se há token salvo
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
