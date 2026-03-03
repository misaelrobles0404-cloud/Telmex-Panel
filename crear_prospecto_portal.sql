-- =====================================================
-- TRIGGER: Crear prospecto automáticamente cuando
-- el cliente completa el formulario del portal
--
-- ¿Cómo funciona?
-- 1. El cliente llena el formulario y sube documentos
-- 2. completarSolicitud() cambia estado → 'completado'
-- 3. Este trigger se dispara automáticamente en la BD
-- 4. Crea el prospecto sin ningún problema de RLS
-- =====================================================

-- Paso 1: Función que ejecuta el trigger
CREATE OR REPLACE FUNCTION fn_prospecto_desde_portal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Solo actuar cuando estado cambia a 'completado'
    IF NEW.estado <> 'completado' OR OLD.estado = 'completado' THEN
        RETURN NEW;
    END IF;

    IF NEW.cliente_id IS NOT NULL THEN
        -- ── CASO 1: Link con cliente existente → actualizar sus datos ──
        UPDATE clientes SET
            nombre         = COALESCE(NEW.nombre_cliente, nombre),
            no_tt          = COALESCE(NEW.no_titular, no_tt),
            no_ref         = COALESCE(NEW.no_referencia, no_ref),
            correo         = COALESCE(NEW.correo, correo),
            actualizado_en = NOW()
        WHERE id::TEXT = NEW.cliente_id;

    ELSE
        -- ── CASO 2: Link sin cliente → crear nuevo prospecto ──

        -- Buscar UUID del promotor en auth.users
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = NEW.promotor_email
        LIMIT 1;

        IF v_user_id IS NULL THEN
            -- Si no encontramos al promotor, no crear prospecto
            RETURN NEW;
        END IF;

        INSERT INTO clientes (
            nombre, no_tt, no_ref, correo, tipo_servicio,
            estado_pipeline, user_id,
            creado_en, actualizado_en,
            actividades, documentos,
            paquete, precio_mensual, velocidad, comision, calle
        ) VALUES (
            COALESCE(NEW.nombre_cliente, 'CLIENTE PORTAL'),
            COALESCE(NEW.no_titular, ''),
            COALESCE(NEW.no_referencia, ''),
            COALESCE(NEW.correo, ''),
            NEW.tipo_servicio,
            'prospecto',
            v_user_id,
            NOW(), NOW(),
            '[]'::jsonb, '[]'::jsonb,
            'POR DEFINIR', 0, 0, 0, 'PENDIENTE'
        );
    END IF;

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    -- Loguear el error pero no interrumpir el flujo del cliente
    RAISE WARNING 'fn_prospecto_desde_portal error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Paso 2: Crear el trigger (eliminar primero si ya existe)
DROP TRIGGER IF EXISTS on_solicitud_completada ON solicitudes_documentos;

CREATE TRIGGER on_solicitud_completada
    AFTER UPDATE ON solicitudes_documentos
    FOR EACH ROW
    EXECUTE FUNCTION fn_prospecto_desde_portal();
