-- Añadir la columna de tipo_identificacion con valor por defecto 'ine' para compatibilidad con links viejos
ALTER TABLE solicitudes_documentos
ADD COLUMN IF NOT EXISTS tipo_identificacion TEXT NOT NULL DEFAULT 'ine';

-- Asegurar que solo pueda ser 'ine' o 'curp'
ALTER TABLE solicitudes_documentos
ADD CONSTRAINT val_tipo_identificacion CHECK (tipo_identificacion IN ('ine', 'curp'));

-- Añadir la columna de CURP (puede ser NULL si eligieron INE)
ALTER TABLE solicitudes_documentos
ADD COLUMN IF NOT EXISTS curp TEXT;
