-- Add mz and lt columns to clientes table
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS mz text,
ADD COLUMN IF NOT EXISTS lt text;
