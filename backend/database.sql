-- Active: 1782072643564@@mysql-pa3-projetoaplicadotres.a.aivencloud.com@20400@LocaTech
-- Criação do banco de dados LocaTech
CREATE DATABASE IF NOT EXISTS LocaTech;
USE LocaTech;

-- Tabela de Usuários (Sistema de Login)
CREATE TABLE IF NOT EXISTS USUARIO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO USUARIO (nome, email, senha, role) VALUES 
('Administrador', 'admin@locatech.com', '$2b$10$XOPjKvj3hZJKj5KZxZQZHeYQGq5L5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'admin'),
('Editor Teste', 'editor@locatech.com', '$2b$10$XOPjKvj3hZJKj5KZxZQZHeYQGq5L5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'editor'),
('Visualizador', 'viewer@locatech.com', '$2b$10$XOPjKvj3hZJKj5KZxZQZHeYQGq5L5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'viewer');

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS CLIENTE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    e_mail VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    tipo_cliente ENUM('PF', 'PJ') NOT NULL,
    cpf VARCHAR(14),
    cnpj VARCHAR(18),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS EQUIPAMENTO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Contratos
CREATE TABLE IF NOT EXISTS CONTRATO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    valor_mensal DECIMAL(10, 2) NOT NULL,
    status ENUM('ativo', 'finalizado', 'cancelado') DEFAULT 'ativo',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(id) ON DELETE CASCADE,
    FOREIGN KEY (equipamento_id) REFERENCES EQUIPAMENTO(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_cliente_nome ON CLIENTE(nome);
CREATE INDEX idx_cliente_tipo ON CLIENTE(tipo_cliente);
CREATE INDEX idx_equipamento_tipo ON EQUIPAMENTO(tipo);
CREATE INDEX idx_contrato_status ON CONTRATO(status);
CREATE INDEX idx_contrato_datas ON CONTRATO(data_inicio, data_fim);
