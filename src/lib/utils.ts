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

export function calcularMetricas(clientesInput?: Cliente[], perfiles?: any[]): Metricas {
    const clientes = clientesInput || [];
    const hoy = startOfDay(new Date());
    const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
    const inicioMes = startOfMonth(new Date());

    // Ventas Programadas Hoy: Cierres programados con fecha de seguimiento hoy
    const ventasProgramadasHoy = clientes.filter(c => {
        if (c.estado_pipeline !== 'cierre_programado' || !c.proximo_seguimiento) return false;
        const fechaSeg = startOfDay(new Date(c.proximo_seguimiento));
        return fechaSeg.getTime() === hoy.getTime();
    }).length;

    // Ventas Reales (Instalaciones)
    // Usamos fecha_instalacion para ventas, si no existe usamos actualizado_en como fallback
    const ventasSemana = clientes.filter(c => {
        if (c.estado_pipeline !== 'vendido') return false;
        const fechaVenta = new Date(c.fecha_instalacion || c.actualizado_en);
        return isAfter(fechaVenta, inicioSemana);
    }).length;

    const ventasMes = clientes.filter(c => {
        if (c.estado_pipeline !== 'vendido') return false;
        const fechaVenta = new Date(c.fecha_instalacion || c.actualizado_en);
        return isAfter(fechaVenta, inicioMes);
    }).length;

    const ventasHoy = clientes.filter(c => {
        if (c.estado_pipeline !== 'vendido') return false;
        const fechaVenta = startOfDay(new Date(c.fecha_instalacion || c.actualizado_en));
        return fechaVenta.getTime() === hoy.getTime();
    }).length;

    // Calcular Promotor Top del Mes (por instalaciones)
    const ventasPorPromotor: Record<string, number> = {};
    clientes.filter(c => {
        if (c.estado_pipeline !== 'vendido') return false;
        const fechaVenta = new Date(c.fecha_instalacion || c.actualizado_en);
        return isAfter(fechaVenta, inicioMes);
    }).forEach(c => {
        let key = c.usuario;

        // Si no hay usuario (email), intentar sacarlo del user_id usando perfiles
        if (!key && c.user_id && perfiles) {
            const pf = perfiles.find(p => p.id === c.user_id);
            if (pf) key = pf.email;
        }

        if (!key) key = 'Desconocido';
        ventasPorPromotor[key] = (ventasPorPromotor[key] || 0) + 1;
    });

    let topEmail = '';
    let maxVentas = 0;
    Object.entries(ventasPorPromotor).forEach(([email, total]) => {
        // Ignorar 'Desconocido' para el Top si hay otros candidatos
        if (email === 'Desconocido' && Object.keys(ventasPorPromotor).length > 1) return;

        if (total > maxVentas) {
            maxVentas = total;
            topEmail = email;
        }
    });

    let nombrePromotorTop = topEmail === 'Desconocido' ? 'Desconocido' : topEmail.split('@')[0];
    if (perfiles && topEmail && topEmail !== 'Desconocido') {
        const pf = perfiles.find(p => p.email === topEmail);
        if (pf) nombrePromotorTop = pf.nombre_completo;
    }

    // Comisiones (Mes)
    const comisionesMes = clientes
        .filter(c => {
            if (c.estado_pipeline !== 'vendido') return false;
            return isAfter(new Date(c.fecha_instalacion || c.actualizado_en), inicioMes);
        })
        .reduce((sum, c) => sum + (c.comision || 0), 0);

    // Old metrics fallback/compatibility
    const clientesMes = clientes.filter(c => isAfter(new Date(c.fecha_contacto), inicioMes));

    return {
        leadsHoy: clientes.filter(c => isAfter(new Date(c.fecha_contacto), hoy)).length,
        leadsSemana: clientes.filter(c => isAfter(new Date(c.fecha_contacto), inicioSemana)).length,
        leadsMes: clientesMes.length,
        tasaConversion: clientes.length > 0 ? (clientes.filter(c => c.estado_pipeline === 'vendido').length / clientes.length) * 100 : 0,
        ventasHoy,
        ventasSemana,
        ventasMes,
        comisionesHoy: 0, // Not requested but part of interface
        comisionesSemana: 0,
        comisionesMes,
        contactados: clientes.filter(c => c.estado_pipeline === 'contactado').length,
        interesados: clientes.filter(c => c.estado_pipeline === 'interesado').length,
        cierresProgramados: clientes.filter(c => c.estado_pipeline === 'cierre_programado').length,
        vendidos: clientes.filter(c => c.estado_pipeline === 'vendido').length,
        sin_cobertura: clientes.filter(c => c.estado_pipeline === 'sin_cobertura').length,
        ventasProgramadasHoy,
        promotorTop: topEmail ? { nombre: nombrePromotorTop, total: maxVentas } : undefined
    };
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
