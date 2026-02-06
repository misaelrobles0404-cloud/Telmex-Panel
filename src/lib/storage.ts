import { Cliente, TipoServicio, Documento, Actividad, Publicacion, Recordatorio } from '@/types';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
    CLIENTES: 'telmex_clientes',
    DOCUMENTOS: 'telmex_documentos',
    ACTIVIDADES: 'telmex_actividades',
    PUBLICACIONES: 'telmex_publicaciones',
    RECORDATORIOS: 'telmex_recordatorios',
} as const;

// ============================================
// RECORDATORIOS
// ============================================

export function guardarRecordatorio(recordatorio: Recordatorio): void {
    const recordatorios = obtenerRecordatorios();
    const index = recordatorios.findIndex(r => r.id === recordatorio.id);

    if (index >= 0) {
        recordatorios[index] = recordatorio;
    } else {
        recordatorios.push(recordatorio);
    }

    localStorage.setItem(STORAGE_KEYS.RECORDATORIOS, JSON.stringify(recordatorios));
}

export function obtenerRecordatorios(): Recordatorio[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(STORAGE_KEYS.RECORDATORIOS);
    return data ? JSON.parse(data) : [];
}

export function eliminarRecordatorio(id: string): void {
    const recordatorios = obtenerRecordatorios();
    const filtered = recordatorios.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECORDATORIOS, JSON.stringify(filtered));
}

// ============================================
// CLIENTES
// ============================================

export function guardarCliente(cliente: Cliente): void {
    const clientes = obtenerClientes();
    const index = clientes.findIndex(c => c.id === cliente.id);

    if (index >= 0) {
        clientes[index] = cliente;
    } else {
        clientes.push(cliente);
    }

    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
}

export function obtenerClientes(): Cliente[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    return data ? JSON.parse(data) : [];
}

export function obtenerCliente(id: string): Cliente | undefined {
    const clientes = obtenerClientes();
    return clientes.find(c => c.id === id);
}

export function eliminarCliente(id: string): void {
    const clientes = obtenerClientes();
    const filtered = clientes.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(filtered));
}

export function obtenerClientesPorEstado(estado: Cliente['estadoPipeline']): Cliente[] {
    const clientes = obtenerClientes();
    return clientes.filter(c => c.estadoPipeline === estado);
}

// ============================================
// DOCUMENTOS
// ============================================

export function guardarDocumento(documento: Documento): void {
    const documentos = obtenerDocumentos();
    documentos.push(documento);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTOS, JSON.stringify(documentos));
}

export function obtenerDocumentos(): Documento[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTOS);
    return data ? JSON.parse(data) : [];
}

export function obtenerDocumentosPorCliente(clienteId: string): Documento[] {
    const documentos = obtenerDocumentos();
    return documentos.filter(d => d.clienteId === clienteId);
}

// ============================================
// ACTIVIDADES
// ============================================

export function guardarActividad(actividad: Actividad): void {
    const actividades = obtenerActividades();
    actividades.push(actividad);
    localStorage.setItem(STORAGE_KEYS.ACTIVIDADES, JSON.stringify(actividades));
}

export function obtenerActividades(): Actividad[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(STORAGE_KEYS.ACTIVIDADES);
    return data ? JSON.parse(data) : [];
}

export function obtenerActividadesPorCliente(clienteId: string): Actividad[] {
    const actividades = obtenerActividades();
    return actividades.filter(a => a.clienteId === clienteId);
}

// ============================================
// PUBLICACIONES
// ============================================

export function guardarPublicacion(publicacion: Publicacion): void {
    const publicaciones = obtenerPublicaciones();
    const index = publicaciones.findIndex(p => p.id === publicacion.id);

    if (index >= 0) {
        publicaciones[index] = publicacion;
    } else {
        publicaciones.push(publicacion);
    }

    localStorage.setItem(STORAGE_KEYS.PUBLICACIONES, JSON.stringify(publicaciones));
}

export function obtenerPublicaciones(): Publicacion[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(STORAGE_KEYS.PUBLICACIONES);
    return data ? JSON.parse(data) : [];
}

// ============================================
// EXPORTAR/IMPORTAR DATOS
// ============================================

export function exportarDatos(): string {
    const data = {
        clientes: obtenerClientes(),
        documentos: obtenerDocumentos(),
        actividades: obtenerActividades(),
        publicaciones: obtenerPublicaciones(),
        recordatorios: obtenerRecordatorios(),
        exportadoEn: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
}

export function importarDatos(jsonData: string): void {
    try {
        const data = JSON.parse(jsonData);

        if (data.clientes) {
            localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(data.clientes));
        }
        if (data.documentos) {
            localStorage.setItem(STORAGE_KEYS.DOCUMENTOS, JSON.stringify(data.documentos));
        }
        if (data.actividades) {
            localStorage.setItem(STORAGE_KEYS.ACTIVIDADES, JSON.stringify(data.actividades));
        }
        if (data.publicaciones) {
            localStorage.setItem(STORAGE_KEYS.PUBLICACIONES, JSON.stringify(data.publicaciones));
        }
        if (data.recordatorios) {
            localStorage.setItem(STORAGE_KEYS.RECORDATORIOS, JSON.stringify(data.recordatorios));
        }
    } catch (error) {
        console.error('Error al importar datos:', error);
        throw new Error('Formato de datos inválido');
    }
}

// ============================================
// LIMPIAR TODOS LOS DATOS
// ============================================

export function limpiarTodosDatos(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}
