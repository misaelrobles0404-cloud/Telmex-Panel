-- Esquema para RESILINK (Gestión de Residenciales)
-- Copiar y pegar en el SQL Editor de Supabase

-- 1. Tabla de Casas / Viviendas
CREATE TABLE viviendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_casa TEXT NOT NULL, -- Ej: 142-A
  calle TEXT,
  propietario_nombre TEXT,
  propietario_celular TEXT,
  saldo_actual DECIMAL(12,2) DEFAULT 0,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Pagos de Cuotas
CREATE TABLE cuotas_pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vivienda_id UUID REFERENCES viviendas(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL,
  concepto TEXT, -- Ene 2026, Multa, etc.
  comprobante_url TEXT, -- Foto del ticket
  estado TEXT DEFAULT 'pendiente', -- pendiente, validado, rechazado
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Avisos y Notificaciones
CREATE TABLE avisos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  contenido TEXT,
  tipo TEXT DEFAULT 'general', -- general, urgente, mantenimiento
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE viviendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Dueños ven sus casas" ON viviendas FOR SELECT USING (true);
CREATE POLICY "Admins gestionan avisos" ON avisos FOR ALL USING (auth.role() = 'authenticated');
