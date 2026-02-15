-- Esquema para GYMPULSE (Gestión de Membrecías y Accesos)
-- Copiar y pegar en el SQL Editor de Supabase

-- 1. Tabla de Planes de Membrecía
CREATE TABLE planes_gym (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL, -- Mensual, Trimestral, Anual, Visita
  precio DECIMAL(10,2) NOT NULL,
  duracion_dias INTEGER NOT NULL,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Usuarios / Miembros
CREATE TABLE miembros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  foto_url TEXT,
  fecha_inscripcion DATE DEFAULT CURRENT_DATE,
  plan_id UUID REFERENCES planes_gym(id),
  vencimiento DATE NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Historial de Pagos
CREATE TABLE pagos_gym (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  miembro_id UUID REFERENCES miembros(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES planes_gym(id),
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT,
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Registro de Asistencias (Check-in)
CREATE TABLE asistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  miembro_id UUID REFERENCES miembros(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE planes_gym ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_gym ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Dueño ve miembros" ON miembros FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Dueño gestiona planes" ON planes_gym FOR ALL USING (auth.role() = 'authenticated');
