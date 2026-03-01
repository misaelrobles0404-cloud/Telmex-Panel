import { Cliente, TipoServicio, Documento, Actividad, Recordatorio } from '@/types';
import { supabase } from './supabase';

// ============================================
// STORAGE KEYS (Keeping for legacy/fallback if needed)
// ============================================

const STORAGE_KEYS = {
    CLIENTES: 'telmex_clientes',
    DOCUMENTOS: 'telmex_documentos',
    ACTIVIDADES: 'telmex_actividades',
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
    const { documentos, actividades, ...datosParaGuardar } = cliente;

    const { error } = await supabase
        .from('clientes')
        .upsert(datosParaGuardar);

    if (error) {
        console.error('Error al guardar cliente en Supabase:', error);
        throw error;
    }
}

// Función dedicada para liberar el portal - usa null EXPLÍCITO, no undefined
// Supabase ignora los campos undefined en un upsert, pero null sí borra el valor
export async function liberarPortalCliente(clienteId: string): Promise<void> {
    const { error } = await supabase
        .from('clientes')
        .update({
            en_uso_por: null,
            en_uso_desde: null,
        })
        .eq('id', clienteId);

    if (error) {
        console.error('Error al liberar portal en Supabase:', error);
        throw error;
    }
}

// ============================================
// PORTAL ESTADO GLOBAL (tabla portal_estado en Supabase)
// SQL para crear la tabla:
// CREATE TABLE portal_estado (id INT PRIMARY KEY DEFAULT 1, en_uso_por TEXT, en_uso_desde TIMESTAMPTZ);
// INSERT INTO portal_estado (id) VALUES (1) ON CONFLICT DO NOTHING;
// ============================================

export interface EstadoPortal {
    en_uso_por: string | null;
    en_uso_desde: string | null;
    alerta_pedida_por: string | null;
}

export async function obtenerEstadoPortal(): Promise<EstadoPortal> {
    const { data, error } = await supabase
        .from('portal_estado')
        .select('*')
        .eq('id', 1)
        .single();

    if (error || !data) return { en_uso_por: null, en_uso_desde: null, alerta_pedida_por: null };
    return { en_uso_por: data.en_uso_por, en_uso_desde: data.en_uso_desde, alerta_pedida_por: data.alerta_pedida_por ?? null };
}

export async function pedirAlertaPortal(nombre: string): Promise<void> {
    const { error } = await supabase
        .from('portal_estado')
        .update({ alerta_pedida_por: nombre })
        .eq('id', 1);
    if (error) { console.error('Error al pedir alerta:', error); throw error; }
}

export async function marcarPortalEnUso(nombre: string): Promise<void> {
    const { error } = await supabase
        .from('portal_estado')
        .upsert({ id: 1, en_uso_por: nombre, en_uso_desde: new Date().toISOString() });
    if (error) { console.error('Error al marcar portal:', error); throw error; }
}

export async function liberarPortalGlobal(): Promise<void> {
    const { error } = await supabase
        .from('portal_estado')
        .update({ en_uso_por: null, en_uso_desde: null, alerta_pedida_por: null })
        .eq('id', 1);
    if (error) { console.error('Error al liberar portal:', error); throw error; }
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

export async function eliminarClientesMasivos(ids: string[]): Promise<void> {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error al eliminar clientes masivos en Supabase:', error);
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
