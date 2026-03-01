import { supabase } from './supabase';

export interface AppAnnouncement {
    text: string;
    active: boolean;
    type: 'info' | 'warning' | 'error' | 'success';
}

export interface ClavePortal {
    id: string;
    ciudad: string;
    tienda: string;
    usuario: string;
    nombre: string;
}

export interface ConfigComisiones {
    linea_nueva: number;
    portabilidad: number;
    winback: number;
}

export interface ClaveUniversal {
    id_usuario: string;
    clave_captura: string;
    nombres: string[]; // Ej: ['GUSTAVO', 'ACEVEDO', 'ZAMARRON']
}

export interface MetaSuperVendedor {
    ventas_semana: number;
}

export interface GlobalConfig {
    claves_portal: ClavePortal[];
    app_announcement: AppAnnouncement;
    config_comisiones: ConfigComisiones;
    clave_universal: ClaveUniversal;
    meta_super_vendedor: MetaSuperVendedor;
    requisitos_venta: string[];
}

/**
 * Obtiene una configuración específica por su clave
 */
export async function obtenerConfiguracion<T>(key: string): Promise<T | null> {
    const { data, error } = await supabase
        .from('configuraciones')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        console.error(`Error al obtener configuración ${key}:`, error);
        return null;
    }

    return data.value as T;
}

/**
 * Guarda o actualiza una configuración
 */
export async function guardarConfiguracion<T>(key: string, value: T): Promise<void> {
    const { error } = await supabase
        .from('configuraciones')
        .upsert({
            id: key,
            key: key,
            value: value,
            actualizado_en: new Date().toISOString()
        });

    if (error) {
        console.error(`Error al guardar configuración ${key}:`, error);
        throw error;
    }
}

/**
 * Helper para obtener todas las claves de portal (con fallback a estático si falla)
 */
export async function obtenerClavesPortal(): Promise<ClavePortal[]> {
    const config = await obtenerConfiguracion<ClavePortal[]>('claves_portal');
    return config || [];
}

/**
 * Helper para obtener el anuncio activo
 */
export async function obtenerAnuncio(): Promise<AppAnnouncement | null> {
    return await obtenerConfiguracion<AppAnnouncement>('app_announcement');
}

/**
 * Helper para obtener la configuración de comisiones con valores por defecto
 */
export async function obtenerComisiones(): Promise<ConfigComisiones> {
    const config = await obtenerConfiguracion<ConfigComisiones>('config_comisiones');
    return config || {
        linea_nueva: 300,
        portabilidad: 300,
        winback: 300
    };
}

/**
 * Helper para obtener la clave universal con fallback al valor hardcoded
 */
export async function obtenerClaveUniversal(): Promise<ClaveUniversal> {
    const config = await obtenerConfiguracion<ClaveUniversal>('clave_universal');
    return config || {
        id_usuario: '10000900',
        clave_captura: '337595',
        nombres: ['GUSTAVO', 'ACEVEDO', 'ZAMARRON']
    };
}

/**
 * Helper para obtener la meta de súper vendedor
 */
export async function obtenerMetaSuperVendedor(): Promise<MetaSuperVendedor> {
    const config = await obtenerConfiguracion<MetaSuperVendedor>('meta_super_vendedor');
    return config || { ventas_semana: 7 };
}

/**
 * Helper para obtener los requisitos de venta con fallback a los valores por defecto
 */
export async function obtenerRequisitosVenta(): Promise<string[]> {
    const config = await obtenerConfiguracion<string[]>('requisitos_venta');
    return config || [
        'SI O ACEPTO AL MENSAJE DE ALTA',
        'DATOS Y MAPA EN PORTAL',
        'PAQUETE ELEGIDO EN PORTAL',
        'CAPTURA DE FOLIO EN PORTAL',
        'CAPTURA DE FOLIO SIAC EN CHAT-CLIENTE',
        'INE POR AMBOS LADOS DEL CLIENTE',
        'FOTO DE COBERTURA'
    ];
}
