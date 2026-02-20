
export interface ClavePortal {
    ciudad: string;
    identificador: string;
    usuarios: {
        usuario: string;
        nombre: string;
    }[];
    tipo: 'LOCAL' | 'DIGITAL' | 'PYME';
}

export const CLAVES_PORTAL: ClavePortal[] = [
    {
        ciudad: 'NACIONAL (ACCESO ÚNICO)',
        identificador: '10000900',
        tipo: 'DIGITAL',
        usuarios: [
            { usuario: '337595', nombre: 'GUSTAVO ACEVEDO ZAMARRON' },
        ]
    }
];

export function obtenerClavePorCiudad(busqueda: string): ClavePortal | undefined {
    if (!busqueda) return undefined;

    // Normalizar búsqueda
    const term = busqueda.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Buscar coincidencia exacta o parcial
    const match = CLAVES_PORTAL.find(c => {
        const ciudadNorm = c.ciudad.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return ciudadNorm.includes(term) || term.includes(ciudadNorm);
    });

    if (match) return match;

    // Si no hay coincidencia, devolver la digital por defecto (como pidió el usuario)
    return CLAVES_PORTAL.find(c => c.tipo === 'DIGITAL');
}
