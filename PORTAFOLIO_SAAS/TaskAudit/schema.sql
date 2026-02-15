-- Esquema para TASKAUDIT (Checklist y Auditoría con Fotos)
-- Copiar y pegar en el SQL Editor de Supabase

-- 1. Catálogo de Rutinas
CREATE TABLE rutinas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  frecuencia TEXT DEFAULT 'diaria', -- diaria, semanal, mensual
  total_tareas INTEGER DEFAULT 0,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tareas por Rutina
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rutina_id UUID REFERENCES rutinas(id) ON DELETE CASCADE,
  instruccion TEXT NOT NULL,
  requiere_foto BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0
);

-- 3. Registro de Ejecuciones (La auditoría real)
CREATE TABLE auditorias_realizadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rutina_id UUID REFERENCES rutinas(id) ON DELETE CASCADE,
  empleado_id UUID REFERENCES auth.users(id),
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  estado TEXT DEFAULT 'en_progreso', -- en_progreso, completada, fallida
  ubicacion_lat DECIMAL(10,8),
  ubicacion_lng DECIMAL(11,8)
);

-- 4. Respuestas de Auditoría y Evidencia
CREATE TABLE auditoria_respuestas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auditoria_id UUID REFERENCES auditorias_realizadas(id) ON DELETE CASCADE,
  tarea_id UUID REFERENCES tareas(id),
  completada BOOLEAN DEFAULT false,
  comentario TEXT,
  foto_url TEXT, -- Link a la evidencia en Storage
  fecha_respuesta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditorias_realizadas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Dueño ve todo" ON rutinas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Empleado ve sus auditorias" ON auditorias_realizadas FOR ALL USING (auth.uid() = empleado_id);
