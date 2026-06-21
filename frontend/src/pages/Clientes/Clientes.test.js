import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Clientes from './index';
// Configura o mock do axios
const mock = new MockAdapter(axios);


window.scrollTo = jest.fn();
window.alert = jest.fn(); // Mock do alert para não travar o teste

const mockClientes = [
  {
    id: 1,
    nome: 'Empresa Teste LTDA',
    tipo_cliente: 'PJ',
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 98765-4321',
    e_mail: 'contato@teste.com.br',
    endereco: 'Rua das Flores, 123'
  }
];

describe('Testes do Componente Clientes', () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    mock.reset();
  });


  // CT01: Renderização da listagem de dados

  it('CT01: Deve renderizar a listagem de clientes retornados da API', async () => {
    // Simula a resposta de sucesso da API
    mock.onGet('http://localhost:8081/clientes').reply(200, mockClientes);

    // Renderiza o componente com um usuário Admin
    render(<Clientes usuario={{ role: 'admin' }} />);

    // Aguarda até que o texto da API apareça na tela
    await waitFor(() => {
      expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
    });
    
    // Verifica se os outros dados também vieram
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
  });


  // CT02: Submissão de formulário

  it('CT02: Deve permitir preencher o formulário e enviar um novo cadastro (POST)', async () => {
    mock.onGet('http://localhost:8081/clientes').reply(200, []);
    mock.onPost('http://localhost:8081/clientes').reply(201); // Simula criação

    render(<Clientes usuario={{ role: 'admin' }} />);

    // Clica no botão de novo cliente
    const btnNovo = screen.getByText('+ Novo Cliente');
    fireEvent.click(btnNovo);

    // Preenche os campos do formulário
    fireEvent.change(screen.getByPlaceholderText('Digite o nome completo'), { 
      target: { value: 'Tiago João' } 
    });
    
    // Seleciona o tipo para liberar a máscara
    fireEvent.change(screen.getByRole('combobox'), { 
      target: { value: 'Pessoa Física' } 
    });

    fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { 
      target: { value: '11122233344' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('cliente@email.com'), { 
      target: { value: 'tiago@teste.com' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('(00) 00000-0000'), { 
      target: { value: '48999999999' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('Rua, número, bairro, cidade - UF'), { 
      target: { value: 'Centro, Florianópolis' } 
    });

    // Submete o formulário
    const btnSubmit = screen.getByText('✓ Cadastrar Cliente');
    fireEvent.click(btnSubmit);

    // Verifica se a requisição POST foi feita corretamente para a API
    await waitFor(() => {
      expect(mock.history.post.length).toBe(1);
      const dataEnviada = JSON.parse(mock.history.post[0].data);
      expect(dataEnviada.nome).toBe('Tiago João');
      expect(dataEnviada.cpf).toBe('11122233344');
    });
  });


  // CT03: Proteção de interface (Role Viewer)

  it('CT03: Deve ocultar botões de edição/exclusão se o usuário for Viewer', async () => {
    mock.onGet('http://localhost:8081/clientes').reply(200, mockClientes);

    // ATENÇÃO: Passando o role como 'viewer'
    render(<Clientes usuario={{ role: 'viewer' }} />);

    // Aguarda a tabela renderizar
    await waitFor(() => {
      expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
    });

    // Verifica se o botão de "+ Novo Cliente" NÃO está na tela
    expect(screen.queryByText('+ Novo Cliente')).not.toBeInTheDocument();

    // Verifica se os botões de ação na tabela NÃO estão presentes
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Excluir')).not.toBeInTheDocument();

    // Verifica se o texto de fallback aparece
    expect(screen.getByText('Apenas visualização')).toBeInTheDocument();
  });
});