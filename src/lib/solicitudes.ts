import { supabase } from './supabase';

// ============================================
// SOLICITUDES DE DOCUMENTOS
// ============================================

export interface SolicitudDocumentos {
    id: string;
    token: string;
    cliente_id: string;
    promotor_email: string;
    tipo_servicio: 'linea_nueva' | 'portabilidad';
    estado: 'pendiente' | 'completado' | 'expirado';
    expira_en: string;
    nombre_cliente?: string;
    no_titular?: string;
    no_referencia?: string;
    correo?: string;
    ine_frente_url?: string;
    ine_reverso_url?: string;
    estado_cuenta_url?: string;
    creado_en: string;
    completado_en?: string;
}

/**
 * Genera un token único para la solicitud
 */
function generarToken(): string {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Crea una nueva solicitud de documentos y devuelve la URL pública para el cliente.
 */
export async function crearSolicitudDocumentos(
    clienteId: string | null,
    tipoServicio: 'linea_nueva' | 'portabilidad',
    promotorEmail: string
): Promise<string> {
    const token = generarToken();

    const { error } = await supabase
        .from('solicitudes_documentos')
        .insert({
            token,
            cliente_id: clienteId,  // puede ser null para links sin cliente previo
            promotor_email: promotorEmail,
            tipo_servicio: tipoServicio,
            estado: 'pendiente',
        });

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://telmex-panel.vercel.app';
    return `${baseUrl}/docs/${token}`;
}

/**
 * Obtiene una solicitud por token (usado en la página pública del cliente)
 */
export async function obtenerSolicitudPorToken(token: string): Promise<SolicitudDocumentos | null> {
    const { data, error } = await supabase
        .from('solicitudes_documentos')
        .select('*')
        .eq('token', token)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Obtiene la solicitud activa de un cliente (para mostrar en el panel del promotor)
 */
export async function obtenerSolicitudPorCliente(clienteId: string): Promise<SolicitudDocumentos | null> {
    const { data, error } = await supabase
        .from('solicitudes_documentos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('creado_en', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Sube un archivo al bucket de documentos y devuelve la URL pública firmada.
 */
export async function subirDocumentoCliente(
    token: string,
    archivo: File,
    nombre: string
): Promise<string> {
    const extension = archivo.name.split('.').pop() || 'jpg';
    const path = `${token}/${nombre}.${extension}`;

    const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(path, archivo, { upsert: true });

    if (uploadError) throw uploadError;

    // URL firmada válida por 7 días para que el promotor pueda ver/compartir
    const { data } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(path, 60 * 60 * 24 * 7);

    return data?.signedUrl || '';
}

/**
 * Marca la solicitud como completada y guarda los datos del cliente.
 */
export async function completarSolicitud(
    token: string,
    datos: {
        nombre_cliente: string;
        no_titular: string;
        no_referencia: string;
        correo: string;
        ine_frente_url: string;
        ine_reverso_url: string;
        estado_cuenta_url?: string;
    }
): Promise<void> {
    const { error } = await supabase
        .from('solicitudes_documentos')
        .update({
            ...datos,
            estado: 'completado',
            completado_en: new Date().toISOString(),
        })
        .eq('token', token);

    if (error) throw error;
}

// ============================================
// CAPTURAS DEL PROCESO (Promotor)
// ============================================

export interface CapturasProceso {
    id?: string;
    cliente_id: string;
    promotor_email: string;
    captura_paquete_url?: string;
    captura_mapa_url?: string;
    captura_siac_url?: string;
    captura_si_chat_url?: string;
    captura_siac_chat_url?: string;
    captura_cobertura_url?: string;
    creado_en?: string;
    actualizado_en?: string;
}

/**
 * Sube una captura del proceso (del promotor) al bucket y devuelve URL firmada.
 */
export async function subirCapturaPromotor(
    clienteId: string,
    archivo: File,
    nombre: string
): Promise<string> {
    const extension = archivo.name.split('.').pop() || 'jpg';
    const path = `promotor/${clienteId}/${nombre}.${extension}`;

    const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(path, archivo, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 días

    return data?.signedUrl || '';
}

/**
 * Guarda o actualiza las capturas del proceso de un cliente.
 */
export async function guardarCapturasProceso(
    capturas: CapturasProceso
): Promise<void> {
    const { error } = await supabase
        .from('capturas_proceso_cliente')
        .upsert(capturas, { onConflict: 'cliente_id' });

    if (error) throw error;
}

/**
 * Obtiene las capturas del proceso de un cliente.
 */
export async function obtenerCapturasProceso(
    clienteId: string
): Promise<CapturasProceso | null> {
    const { data, error } = await supabase
        .from('capturas_proceso_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .maybeSingle();

    if (error) throw error;
    return data;
}
