-- ============================================
-- TABLA: solicitudes_documentos
-- Portal de carga de documentos para clientes
-- ============================================

CREATE TABLE IF NOT EXISTS solicitudes_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  cliente_id TEXT NOT NULL,
  promotor_email TEXT NOT NULL,
  tipo_servicio TEXT NOT NULL CHECK (tipo_servicio IN ('linea_nueva', 'portabilidad')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'expirado')),
  expira_en TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  
  -- Datos llenados por el cliente
  nombre_cliente TEXT,
  no_titular TEXT,
  no_referencia TEXT,
  correo TEXT,
  
  -- URLs de archivos en Supabase Storage
  ine_frente_url TEXT,
  ine_reverso_url TEXT,
  estado_cuenta_url TEXT, -- Solo portabilidad
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  completado_en TIMESTAMPTZ
);

-- RLS: Acceso público para leer por token (el cliente no está logueado)
ALTER TABLE solicitudes_documentos ENABLE ROW LEVEL SECURITY;

-- El cliente puede leer por token (sin auth)
CREATE POLICY "leer_por_token" ON solicitudes_documentos
  FOR SELECT USING (true);

-- El cliente puede actualizar su solicitud (completar)
CREATE POLICY "completar_solicitud" ON solicitudes_documentos
  FOR UPDATE USING (true);

-- Solo usuarios autenticados pueden insertar (el promotor genera el link)
CREATE POLICY "insertar_autenticado" ON solicitudes_documentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- BUCKET en Supabase Storage
-- Ejecutar esto en el Dashboard de Supabase > Storage
-- O via API si prefieres
-- ============================================
-- Crear bucket: documentos-clientes (public = false para acceso por URL firmada)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-clientes', 'documentos-clientes', false);
