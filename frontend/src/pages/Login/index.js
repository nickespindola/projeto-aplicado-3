import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://https://locatech-backend.onrender.com/auth/login', formData);

      // Salvar token e dados do usuário
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

      // Chamar callback de login
      onLogin(response.data.usuario);

      // Redirecionar para dashboard
      navigate('/');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError(err.response?.data?.error || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h1>LocaTech</h1>
          <p>Sistema de Gestão de Locação</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="alert alert-danger" role="alert">
              <strong>❌</strong> {error}
            </div>
          )}

          <div className="form-group mb-3">
            <label htmlFor="email" className="form-label">
              E-mail
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group mb-4">
            <label htmlFor="senha" className="form-label">
              Senha
            </label>
            <div className="password-wrapper">
              <input
                type={showSenha ? 'text' : 'password'}
                className="form-control"
                id="senha"
                name="senha"
                placeholder="Digite sua senha"
                value={formData.senha}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowSenha(v => !v)}
                aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showSenha ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                    <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="test-credentials">
            <p className="text-muted mb-2"><strong>👤 Credenciais de Teste:</strong></p>
            <div className="credentials-list">
              <div className="credential-item">
                <strong>Admin:</strong> admin@locatech.com
              </div>
              <div className="credential-item">
                <strong>Editor:</strong> editor@locatech.com
              </div>
              <div className="credential-item">
                <strong>Viewer:</strong> viewer@locatech.com
              </div>
              <div className="credential-item mt-2">
                <strong>Senha para todos:</strong> admin123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
