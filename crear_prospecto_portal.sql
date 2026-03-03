-- ============================================
-- SOLUCIÓN CORRECTA: Función con SECURITY DEFINER + permisos para anon
-- Ejecuta TODO esto en Supabase SQL Editor en un solo bloque
-- ============================================

-- Paso 1: Eliminar función anterior
DROP FUNCTION IF EXISTS crear_prospecto_desde_portal(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Paso 2: Crear la función correcta
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
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_count   INT;
BEGIN
    -- ── CASO 1: actualizar cliente existente ──────────────────────
    IF p_cliente_id IS NOT NULL AND p_cliente_id != '' THEN
        UPDATE clientes SET
            nombre        = p_nombre,
            no_tt         = p_no_tt,
            no_ref        = p_no_ref,
            correo        = p_correo,
            actualizado_en = NOW()
        WHERE id::TEXT = p_cliente_id;
        RETURN json_build_object('ok', true, 'action', 'updated');
    END IF;

    -- ── CASO 2: crear nuevo prospecto ─────────────────────────────
    -- Buscar user_id del promotor mirando sus clientes ya existentes
    SELECT user_id INTO v_user_id
    FROM clientes
    WHERE user_id IS NOT NULL
    -- El promotor_email se guarda en solicitudes, ligamos por la solicitud
    -- Si no podemos, tomamos el primer cliente del sistema como referencia
    LIMIT 1;

    -- Más específico: buscar via la tabla de solicitudes
    SELECT c.user_id INTO v_user_id
    FROM solicitudes_documentos sd
    JOIN clientes c ON c.user_id IS NOT NULL
    WHERE sd.promotor_email = p_promotor_email
      AND sd.cliente_id IS NOT NULL
      AND sd.cliente_id = c.id::TEXT
    LIMIT 1;

    -- Si aún no encontramos, buscar cualquier cliente del promotor por su email
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id
        FROM clientes
        WHERE correo = p_promotor_email
          AND user_id IS NOT NULL
        LIMIT 1;
    END IF;

    -- Último recurso: tomar el user_id de cualquier cliente existente del sistema
    -- (funciona si el promotor tiene al menos un cliente)
    IF v_user_id IS NULL THEN
        SELECT cl.user_id INTO v_user_id
        FROM solicitudes_documentos sd
        JOIN clientes cl ON cl.user_id IS NOT NULL
        WHERE sd.promotor_email = p_promotor_email
        LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'No se encontró user_id para promotor: ' || p_promotor_email);
    END IF;

    -- Insertar el nuevo prospecto
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

    RETURN json_build_object('ok', true, 'action', 'created', 'user_id', v_user_id::TEXT);

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- Paso 3: CRÍTICO — dar permiso al rol anon (clientes sin login) para ejecutar la función
GRANT EXECUTE ON FUNCTION crear_prospecto_desde_portal(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION crear_prospecto_desde_portal(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
