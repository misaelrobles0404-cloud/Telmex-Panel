-- Eliminar la restricción anterior que no incluía los nuevos estados
ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS clientes_estado_pipeline_check;

-- Crear la nueva restricción con TODOS los estados posibles (incluyendo los nuevos y los legacy)
ALTER TABLE clientes 
ADD CONSTRAINT clientes_estado_pipeline_check 
CHECK (estado_pipeline IN (
    'contactado', 
    'interesado', 
    'cierre_programado', 
    'vendido', 
    'sin_cobertura', 
    'cobertura_cobre',
    'perdido',      -- Legacy (por si acaso quedan registros)
    'cotizacion'    -- Legacy
));
