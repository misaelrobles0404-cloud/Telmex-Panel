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

export interface GlobalConfig {
    claves_portal: ClavePortal[];
    app_announcement: AppAnnouncement;
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
