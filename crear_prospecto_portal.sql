-- ============================================
-- Función para crear prospecto desde el portal público
-- CORREGIDA: usa auth.users para buscar el user_id del promotor
-- SECURITY DEFINER = bypasea RLS (el cliente no está autenticado)
-- ============================================

-- Primero elimina la versión anterior si existe
DROP FUNCTION IF EXISTS crear_prospecto_desde_portal(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION crear_prospecto_desde_portal(
    p_nombre        TEXT,
    p_no_tt         TEXT,
    p_no_ref        TEXT,
    p_correo        TEXT,
    p_tipo_servicio TEXT,
    p_promotor_email TEXT,
    p_cliente_id    TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF p_cliente_id IS NOT NULL AND p_cliente_id != '' THEN
        -- Actualizar cliente existente con los datos que llenó
        UPDATE clientes SET
            nombre        = p_nombre,
            no_tt         = p_no_tt,
            no_ref        = p_no_ref,
            correo        = p_correo,
            actualizado_en = NOW()
        WHERE id::TEXT = p_cliente_id;

        RETURN json_build_object('ok', true, 'action', 'updated');
    ELSE
        -- Buscar el UUID del promotor en auth.users por su email
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = p_promotor_email
        LIMIT 1;

        IF v_user_id IS NULL THEN
            RETURN json_build_object('ok', false, 'error', 'promotor no encontrado: ' || p_promotor_email);
        END IF;

        -- Crear nuevo prospecto ligado al promotor
        INSERT INTO clientes (
            nombre, no_tt, no_ref, correo, tipo_servicio,
            estado_pipeline, user_id,
            creado_en, actualizado_en,
            actividades, documentos,
            paquete, precio_mensual, velocidad, comision, calle
        ) VALUES (
            p_nombre, p_no_tt, p_no_ref, p_correo, p_tipo_servicio,
            'prospecto', v_user_id,
            NOW(), NOW(),
            '[]'::jsonb, '[]'::jsonb,
            'POR DEFINIR', 0, 0, 0, 'PENDIENTE'
        );

        RETURN json_build_object('ok', true, 'action', 'created');
    END IF;
END;
$$;
