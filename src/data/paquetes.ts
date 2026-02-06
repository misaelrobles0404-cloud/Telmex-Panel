import { PaqueteTelmex } from '@/types';

// ============================================
// CATÁLOGO DE PAQUETES RESIDENCIALES
// ============================================

export const PAQUETES_RESIDENCIALES: PaqueteTelmex[] = [
    // INTERNET + LLAMADAS
    {
        id: 'res-80-all',
        tipo: 'residencial',
        velocidad: 80,
        precioPromo: 389,
        precioNormal: 389,
        incluye: ['Claro Video', 'Antivirus', 'Llamadas Ilimitadas', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'res-100-all',
        tipo: 'residencial',
        velocidad: 100,
        precioPromo: 435,
        precioNormal: 435,
        incluye: ['Claro Video', 'Antivirus', 'Llamadas Ilimitadas', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'res-150-all',
        tipo: 'residencial',
        velocidad: 150,
        precioPromo: 499,
        precioNormal: 499,
        incluye: ['Claro Video', 'Antivirus', 'Llamadas Ilimitadas', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'res-350-all',
        tipo: 'residencial',
        velocidad: 350,
        precioPromo: 649,
        precioNormal: 649,
        incluye: ['Claro Video', 'Antivirus', 'Llamadas Ilimitadas', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'res-500-all',
        tipo: 'residencial',
        velocidad: 500,
        precioPromo: 725,
        precioNormal: 725,
        incluye: ['Claro Video', 'Antivirus', 'Llamadas Ilimitadas', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'res-1000-all',
        tipo: 'residencial',
        velocidad: 1000,
        precioPromo: 1399,
        precioNormal: 1399,
        incluye: ['Claro Video', 'Antivirus', 'Llamadas Ilimitadas', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: true
    },
    // SOLO INTERNET
    {
        id: 'res-80-net',
        tipo: 'residencial',
        velocidad: 80,
        precioPromo: 349,
        precioNormal: 349,
        incluye: ['Claro Video', 'Antivirus', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'res-100-net',
        tipo: 'residencial',
        velocidad: 100,
        precioPromo: 399,
        precioNormal: 399,
        incluye: ['Claro Video', 'Antivirus', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'res-150-net',
        tipo: 'residencial',
        velocidad: 150,
        precioPromo: 449,
        precioNormal: 449,
        incluye: ['Claro Video', 'Antivirus', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'res-350-net',
        tipo: 'residencial',
        velocidad: 350,
        precioPromo: 549,
        precioNormal: 549,
        incluye: ['Claro Video', 'Antivirus', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'res-500-net',
        tipo: 'residencial',
        velocidad: 500,
        precioPromo: 649,
        precioNormal: 649,
        incluye: ['Claro Video', 'Antivirus', 'Claro drive'],
        netflix: false,
        llamadasIlimitadas: false
    },
    // PROMOS NETFLIX (Ejemplo base: 80 Megas + Netflix) - Se pueden añadir más combinaciones según necesidad
    {
        id: 'res-80-netflix',
        tipo: 'residencial',
        velocidad: 80,
        precioPromo: 389,
        precioNormal: 389,
        incluye: ['Netflix (Standard con anuncios)', 'Claro Video', 'Antivirus', 'Llamadas Ilimitadas'],
        netflix: true,
        llamadasIlimitadas: true
    }
];

// ============================================
// CATÁLOGO DE PAQUETES PYME
// ============================================

export const PAQUETES_PYME: PaqueteTelmex[] = [
    // INFINITUM NEGOCIO (INTERNET + LLAMADAS)
    {
        id: 'neg-80-all',
        tipo: 'pyme',
        velocidad: 80,
        precioPromo: 399,
        precioNormal: 399,
        incluye: ['Antivirus', 'Claro drive', 'Claro video', 'Llamadas Ilimitadas', 'Soluciones Negocio'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'neg-150-all',
        tipo: 'pyme',
        velocidad: 150,
        precioPromo: 549,
        precioNormal: 549,
        incluye: ['Antivirus', 'Claro drive', 'Claro video', 'Llamadas Ilimitadas'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'neg-250-all',
        tipo: 'pyme',
        velocidad: 250,
        precioPromo: 649,
        precioNormal: 649,
        incluye: ['Antivirus', 'Claro drive', 'Claro video', 'Llamadas Ilimitadas'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'neg-350-all',
        tipo: 'pyme',
        velocidad: 350,
        precioPromo: 799,
        precioNormal: 799,
        incluye: ['Antivirus', 'Claro drive', 'Claro video', 'Llamadas Ilimitadas'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'neg-500-all',
        tipo: 'pyme',
        velocidad: 500,
        precioPromo: 999,
        precioNormal: 999,
        incluye: ['Antivirus', 'Claro drive', 'Claro video', 'Llamadas Ilimitadas'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'neg-750-all',
        tipo: 'pyme',
        velocidad: 750,
        precioPromo: 1499,
        precioNormal: 1499,
        incluye: ['Antivirus', 'Claro drive', 'Claro video', 'Llamadas Ilimitadas'],
        netflix: false,
        llamadasIlimitadas: true
    },
    {
        id: 'neg-1000-all',
        tipo: 'pyme',
        velocidad: 1000,
        precioPromo: 2289,
        precioNormal: 2289,
        incluye: ['Antivirus', 'Claro drive', 'Claro video', 'Llamadas Ilimitadas'],
        netflix: false,
        llamadasIlimitadas: true
    },
    // SOLO INTERNET
    {
        id: 'neg-80-net',
        tipo: 'pyme',
        velocidad: 80,
        precioPromo: 349,
        precioNormal: 349,
        incluye: ['Antivirus', 'Claro drive', 'Claro video'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'neg-100-net',
        tipo: 'pyme',
        velocidad: 100,
        precioPromo: 399,
        precioNormal: 399,
        incluye: ['Antivirus', 'Claro drive', 'Claro video'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'neg-250-net',
        tipo: 'pyme',
        velocidad: 250,
        precioPromo: 499,
        precioNormal: 499,
        incluye: ['Antivirus', 'Claro drive', 'Claro video'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'neg-350-net',
        tipo: 'pyme',
        velocidad: 350,
        precioPromo: 549,
        precioNormal: 549,
        incluye: ['Antivirus', 'Claro drive', 'Claro video'],
        netflix: false,
        llamadasIlimitadas: false
    },
    {
        id: 'neg-500-net',
        tipo: 'pyme',
        velocidad: 500,
        precioPromo: 649,
        precioNormal: 649,
        incluye: ['Antivirus', 'Claro drive', 'Claro video'],
        netflix: false,
        llamadasIlimitadas: false
    }
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
