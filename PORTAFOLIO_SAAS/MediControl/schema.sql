-- Esquema para MEDICONTROL (Gestión de Consultorios)
-- Copiar y pegar en el SQL Editor de Supabase

-- 1. Tabla de Pacientes
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  fecha_nacimiento DATE,
  antecedentes TEXT,
  ultima_cita TIMESTAMP WITH TIME ZONE,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Citas
CREATE TABLE citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  motivo TEXT,
  costo DECIMAL(10,2),
  estado TEXT DEFAULT 'pendiente', -- pendiente, completada, cancelada
  notas_doctor TEXT,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Expedientes (Notas de Evolución)
CREATE TABLE expedientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  titulo TEXT,
  contenido TEXT,
  fotos_urls TEXT[], -- Array de links a fotos en Storage
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS (Seguridad)
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Solo el dueño autenticado puede ver los datos)
CREATE POLICY "Dueño puede ver sus pacientes" ON pacientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Dueño puede ver sus citas" ON citas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Dueño puede ver expedientes" ON expedientes FOR ALL USING (auth.role() = 'authenticated');
