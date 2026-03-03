-- ============================================
-- TABLA: capturas_proceso_cliente
-- Capturas del proceso que sube el PROMOTOR
-- (paquete, mapa, SIAC, Si acepto del chat, SIAC chat, cobertura)
-- ============================================

CREATE TABLE IF NOT EXISTS capturas_proceso_cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id TEXT UNIQUE NOT NULL,  -- 1 registro por cliente
  promotor_email TEXT NOT NULL,
  captura_paquete_url TEXT,
  captura_mapa_url TEXT,
  captura_siac_url TEXT,
  captura_si_chat_url TEXT,
  captura_siac_chat_url TEXT,
  captura_cobertura_url TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Solo usuarios autenticados pueden leer/escribir
ALTER TABLE capturas_proceso_cliente ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "capturas_select" ON capturas_proceso_cliente
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT (necesita WITH CHECK, no USING)
CREATE POLICY "capturas_insert" ON capturas_proceso_cliente
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE
CREATE POLICY "capturas_update" ON capturas_proceso_cliente
  FOR UPDATE USING (auth.role() = 'authenticated');
