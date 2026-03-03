import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ruta API server-side — crea el prospecto con privilegios completos
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { nombre, no_tt, no_ref, correo, tipo_servicio, promotor_email, cliente_id } = body;

        if (!nombre || !promotor_email) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        // Cliente con service_role si está disponible, si no con anon key
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: false } }
        );

        // ── CASO 1: Actualizar cliente existente ─────────────────────────────
        if (cliente_id && cliente_id !== '' && cliente_id !== 'null') {
            const { error } = await supabase
                .from('clientes')
                .update({
                    nombre: nombre.toUpperCase(),
                    no_tt,
                    no_ref,
                    correo: correo.toLowerCase(),
                    actualizado_en: new Date().toISOString(),
                })
                .eq('id', cliente_id);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ ok: true, action: 'updated' });
        }

        // ── CASO 2: Crear nuevo prospecto ────────────────────────────────────
        // Buscar user_id del promotor buscando en clientes ya existentes suyos
        const { data: clienteRef } = await supabase
            .from('solicitudes_documentos')
            .select('cliente_id')
            .eq('promotor_email', promotor_email)
            .not('cliente_id', 'is', null)
            .limit(1)
            .maybeSingle();

        let userId: string | null = null;

        if (clienteRef?.cliente_id) {
            // Obtener el user_id de ese cliente de referencia
            const { data: cl } = await supabase
                .from('clientes')
                .select('user_id')
                .eq('id', clienteRef.cliente_id)
                .maybeSingle();
            userId = cl?.user_id || null;
        }

        // Si no hay cliente de referencia, buscar cualquier cliente del promotor directo
        if (!userId) {
            // Intentar buscar por correo de promotor en clientes existentes
            const { data: clByEmail } = await supabase
                .from('clientes')
                .select('user_id')
                .eq('correo', promotor_email)
                .limit(1)
                .maybeSingle();
            userId = clByEmail?.user_id || null;
        }

        if (!userId) {
            return NextResponse.json({
                error: `No se pudo identificar al promotor (${promotor_email}). Asegúrate de que tiene al menos un cliente registrado.`
            }, { status: 404 });
        }

        // Insertar el nuevo prospecto
        const { error: insertError } = await supabase.from('clientes').insert({
            nombre: nombre.toUpperCase(),
            no_tt,
            no_ref,
            correo: correo.toLowerCase(),
            tipo_servicio,
            estado_pipeline: 'prospecto',
            user_id: userId,
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString(),
            actividades: [],
            documentos: [],
            paquete: 'POR DEFINIR',
            precio_mensual: 0,
            velocidad: 0,
            comision: 0,
            calle: 'PENDIENTE',
        });

        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
        return NextResponse.json({ ok: true, action: 'created' });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
