import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Login from './index';

jest.mock('axios');

describe('Login', () => {
  const renderLogin = (onLogin = jest.fn()) => (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Login onLogin={onLogin} />
    </MemoryRouter>
  );

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('renderiza os campos de login', () => {
    render(renderLogin());

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  test('faz login com sucesso e salva token e usuário', async () => {
    const onLogin = jest.fn();

    axios.post.mockResolvedValueOnce({
      data: {
        token: 'token-de-teste',
        usuario: {
          id: 1,
          nome: 'Admin',
          email: 'admin@locatech.com',
          role: 'admin',
        },
      },
    });

    render(renderLogin(onLogin));

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'admin@locatech.com' },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'admin123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem('token')).toBe('token-de-teste');
    expect(JSON.parse(localStorage.getItem('usuario'))).toMatchObject({
      nome: 'Admin',
      email: 'admin@locatech.com',
      role: 'admin',
    });
    expect(axios.post).toHaveBeenCalledWith(
      'https://locatech-backend.onrender.com/auth/login',
      expect.objectContaining({
        email: 'admin@locatech.com',
        senha: 'admin123',
      })
    );
  });

  test('mostra mensagem de erro quando o login falha', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Email ou senha incorretos',
        },
      },
    });

    render(renderLogin());

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'admin@locatech.com' },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'errada' },
    });

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha incorretos');
  });
});
