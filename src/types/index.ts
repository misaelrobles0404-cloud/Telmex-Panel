// ============================================
// TIPOS DE DATOS PRINCIPALES
// ============================================

export type TipoServicio = 'linea_nueva' | 'portabilidad' | 'winback';
export type TipoCliente = 'residencial' | 'pyme';
export type EstadoPipeline = 'contactado' | 'interesado' | 'cotizacion' | 'cierre_programado' | 'vendido' | 'perdido';
export type Proveedor = 'totalplay' | 'izzi' | 'megacable' | 'axtel' | 'dish' | 'otro';

// ============================================
// CLIENTE
// ============================================

export interface Cliente {
    id: string;

    // Información básica
    nombre: string;
    noTT: string; // Número de teléfono
    noRef: string; // Número de referencia
    correo: string;

    // Dirección
    calle: string;
    colonia: string;
    cp: string;
    cd: string; // Ciudad
    estado: string;
    entreCalle1: string;
    entreCalle2: string;

    // Documentación
    ine: string;
    curp: string;
    usuario: string;

    // Tipo de servicio y clasificación
    tipoServicio: TipoServicio;
    tipoCliente: TipoCliente;

    // Paquete seleccionado
    paquete: string;
    clavePaquete: string;
    velocidad: number; // Mbps
    precioMensual: number;

    // Información de competencia (para portabilidad)
    tieneInternet: boolean;
    tieneTelefonoFijo: boolean;
    proveedorActual?: Proveedor;

    // Datos específicos de portabilidad
    numeroAPortar?: string;
    nipPortabilidad?: string;
    fechaVigencia?: string;
    formatoPortabilidad?: boolean;
    cartaBaja?: boolean;

    // Datos específicos de Winback (Megacable)
    estadoCuentaMegacable?: boolean;

    // Pipeline y seguimiento
    estadoPipeline: EstadoPipeline;
    fechaContacto: string;
    fechaUltimaActividad: string;
    proximoSeguimiento?: string;

    // Comisión
    comision: number; // 250 o 300

    // Notas
    notas: string;

    // Documentos adjuntos
    documentos: Documento[];

    // Actividades
    actividades: Actividad[];

    // Metadata
    creadoEn: string;
    actualizadoEn: string;
}

// ============================================
// DOCUMENTO
// ============================================

export type TipoDocumento = 'curp' | 'comprobante_domicilio' | 'ine' | 'estado_cuenta' | 'formato_portabilidad' | 'carta_baja' | 'otro';

export interface Documento {
    id: string;
    clienteId: string;
    tipo: TipoDocumento;
    nombre: string;
    url: string;
    fechaSubida: string;
    validado: boolean;
}

// ============================================
// ACTIVIDAD
// ============================================

export interface Actividad {
    id: string;
    clienteId: string;
    tipo: 'llamada' | 'whatsapp' | 'correo' | 'nota' | 'cambio_estado' | 'cita';
    descripcion: string;
    fecha: string;
    resultado?: string;
}

// ============================================
// PAQUETE TELMEX
// ============================================

export interface PaqueteTelmex {
    id: string;
    tipo: TipoCliente;
    velocidad: number; // Mbps
    precioPromo: number;
    precioNormal: number;
    incluye: string[];
    netflix: boolean;
    llamadasIlimitadas: boolean;
}

// ============================================
// PLANTILLA WHATSAPP
// ============================================

export interface PlantillaWhatsApp {
    id: string;
    nombre: string;
    categoria: 'prospeccion' | 'seguimiento' | 'cotizacion' | 'cierre' | 'postventa';
    tipoServicio?: TipoServicio;
    contenido: string;
    variables: string[]; // {nombre}, {proveedor}, {ahorro}, etc.
}

// ============================================
// PUBLICACIÓN
// ============================================

export interface Publicacion {
    id: string;
    titulo: string;
    plataforma: 'facebook' | 'instagram' | 'marketplace';
    fechaPublicacion: string;
    presupuesto: number;
    alcance?: number;
    interacciones?: number;
    leadsGenerados: number;
    urlPublicacion?: string;
    activa: boolean;
}

// ============================================
// BLOQUE DE TIEMPO (AGENDA)
// ============================================

export interface BloqueTiempo {
    id: string;
    horaInicio: string; // "09:00"
    horaFin: string; // "11:00"
    actividad: string;
    objetivo: string;
    icono: string;
    color: string;
}

// ============================================
// MÉTRICAS DEL DASHBOARD
// ============================================

export interface Metricas {
    // Leads
    leadsHoy: number;
    leadsSemana: number;
    leadsMes: number;

    // Conversiones
    tasaConversion: number;
    ventasHoy: number;
    ventasSemana: number;
    ventasMes: number;

    // Comisiones
    comisionesHoy: number;
    comisionesSemana: number;
    comisionesMes: number;

    // Pipeline
    contactados: number;
    interesados: number;
    cotizaciones: number;
    cierresProgramados: number;
    vendidos: number;
    perdidos: number;

    // Presupuesto publicitario
    presupuestoGastadoHoy: number;
    presupuestoGastadoMes: number;
    roi: number;
}

// ============================================
// RECORDATORIOS
// ============================================

export interface Recordatorio {
    id: string;
    titulo: string;
    fecha: string; // ISO string
    completado: boolean;
    prioridad: 'baja' | 'media' | 'alta';
}

// ============================================
// REQUISITOS POR TIPO DE SERVICIO
// ============================================

export interface Requisitos {
    tipoServicio: TipoServicio;
    documentos: string[];
    campos: string[];
}

export const REQUISITOS_SERVICIO: Record<TipoServicio, Requisitos> = {
    linea_nueva: {
        tipoServicio: 'linea_nueva',
        documentos: ['CURP', 'Comprobante de domicilio'],
        campos: ['Número de teléfono para registro', 'Número de teléfono de referencia']
    },
    portabilidad: {
        tipoServicio: 'portabilidad',
        documentos: ['CURP', 'Comprobante de domicilio', 'Formato de portabilidad', 'Carta de baja (opcional)'],
        campos: [
            'Número de teléfono para registro',
            'Número de teléfono de referencia',
            'Número a portar',
            'NIP-Portabilidad (marcar 051)',
            'Fecha de vigencia'
        ]
    },
    winback: {
        tipoServicio: 'winback',
        documentos: ['CURP', 'Comprobante de domicilio', 'Estado de cuenta Megacable'],
        campos: [
            'Número de teléfono para registro',
            'Número de teléfono de referencia',
            'Número a portar'
        ]
    }
};
