-- Migração: substituir campo único 'endereco' por campos separados de endereço
-- Execute este script no banco LocaTech antes de iniciar o servidor atualizado.

ALTER TABLE CLIENTE
  MODIFY COLUMN endereco VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN cep        VARCHAR(9)   NULL AFTER endereco,
  ADD COLUMN logradouro VARCHAR(255) NULL AFTER cep,
  ADD COLUMN numero     VARCHAR(20)  NULL AFTER logradouro,
  ADD COLUMN complemento VARCHAR(100) NULL AFTER numero,
  ADD COLUMN bairro     VARCHAR(100) NULL AFTER complemento,
  ADD COLUMN cidade     VARCHAR(100) NULL AFTER bairro,
  ADD COLUMN uf         CHAR(2)      NULL AFTER cidade;

-- Preservar dados existentes: move o valor de 'endereco' para 'logradouro'
UPDATE CLIENTE SET logradouro = endereco WHERE endereco IS NOT NULL AND endereco != '';