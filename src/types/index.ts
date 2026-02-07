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
    id: string; // Will use UUID
    user_id?: string;

    // Información básica
    nombre: string;
    no_tt: string; // Número de teléfono (antes noTT)
    no_ref: string; // Número de referencia (antes noRef)
    correo: string;

    // Dirección
    calle: string;
    numero_exterior?: string;
    numero_interior?: string;
    colonia: string;
    cp: string;
    cd: string; // Ciudad
    estado: string;
    entre_calle_1: string;
    entre_calle_2: string;

    // Documentación
    ine: string;
    curp: string;
    usuario: string;

    // Tipo de servicio y clasificación
    tipo_servicio: TipoServicio;
    tipo_cliente: TipoCliente;

    // Paquete seleccionado
    paquete: string;
    clave_paquete: string;
    velocidad: number; // Mbps
    precio_mensual: number;

    // Información de competencia (para portabilidad)
    tiene_internet: boolean;
    tiene_telefono_fijo: boolean;
    proveedor_actual?: Proveedor;

    // Datos específicos de portabilidad
    numero_a_portar?: string;
    nip_portabilidad?: string;
    fecha_vigencia?: string;
    formato_portabilidad?: boolean;
    carta_baja?: boolean;

    // Datos específicos de Winback (Megacable)
    estado_cuenta_megacable?: boolean;

    // SIAC
    folio_siac?: string;

    // Campaña de origen
    campana_id?: string;

    // Pipeline y seguimiento
    estado_pipeline: EstadoPipeline;
    fecha_contacto: string;
    fecha_ultima_actividad: string;
    proximo_seguimiento?: string;

    // Comisión
    comision: number; // 250 o 300

    // Notas
    notas: string;

    // Metadata
    creado_en: string;
    actualizado_en: string;
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
    id: string; // Will use UUID
    user_id?: string;
    titulo: string;
    plataforma: 'facebook' | 'instagram' | 'marketplace';
    fecha_publicacion: string;
    presupuesto: number;
    alcance?: number;
    interacciones?: number;
    leads_generados: number;
    url_publicacion?: string;
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
        documentos: ['Identificación Oficial (INE, CURP, Pasaporte)', 'Comprobante de Domicilio', 'Correo Electrónico', 'Número de Celular'],
        campos: ['Nombre Completo', 'Celular de contacto', 'Correo Electrónico', '2 Números de Referencia (Adicionales)']
    },
    portabilidad: {
        tipoServicio: 'portabilidad',
        documentos: ['Identificación Oficial', 'Comprobante de Domicilio', 'Formato de Portabilidad', 'Carta de baja (opcional)'],
        campos: [
            'Número de Teléfono a Portar',
            'NIP de Portabilidad (Marcar 051)',
            'Fecha de vigencia del NIP',
            'Formato de Portabilidad firmado'
        ]
    },
    winback: {
        tipoServicio: 'winback',
        documentos: ['Identificación Oficial', 'Comprobante de Domicilio', 'Estado de cuenta Megacable'],
        campos: [
            'Número de teléfono a recuperar (Opcional)',
            'Estado de Cuenta Megacable (Evidencia)'
        ]
    }
};
