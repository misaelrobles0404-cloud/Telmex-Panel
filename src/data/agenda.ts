import { BloqueTiempo } from '@/types';

// ============================================
// BLOQUES DE TIEMPO DE LA AGENDA
// ============================================

export const BLOQUES_TIEMPO: BloqueTiempo[] = [
    {
        id: 'bloque-1',
        horaInicio: '09:00',
        horaFin: '11:00',
        actividad: 'Gestión de Redes',
        objetivo: 'Publicar en Marketplace y grupos. Responder mensajes de la noche anterior.',
        icono: '🌐',
        color: '#3B82F6'
    },
    {
        id: 'bloque-2',
        horaInicio: '11:00',
        horaFin: '13:00',
        actividad: 'Prospección de Aliados',
        objetivo: 'Contactar negocios (técnicos de PC, inmobiliarias) por WhatsApp o llamada.',
        icono: '📞',
        color: '#8B5CF6'
    },
    {
        id: 'bloque-3',
        horaInicio: '13:00',
        horaFin: '14:00',
        actividad: 'Comida',
        objetivo: 'Descanso.',
        icono: '🍔',
        color: '#10B981'
    },
    {
        id: 'bloque-4',
        horaInicio: '14:00',
        horaFin: '16:00',
        actividad: 'Seguimiento y Cierre',
        objetivo: 'Llamar a los interesados que "lo iban a pensar" para cerrar la venta.',
        icono: '📄',
        color: '#F59E0B'
    },
    {
        id: 'bloque-5',
        horaInicio: '16:00',
        horaFin: '17:00',
        actividad: 'Optimización de Anuncios',
        objetivo: 'Revisar qué publicación funcionó mejor y ajustar tus $20 de publicidad.',
        icono: '📊',
        color: '#EF4444'
    }
];

// ============================================
// FUNCIÓN PARA OBTENER BLOQUE ACTUAL
// ============================================

export function obtenerBloqueActual(): BloqueTiempo | null {
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    for (const bloque of BLOQUES_TIEMPO) {
        const [horaInicio, minInicio] = bloque.horaInicio.split(':').map(Number);
        const [horaFin, minFin] = bloque.horaFin.split(':').map(Number);

        const minutosInicio = horaInicio * 60 + minInicio;
        const minutosFin = horaFin * 60 + minFin;

        if (horaActual >= minutosInicio && horaActual < minutosFin) {
            return bloque;
        }
    }

    return null;
}

// ============================================
// FUNCIÓN PARA OBTENER PRÓXIMO BLOQUE
// ============================================

export function obtenerProximoBloque(): BloqueTiempo | null {
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    for (const bloque of BLOQUES_TIEMPO) {
        const [horaInicio, minInicio] = bloque.horaInicio.split(':').map(Number);
        const minutosInicio = horaInicio * 60 + minInicio;

        if (horaActual < minutosInicio) {
            return bloque;
        }
    }

    return null;
}
