import { Cliente, TipoServicio, Documento, Actividad, Publicacion, Recordatorio } from '@/types';
import { supabase } from './supabase';

// ============================================
// STORAGE KEYS (Keeping for legacy/fallback if needed)
// ============================================

const STORAGE_KEYS = {
    CLIENTES: 'telmex_clientes',
    DOCUMENTOS: 'telmex_documentos',
    ACTIVIDADES: 'telmex_actividades',
    PUBLICACIONES: 'telmex_publicaciones',
    RECORDATORIOS: 'telmex_recordatorios',
} as const;

// ============================================
// RECORDATORIOS (LocalStorage for now as they are fast/personal)
// ============================================

export function guardarRecordatorio(recordatorio: Recordatorio): void {
    const recordatorios = obtenerRecordatoriosSync();
    const index = recordatorios.findIndex(r => r.id === recordatorio.id);

    if (index >= 0) {
        recordatorios[index] = recordatorio;
    } else {
        recordatorios.push(recordatorio);
    }

    localStorage.setItem(STORAGE_KEYS.RECORDATORIOS, JSON.stringify(recordatorios));
}

function obtenerRecordatoriosSync(): Recordatorio[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.RECORDATORIOS);
    return data ? JSON.parse(data) : [];
}

export function obtenerRecordatorios(): Recordatorio[] {
    return obtenerRecordatoriosSync();
}

export function eliminarRecordatorio(id: string): void {
    const recordatorios = obtenerRecordatoriosSync();
    const filtered = recordatorios.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECORDATORIOS, JSON.stringify(filtered));
}

// ============================================
// CLIENTES (SUPABASE)
// ============================================

export async function guardarCliente(cliente: Cliente): Promise<void> {
    const { documentos, ...datosParaGuardar } = cliente;

    // Sanitización de campos especiales para evitar errores de sintaxis SQL (UUID, DATE)
    if (datosParaGuardar.campana_id === '') {
        datosParaGuardar.campana_id = undefined;
    }

    // Si la fecha de vigencia es una cadena vacía, debe ser null para Postgres
    const d = datosParaGuardar as any;
    if (d.fecha_vigencia === '') {
        d.fecha_vigencia = undefined;
    }

    const { error } = await supabase
        .from('clientes')
        .upsert(datosParaGuardar);

    if (error) {
        console.error('Error al guardar cliente en Supabase:', error);
        throw error;
    }
}

export async function obtenerClientes(): Promise<Cliente[]> {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('fecha_contacto', { ascending: false });

    if (error) {
        console.error('Error al obtener clientes de Supabase:', error);
        return [];
    }

    return data || [];
}

export async function obtenerCliente(id: string): Promise<Cliente | undefined> {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error al obtener cliente de Supabase:', error);
        return undefined;
    }

    return data || undefined;
}

export async function eliminarCliente(id: string): Promise<void> {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar cliente en Supabase:', error);
        throw error;
    }
}

// ============================================
// PUBLICACIONES / CAMPAÑAS (SUPABASE)
// ============================================

export async function guardarPublicacion(publicacion: Publicacion): Promise<void> {
    const { error } = await supabase
        .from('campanas')
        .upsert(publicacion);

    if (error) {
        console.error('Error al guardar campaña en Supabase:', error);
        throw error;
    }
}

export async function obtenerPublicaciones(): Promise<Publicacion[]> {
    const { data, error } = await supabase
        .from('campanas')
        .select('*');

    if (error) {
        console.error('Error al obtener campañas de Supabase:', error);
        return [];
    }

    return data || [];
}

export async function eliminarPublicacion(id: string): Promise<void> {
    const { error } = await supabase
        .from('campanas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar campaña en Supabase:', error);
        throw error;
    }
}

// ============================================
// DOCUMENTOS & ACTIVIDADES (Next Phase)
// ============================================

export function obtenerDocumentos(): Documento[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTOS);
    return data ? JSON.parse(data) : [];
}

export function obtenerActividades(): Actividad[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVIDADES);
    return data ? JSON.parse(data) : [];
}
