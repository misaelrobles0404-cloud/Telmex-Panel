import { Cliente, TipoServicio, Metricas } from '@/types';
import { obtenerClientes } from './storage';
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

export function calcularMetricas(): Metricas {
    const clientes = obtenerClientes();
    const hoy = startOfDay(new Date());
    const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
    const inicioMes = startOfMonth(new Date());

    // Filtrar por fechas
    const clientesHoy = clientes.filter(c =>
        isAfter(new Date(c.fechaContacto), hoy)
    );
    const clientesSemana = clientes.filter(c =>
        isAfter(new Date(c.fechaContacto), inicioSemana)
    );
    const clientesMes = clientes.filter(c =>
        isAfter(new Date(c.fechaContacto), inicioMes)
    );

    // Ventas
    const ventasHoy = clientesHoy.filter(c => c.estadoPipeline === 'vendido').length;
    const ventasSemana = clientesSemana.filter(c => c.estadoPipeline === 'vendido').length;
    const ventasMes = clientesMes.filter(c => c.estadoPipeline === 'vendido').length;

    // Comisiones
    const comisionesHoy = clientesHoy
        .filter(c => c.estadoPipeline === 'vendido')
        .reduce((sum, c) => sum + c.comision, 0);
    const comisionesSemana = clientesSemana
        .filter(c => c.estadoPipeline === 'vendido')
        .reduce((sum, c) => sum + c.comision, 0);
    const comisionesMes = clientesMes
        .filter(c => c.estadoPipeline === 'vendido')
        .reduce((sum, c) => sum + c.comision, 0);

    // Pipeline
    const contactados = clientes.filter(c => c.estadoPipeline === 'contactado').length;
    const interesados = clientes.filter(c => c.estadoPipeline === 'interesado').length;
    // const cotizaciones = clientes.filter(c => c.estadoPipeline === 'cotizacion').length; // Removed
    const cotizaciones = 0; // Placeholder to avoid breaking interface
    const cierresProgramados = clientes.filter(c => c.estadoPipeline === 'cierre_programado').length;
    const vendidos = clientes.filter(c => c.estadoPipeline === 'vendido').length;
    const perdidos = clientes.filter(c => c.estadoPipeline === 'perdido').length;

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
        cotizaciones,
        cierresProgramados,
        vendidos,
        perdidos,
        presupuestoGastadoHoy: 20, // Placeholder
        presupuestoGastadoMes: 0, // Placeholder
        roi: 0, // Placeholder
    };
}

// ============================================
// ESTADÍSTICAS DE CAMPAÑAS
// ============================================

export function calcularEstadisticasCampana(campanas: any[], clientes: Cliente[]) {
    return campanas.map(campana => {
        // Leads reales vinculados
        const leads = clientes.filter(c => c.campanaId === campana.id).length;

        // Simulación de Alcance y Clicks basada en el presupuesto diario y días activa
        // Asumimos un rendimiento promedio de mercado para anuncios inmobiliarios/servicios locales
        // Alcance: ~1200 personas por cada $35 diarios
        // Clicks: ~40 clicks (3.3% CTR) por cada $35 diarios

        const factorRendimiento = campana.presupuesto / 35;
        const diasActiva = campana.activa ? 1 : 0.5; // Simplificación para demo

        const alcanceSimulado = Math.floor(1200 * factorRendimiento * (leads > 0 ? leads : 1) * (Math.random() * 0.5 + 0.8));
        const clicksSimulados = Math.floor(40 * factorRendimiento * (leads > 0 ? leads : 1) * (Math.random() * 0.4 + 0.7));

        return {
            ...campana,
            alcance: alcanceSimulado,
            interacciones: clicksSimulados,
            leadsGenerados: leads
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
    if (!cliente.noTT?.trim()) errores.push('Número de teléfono es requerido');
    if (!cliente.correo?.trim()) errores.push('Correo es requerido');
    if (!cliente.curp?.trim()) errores.push('CURP es requerido');

    // Dirección
    if (!cliente.calle?.trim()) errores.push('Calle es requerida');
    if (!cliente.colonia?.trim()) errores.push('Colonia es requerida');
    if (!cliente.cp?.trim()) errores.push('Código postal es requerido');
    if (!cliente.cd?.trim()) errores.push('Ciudad es requerida');
    if (!cliente.estado?.trim()) errores.push('Estado es requerido');

    // Requisitos específicos por tipo de servicio
    if (cliente.tipoServicio === 'portabilidad') {
        if (!cliente.numeroAPortar?.trim()) errores.push('Número a portar es requerido');
        if (!cliente.nipPortabilidad?.trim()) errores.push('NIP de portabilidad es requerido');
    }

    if (cliente.tipoServicio === 'winback') {
        if (!cliente.numeroAPortar?.trim()) errores.push('Número a portar es requerido');
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
