-- Esquema para LOTEMASTER (Venta de Lotes y Terrenos)
-- Copiar y pegar en el SQL Editor de Supabase

-- 1. Tabla de Lotes/Inmuebles
CREATE TABLE inmuebles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL, -- Ej: Lote 45, Manzana B
  proyecto TEXT,         -- Ej: Residencial Los Arcos
  precio_lista DECIMAL(12,2) NOT NULL,
  superficie DECIMAL(10,2), -- en m2
  estado TEXT DEFAULT 'disponible', -- disponible, apartado, vendido, bloqueado
  detalles JSONB,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Ventas
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id UUID REFERENCES auth.users(id),
  inmueble_id UUID REFERENCES inmuebles(id),
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  precio_final DECIMAL(12,2) NOT NULL,
  enganche_pagado DECIMAL(12,2) DEFAULT 0,
  mensualidades_total INTEGER,
  estado_pipeline TEXT DEFAULT 'prospecto', -- prospecto, interesado, apartado, firmado
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Comisiones
CREATE TABLE comisiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES auth.users(id),
  monto DECIMAL(12,2) NOT NULL,
  porcentaje DECIMAL(5,2),
  estado TEXT DEFAULT 'pendiente', -- pendiente, aprobada, pagada
  fecha_pago_estimada DATE,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE inmuebles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Publico puede ver inmuebles" ON inmuebles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vendedores ven sus ventas" ON ventas FOR ALL USING (auth.uid() = vendedor_id);
CREATE POLICY "Vendedores ven sus comisiones" ON comisiones FOR SELECT USING (auth.uid() = vendedor_id);
