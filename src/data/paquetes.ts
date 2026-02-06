import { PaqueteTelmex } from '@/types';

// ============================================
// CATÁLOGO DE PAQUETES RESIDENCIALES
// ============================================

export const PAQUETES_RESIDENCIALES: PaqueteTelmex[] = [
    {
        id: 'res-80',
        tipo: 'residencial',
        velocidad: 80,
        precioPromo: 375,
        precioNormal: 425,
        incluye: ['Netflix', 'Claro Video', 'Antivirus'],
        netflix: true,
        llamadasIlimitadas: false
    },
    {
        id: 'res-100',
        tipo: 'residencial',
        velocidad: 100,
        precioPromo: 425,
        precioNormal: 475,
        incluye: ['Netflix', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    },
    {
        id: 'res-150',
        tipo: 'residencial',
        velocidad: 150,
        precioPromo: 475,
        precioNormal: 525,
        incluye: ['Netflix', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    },
    {
        id: 'res-200',
        tipo: 'residencial',
        velocidad: 200,
        precioPromo: 525,
        precioNormal: 575,
        incluye: ['Netflix', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    },
    {
        id: 'res-300',
        tipo: 'residencial',
        velocidad: 300,
        precioPromo: 625,
        precioNormal: 675,
        incluye: ['Netflix', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    },
    {
        id: 'res-500',
        tipo: 'residencial',
        velocidad: 500,
        precioPromo: 725,
        precioNormal: 775,
        incluye: ['Netflix', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    },
    {
        id: 'res-600',
        tipo: 'residencial',
        velocidad: 600,
        precioPromo: 825,
        precioNormal: 875,
        incluye: ['Netflix', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    },
    {
        id: 'res-1000',
        tipo: 'residencial',
        velocidad: 1000,
        precioPromo: 1025,
        precioNormal: 1075,
        incluye: ['Netflix', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    }
];

// ============================================
// CATÁLOGO DE PAQUETES PYME (Placeholder)
// ============================================

export const PAQUETES_PYME: PaqueteTelmex[] = [
    // Se agregarán cuando el usuario proporcione la información
];

// ============================================
// FUNCIÓN PARA OBTENER PAQUETE POR ID
// ============================================

export function obtenerPaquete(id: string): PaqueteTelmex | undefined {
    return [...PAQUETES_RESIDENCIALES, ...PAQUETES_PYME].find(p => p.id === id);
}

// ============================================
// FUNCIÓN PARA OBTENER PAQUETES POR TIPO
// ============================================

export function obtenerPaquetesPorTipo(tipo: 'residencial' | 'pyme'): PaqueteTelmex[] {
    if (tipo === 'residencial') return PAQUETES_RESIDENCIALES;
    return PAQUETES_PYME;
}
