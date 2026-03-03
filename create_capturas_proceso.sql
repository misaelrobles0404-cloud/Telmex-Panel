-- ============================================
-- TABLA: capturas_proceso_cliente
-- Capturas del proceso que sube el PROMOTOR
-- (paquete, mapa, SIAC, Si acepto del chat)
-- ============================================

CREATE TABLE IF NOT EXISTS capturas_proceso_cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id TEXT UNIQUE NOT NULL,  -- 1 registro por cliente
  promotor_email TEXT NOT NULL,
  captura_paquete_url TEXT,
  captura_mapa_url TEXT,
  captura_siac_url TEXT,
  captura_si_chat_url TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Solo usuarios autenticados pueden leer/escribir su propia data
ALTER TABLE capturas_proceso_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_autenticado" ON capturas_proceso_cliente
  FOR ALL USING (auth.role() = 'authenticated');
