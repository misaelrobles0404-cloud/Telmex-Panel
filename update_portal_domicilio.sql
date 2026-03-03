-- ==========================================================
-- 1. Añadir campos de domicilio a solicitudes_documentos
-- ==========================================================
ALTER TABLE solicitudes_documentos
ADD COLUMN IF NOT EXISTS calle TEXT,
ADD COLUMN IF NOT EXISTS colonia TEXT,
ADD COLUMN IF NOT EXISTS cp TEXT,
ADD COLUMN IF NOT EXISTS cd TEXT,
ADD COLUMN IF NOT EXISTS estado_domicilio TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_1 TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_2 TEXT,
ADD COLUMN IF NOT EXISTS mz TEXT,
ADD COLUMN IF NOT EXISTS lt TEXT;

-- ==========================================================
-- 2. Actualizar el trigger fn_prospecto_desde_portal
-- para guardar estos datos en la tabla clientes
-- ==========================================================
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
            calle          = COALESCE(NEW.calle, calle),
            colonia        = COALESCE(NEW.colonia, colonia),
            cp             = COALESCE(NEW.cp, cp),
            cd             = COALESCE(NEW.cd, cd),
            estado         = COALESCE(NEW.estado_domicilio, estado),
            entre_calle_1  = COALESCE(NEW.entre_calle_1, entre_calle_1),
            entre_calle_2  = COALESCE(NEW.entre_calle_2, entre_calle_2),
            mz             = COALESCE(NEW.mz, mz),
            lt             = COALESCE(NEW.lt, lt),
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
            paquete, precio_mensual, velocidad, comision, 
            calle, colonia, cp, cd, estado, 
            entre_calle_1, entre_calle_2, mz, lt
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
            'POR DEFINIR', 0, 0, 0, 
            COALESCE(NEW.calle, 'PENDIENTE'),
            COALESCE(NEW.colonia, ''),
            COALESCE(NEW.cp, ''),
            COALESCE(NEW.cd, ''),
            COALESCE(NEW.estado_domicilio, ''),
            COALESCE(NEW.entre_calle_1, ''),
            COALESCE(NEW.entre_calle_2, ''),
            COALESCE(NEW.mz, ''),
            COALESCE(NEW.lt, '')
        );
    END IF;

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    -- Loguear el error pero no interrumpir el flujo del cliente
    RAISE WARNING 'fn_prospecto_desde_portal error: %', SQLERRM;
    RETURN NEW;
END;
$$;
