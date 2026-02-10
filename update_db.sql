-- Agrega la columna para asignar el usuario del portal (ej. '328707')
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS usuario_portal_asignado text;

-- Agrega la columna para registrar la fecha exacta de instalación (para corte de comisiones)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS fecha_instalacion timestamptz;
