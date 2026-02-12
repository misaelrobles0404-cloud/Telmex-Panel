import { Cliente, TipoServicio, Metricas } from '@/types';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';

// ============================================
// CLASIFICACIÓN DE SERVICIO
// ============================================

export function clasificarServicio(
    tieneInternet: boolean,
    tieneTelefonoFijo: boolean,
    proveedorActual?: string
): TipoServicio {
    // Winback solo para Megacable
    if (proveedorActual?.toLowerCase() === 'megacable' && tieneInternet) {
        return 'winback';
    }

    // Portabilidad: tiene internet + teléfono fijo
    if (tieneInternet && tieneTelefonoFijo) {
        return 'portabilidad';
    }

    // Línea nueva: solo internet o ninguno
    return 'linea_nueva';
}

// ============================================
// CÁLCULO DE COMISIÓN
// ============================================

export function calcularComision(tipoServicio: TipoServicio): number {
    switch (tipoServicio) {
        case 'linea_nueva':
            return 250;
        case 'portabilidad':
        case 'winback':
            return 300;
        default:
            return 0;
    }
}

// ============================================
// FORMATEO DE MONEDA
// ============================================

export function formatearMoneda(cantidad: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(cantidad);
}

// ============================================
// FORMATEO DE FECHA
// ============================================

export function formatearFecha(fecha: string | Date): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return format(date, 'dd/MM/yyyy');
}

export function formatearFechaHora(fecha: string | Date): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return format(date, 'dd/MM/yyyy HH:mm');
}

// ============================================
// GENERACIÓN DE ID ÚNICO
// ============================================

export function generarId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// CÁLCULO DE MÉTRICAS
// ============================================

export function calcularMetricas(clientesInput?: Cliente[]): Metricas {
    const clientes = clientesInput || [];
    const hoy = startOfDay(new Date());
    const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
    const inicioMes = startOfMonth(new Date());

    // Filtrar por fechas
    const clientesHoy = clientes.filter(c =>
        isAfter(new Date(c.fecha_contacto), hoy)
    );
    const clientesSemana = clientes.filter(c =>
        isAfter(new Date(c.fecha_contacto), inicioSemana)
    );
    const clientesMes = clientes.filter(c =>
        isAfter(new Date(c.fecha_contacto), inicioMes)
    );

    // Ventas
    const ventasHoy = clientesHoy.filter(c => c.estado_pipeline === 'vendido').length;
    const ventasSemana = clientesSemana.filter(c => c.estado_pipeline === 'vendido').length;
    const ventasMes = clientesMes.filter(c => c.estado_pipeline === 'vendido').length;

    // Comisiones
    const comisionesHoy = clientesHoy
        .filter(c => c.estado_pipeline === 'vendido')
        .reduce((sum, c) => sum + c.comision, 0);
    const comisionesSemana = clientesSemana
        .filter(c => c.estado_pipeline === 'vendido')
        .reduce((sum, c) => sum + c.comision, 0);
    const comisionesMes = clientesMes
        .filter(c => c.estado_pipeline === 'vendido')
        .reduce((sum, c) => sum + c.comision, 0);

    // Pipeline
    const contactados = clientes.filter(c => c.estado_pipeline === 'contactado').length;
    const interesados = clientes.filter(c => c.estado_pipeline === 'interesado').length;
    const cierresProgramados = clientes.filter(c => c.estado_pipeline === 'cierre_programado').length;
    const vendidos = clientes.filter(c => c.estado_pipeline === 'vendido').length;
    const sin_cobertura = clientes.filter(c => c.estado_pipeline === 'sin_cobertura').length;

    // Tasa de conversión
    const totalLeads = clientes.length;
    const tasaConversion = totalLeads > 0 ? (vendidos / totalLeads) * 100 : 0;

    return {
        leadsHoy: clientesHoy.length,
        leadsSemana: clientesSemana.length,
        leadsMes: clientesMes.length,
        tasaConversion,
        ventasHoy,
        ventasSemana,
        ventasMes,
        comisionesHoy,
        comisionesSemana,
        comisionesMes,
        contactados,
        interesados,
        cierresProgramados,
        vendidos,
        sin_cobertura,
        presupuestoGastadoHoy: 20, // Placeholder
        presupuestoGastadoMes: 0, // Placeholder
        roi: 0, // Placeholder
    };
}

// ============================================
// ESTADÍSTICAS DE CAMPAÑAS
// ============================================

export function calcularEstadisticasCampana(campanasInput: any[], clientesInput: Cliente[]) {
    const campanas = campanasInput || [];
    const clientes = clientesInput || [];
    return campanas.map(campana => {
        // Leads reales vinculados
        const leads = clientes.filter(c => c.campana_id === campana.id).length;

        // Simulación de Alcance y Clicks basada en el presupuesto diario y días activa
        // Manejo defensivo: asegurar que el presupuesto sea un número y no 0 para el factor
        const presupuestoSeguro = Number(campana.presupuesto) || 0;
        const factorRendimiento = presupuestoSeguro > 0 ? presupuestoSeguro / 35 : 0;
        const diasActiva = campana.activa ? 1 : 0.5;

        // Validar que el factor sea un número finito
        const factorFinal = isFinite(factorRendimiento) ? factorRendimiento : 0;

        const alcanceSimulado = Math.floor(1200 * factorFinal * (leads > 0 ? leads : 1) * (Math.random() * 0.5 + 0.8));
        const clicksSimulados = Math.floor(40 * factorFinal * (leads > 0 ? leads : 1) * (Math.random() * 0.4 + 0.7));

        return {
            ...campana,
            alcance: isNaN(alcanceSimulado) ? 0 : alcanceSimulado,
            interacciones: isNaN(clicksSimulados) ? 0 : clicksSimulados,
            leads_generados: leads
        };
    });
}

// ============================================
// VALIDACIÓN DE REQUISITOS
// ============================================

export function validarRequisitos(cliente: Partial<Cliente>): string[] {
    const errores: string[] = [];

    // Campos básicos
    if (!cliente.nombre?.trim()) errores.push('Nombre es requerido');
    if (!cliente.no_tt?.trim()) errores.push('Número de teléfono es requerido');
    if (!cliente.correo?.trim()) errores.push('Correo es requerido');
    if (!cliente.curp?.trim()) errores.push('CURP es requerido');

    // Dirección
    if (!cliente.calle?.trim()) errores.push('Calle es requerida');
    if (!cliente.colonia?.trim()) errores.push('Colonia es requerida');
    if (!cliente.cp?.trim()) errores.push('Código postal es requerido');
    if (!cliente.cd?.trim()) errores.push('Ciudad es requerida');
    if (!cliente.estado?.trim()) errores.push('Estado es requerido');

    // Requisitos específicos por tipo de servicio
    if (cliente.tipo_servicio === 'portabilidad') {
        if (!cliente.numero_a_portar?.trim()) errores.push('Número a portar es requerido');
        if (!cliente.nip_portabilidad?.trim()) errores.push('NIP de portabilidad es requerido');
    }

    if (cliente.tipo_servicio === 'winback') {
        if (!cliente.numero_a_portar?.trim()) errores.push('Número a portar es requerido');
    }

    return errores;
}

// ============================================
// UTILIDADES DE TEXTO
// ============================================

export function capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

export function truncar(texto: string, longitud: number): string {
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
}
