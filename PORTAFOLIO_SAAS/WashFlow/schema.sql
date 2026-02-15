-- Esquema para WASHFLOW (Gestión de Turnos para Car Wash)
-- Copiar y pegar en el SQL Editor de Supabase

-- 1. Tabla de Catálogo de Servicios
CREATE TABLE catalogo_servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL, -- Sencillo, Premium, Detallado
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  tiempo_estimado_min INTEGER DEFAULT 30,
  color_tag TEXT -- Ej: #3b82f6
);

-- 2. Tabla de Cola de Espera / Turnos
CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placas TEXT NOT NULL,
  modelo_vehiculo TEXT,
  nombre_cliente TEXT,
  servicio_id UUID REFERENCES catalogo_servicios(id),
  estado TEXT DEFAULT 'en_espera', -- en_espera, en_lavado, secado, listo, entregado
  fecha_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hora_estimada_entrega TIMESTAMP WITH TIME ZONE,
  pago_confirmado BOOLEAN DEFAULT false,
  lavador_asignado TEXT
);

-- Habilitar RLS
ALTER TABLE catalogo_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Publico ve tabla de precios" ON catalogo_servicios FOR SELECT USING (true);
CREATE POLICY "Dueño gestiona turnos" ON turnos FOR ALL USING (auth.role() = 'authenticated');
