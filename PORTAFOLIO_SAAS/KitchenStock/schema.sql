-- Esquema para KITCHENSTOCK (Inventario para Restaurantes/Dark Kitchens)
-- Copiar y pegar en el SQL Editor de Supabase

-- 1. Tabla de Insumos (Materias Primas)
CREATE TABLE insumos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL, -- gr, kg, pza, lts
  stock_actual DECIMAL(12,2) DEFAULT 0,
  stock_minimo DECIMAL(12,2) DEFAULT 0, -- Alerta de recompras
  precio_unitario DECIMAL(12,2) DEFAULT 0,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Platillos / Menú
CREATE TABLE platillos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  precio_venta DECIMAL(10,2) NOT NULL,
  categoria TEXT, -- Burgers, Drinks, Desserts
  disponible BOOLEAN DEFAULT true,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Recetas (Articulación platillo - insumo)
CREATE TABLE recetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platillo_id UUID REFERENCES platillos(id) ON DELETE CASCADE,
  insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE,
  cantidad_usada DECIMAL(12,2) NOT NULL, -- Cantidad que se descuenta por cada venta
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Pedidos / Ventas
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total DECIMAL(12,2) NOT NULL,
  metodo_pago TEXT, -- efectivo, tarjeta, app
  estado TEXT DEFAULT 'completado',
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Detalle de Pedido (Para saber qué platillos se vendieron y descontar)
CREATE TABLE pedido_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  platillo_id UUID REFERENCES platillos(id),
  cantidad INTEGER NOT NULL
);

-- Habilitar RLS
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE platillos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Solo dueños)
CREATE POLICY "Dueño gestiona insumos" ON insumos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Dueño gestiona menu" ON platillos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Dueño gestiona ventas" ON pedidos FOR ALL USING (auth.role() = 'authenticated');
