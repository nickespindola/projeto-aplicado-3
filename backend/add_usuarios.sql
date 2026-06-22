-- Adicionar tabela de usuários ao banco existente
USE LocaTech;

-- Criar tabela de usuários se não existir
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

-- Inserir usuários de teste (senha para todos: admin123)
INSERT IGNORE INTO USUARIO (nome, email, senha, role) VALUES
('Administrador', 'admin@locatech.com', '$2b$10$F0PI98xpfgMUlc1lUkDHkOLZpaSy0JPYg0U/L0.xX06zoheUc0Js2', 'admin'),
('Editor Teste', 'editor@locatech.com', '$2b$10$F0PI98xpfgMUlc1lUkDHkOLZpaSy0JPYg0U/L0.xX06zoheUc0Js2', 'editor'),
('Visualizador', 'viewer@locatech.com', '$2b$10$F0PI98xpfgMUlc1lUkDHkOLZpaSy0JPYg0U/L0.xX06zoheUc0Js2', 'viewer');




