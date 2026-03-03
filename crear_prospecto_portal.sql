-- ============================================
-- Función para crear prospecto desde el portal público
-- SECURITY DEFINER = bypasea RLS (el cliente no está autenticado)
-- ============================================

CREATE OR REPLACE FUNCTION crear_prospecto_desde_portal(
    p_nombre        TEXT,
    p_no_tt         TEXT,
    p_no_ref        TEXT,
    p_correo        TEXT,
    p_tipo_servicio TEXT,
    p_promotor_email TEXT,
    p_cliente_id    TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_cliente_id IS NOT NULL THEN
        -- Actualizar cliente existente con los datos que llenó
        UPDATE clientes SET
            nombre        = p_nombre,
            no_tt         = p_no_tt,
            no_ref        = p_no_ref,
            correo        = p_correo,
            actualizado_en = NOW()
        WHERE id::TEXT = p_cliente_id;
    ELSE
        -- Crear nuevo prospecto ligado al promotor por email
        INSERT INTO clientes (
            nombre, no_tt, no_ref, correo, tipo_servicio,
            estado_pipeline, user_id,
            creado_en, actualizado_en,
            actividades, documentos,
            paquete, precio_mensual, velocidad, comision, calle
        )
        SELECT
            p_nombre, p_no_tt, p_no_ref, p_correo, p_tipo_servicio,
            'prospecto', p.id,
            NOW(), NOW(),
            '[]'::jsonb, '[]'::jsonb,
            'POR DEFINIR', 0, 0, 0, 'PENDIENTE'
        FROM perfiles p
        WHERE p.email = p_promotor_email
        LIMIT 1;
    END IF;
END;
$$;
