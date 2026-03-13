-- 1. Asegurarnos que existan las columnas en solicitudes_documentos
ALTER TABLE solicitudes_documentos
ADD COLUMN IF NOT EXISTS calle TEXT,
ADD COLUMN IF NOT EXISTS colonia TEXT,
ADD COLUMN IF NOT EXISTS cp TEXT,
ADD COLUMN IF NOT EXISTS cd TEXT,
ADD COLUMN IF NOT EXISTS estado_domicilio TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_1 TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_2 TEXT,
ADD COLUMN IF NOT EXISTS numero_exterior TEXT,
ADD COLUMN IF NOT EXISTS numero_interior TEXT,
ADD COLUMN IF NOT EXISTS mz TEXT,
ADD COLUMN IF NOT EXISTS lt TEXT,
ADD COLUMN IF NOT EXISTS nombre_cliente TEXT,
ADD COLUMN IF NOT EXISTS no_titular TEXT,
ADD COLUMN IF NOT EXISTS no_referencia TEXT,
ADD COLUMN IF NOT EXISTS correo TEXT,
ADD COLUMN IF NOT EXISTS curp TEXT;

-- 2. Asegurarnos que existan las columnas en clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS numero_exterior TEXT,
ADD COLUMN IF NOT EXISTS numero_interior TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_1 TEXT,
ADD COLUMN IF NOT EXISTS entre_calle_2 TEXT,
ADD COLUMN IF NOT EXISTS mz TEXT,
ADD COLUMN IF NOT EXISTS lt TEXT,
ADD COLUMN IF NOT EXISTS curp TEXT;

-- 3. Actualizar el trigger para que COPIE CORRECTAMENTE todos los campos
CREATE OR REPLACE FUNCTION fn_prospecto_desde_portal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Solo actuar cuando cambia a 'completado'
    IF NEW.estado <> 'completado' OR (OLD.estado IS NOT NULL AND OLD.estado = 'completado') THEN
        RETURN NEW;
    END IF;

    IF NEW.cliente_id IS NOT NULL THEN
        -- CASO 1: Ya existe en la tabla clientes -> Actualizar todos los campos
        UPDATE clientes SET
            nombre          = COALESCE(NULLIF(NEW.nombre_cliente, ''), nombre),
            no_tt           = COALESCE(NULLIF(NEW.no_titular, ''), no_tt),
            no_ref          = COALESCE(NULLIF(NEW.no_referencia, ''), no_ref),
            correo          = COALESCE(NULLIF(NEW.correo, ''), correo),
            calle           = COALESCE(NULLIF(NEW.calle, ''), calle),
            numero_exterior = COALESCE(NULLIF(NEW.numero_exterior, ''), numero_exterior),
            numero_interior = COALESCE(NULLIF(NEW.numero_interior, ''), numero_interior),
            colonia         = COALESCE(NULLIF(NEW.colonia, ''), colonia),
            cp              = COALESCE(NULLIF(NEW.cp, ''), cp),
            cd              = COALESCE(NULLIF(NEW.cd, ''), cd),
            estado          = COALESCE(NULLIF(NEW.estado_domicilio, ''), estado),
            entre_calle_1   = COALESCE(NULLIF(NEW.entre_calle_1, ''), entre_calle_1),
            entre_calle_2   = COALESCE(NULLIF(NEW.entre_calle_2, ''), entre_calle_2),
            mz              = COALESCE(NULLIF(NEW.mz, ''), mz),
            lt              = COALESCE(NULLIF(NEW.lt, ''), lt),
            curp            = COALESCE(NULLIF(NEW.curp, ''), curp),
            actualizado_en  = NOW()
        WHERE id = NEW.cliente_id;
    ELSE
        -- CASO 2: Sin cliente_id -> Crear un nuevo lead (No debería pasar si usan Link)
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = NEW.promotor_email
        LIMIT 1;

        IF v_user_id IS NULL THEN
            RETURN NEW;
        END IF;

        INSERT INTO clientes (
            nombre, no_tt, no_ref, correo, tipo_servicio,
            estado_pipeline, user_id,
            creado_en, actualizado_en,
            actividades, documentos,
            paquete, precio_mensual, velocidad, comision, 
            calle, numero_exterior, numero_interior,
            colonia, cp, cd, estado, 
            entre_calle_1, entre_calle_2, mz, lt, curp
        ) VALUES (
            COALESCE(NULLIF(NEW.nombre_cliente, ''), 'CLIENTE PORTAL'),
            COALESCE(NULLIF(NEW.no_titular, ''), 'PENDIENTE'),
            COALESCE(NULLIF(NEW.no_referencia, ''), 'PENDIENTE'),
            COALESCE(NULLIF(NEW.correo, ''), 'pendiente@correo.com'),
            NEW.tipo_servicio,
            'prospecto',
            v_user_id,
            NOW(), NOW(),
            '[]'::jsonb, '[]'::jsonb,
            'POR DEFINIR', 0, 0, 0, 
            COALESCE(NULLIF(NEW.calle, ''), 'PENDIENTE'),
            COALESCE(NULLIF(NEW.numero_exterior, ''), ''),
            COALESCE(NULLIF(NEW.numero_interior, ''), ''),
            COALESCE(NULLIF(NEW.colonia, ''), 'PENDIENTE'),
            COALESCE(NULLIF(NEW.cp, ''), '00000'),
            COALESCE(NULLIF(NEW.cd, ''), 'PENDIENTE'),
            COALESCE(NULLIF(NEW.estado_domicilio, ''), 'PENDIENTE'),
            COALESCE(NULLIF(NEW.entre_calle_1, ''), ''),
            COALESCE(NULLIF(NEW.entre_calle_2, ''), ''),
            COALESCE(NULLIF(NEW.mz, ''), ''),
            COALESCE(NULLIF(NEW.lt, ''), ''),
            COALESCE(NULLIF(NEW.curp, ''), 'PENDIENTE')
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_prospecto_desde_portal error: %', SQLERRM;
    RETURN NEW;
END;
$$;
