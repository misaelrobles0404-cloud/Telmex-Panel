
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
    // LOCALES
    {
        ciudad: 'NUEVO LAREDO',
        identificador: '10000900',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '328707', nombre: 'JOSE TRINIDAD MOLANO BELLO' },
            { usuario: '337660', nombre: 'JESUS AZAEL DOMINGUEZ ALVARADO' },
            { usuario: '338378', nombre: 'CECILIA MAGALY REYES VELAZQUEZ' },
        ]
    },
    {
        ciudad: 'PUEBLA',
        identificador: '2007402',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '335462', nombre: 'CARLOS SAENZ MARTINEZ' },
            { usuario: '338379', nombre: 'HECTOR ISAI LEAL VILLAFUERTE' },
        ]
    },
    {
        ciudad: 'GUADALAJARA',
        identificador: '2010200',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '328704', nombre: 'MARIA DE LOS ANGELES CANELA ESPINOZA' },
            { usuario: '338033', nombre: 'OSCAR GILBERTO GONZALEZ SEPULVEDA' },
            { usuario: '335460', nombre: 'OSVALDO ISMAEL OLVERA ALVAREZ' },
        ]
    },
    {
        ciudad: 'MERIDA',
        identificador: '2010012',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '332706', nombre: 'CARLOS ARMANDO CANELA SAENZ' },
            { usuario: '332705', nombre: 'GILBERTO PAVON SAENZ' },
            { usuario: '338034', nombre: 'ERICK GONZALEZ RENDON' },
        ]
    },
    {
        ciudad: 'LEON GUANAJUATO',
        identificador: '2007457',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '338036', nombre: 'OSCAR PESINA GUAJARDO' },
            { usuario: '333407', nombre: 'DEYSI ITZEL GODOY BAEZ' },
        ]
    },
    {
        ciudad: 'CD. JUAREZ',
        identificador: '10001523',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '331142', nombre: 'MANUEL ALEJANDRO TORRES OLVERA' },
        ]
    },
    {
        ciudad: 'QUERETARO',
        identificador: '2009164',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '333408', nombre: 'LUIS MARTINEZ MARTINEZ HERNANDEZ' },
            { usuario: '343720', nombre: 'ROBERTO MIGUEL VELAZQUEZ VENTURA' },
            { usuario: '343806', nombre: 'JOSEFINA JUDITH SOLIS CANELA' },
        ]
    },
    // DIGITAL
    {
        ciudad: 'DIGITAL - NACIONAL',
        identificador: '10000858',
        tipo: 'DIGITAL',
        usuarios: [
            { usuario: '322098', nombre: 'KEREM MICHELLE GAYTAN HERNANDEZ' },
            { usuario: '331660', nombre: 'CLAUDIA MARIBEL GOMEZ FIGUEROA' },
            { usuario: '337823', nombre: 'OMAR ALEJANDRO HERNANDEZ' },
            { usuario: '337821', nombre: 'EDUARDO SALAS GONSALEZ' },
            { usuario: '338381', nombre: 'LUIS ANDRES CRUZ DE LA CRUZ' },
            { usuario: '338382', nombre: 'CARLOS DANIEL GARZA TORRES' },
        ]
    },
    // OTROS LOCALES
    {
        ciudad: 'IRAPUATO',
        identificador: '2007844',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '338418', nombre: 'JESUS FABIAN VILLALOBOS AMADOR' },
        ]
    },
    {
        ciudad: 'TOLUCA',
        identificador: '2004606',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '338423', nombre: 'BRANDON TAPIA TREJO' },
        ]
    },
    {
        ciudad: 'MORELOS',
        identificador: '2010506',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '338424', nombre: 'JUANA ELIZABETH RUBIO MALDONADO' },
        ]
    },
    {
        ciudad: 'ACAPULCO',
        identificador: '2012085',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '333406', nombre: 'HUGO SAMUEL CABRALES MORALES' },
        ]
    },
    {
        ciudad: 'VERACRUZ',
        identificador: '2011300',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '342909', nombre: 'VICTOR EDUARDO MENDEZ CRUZ' },
        ]
    },
    {
        ciudad: 'TEXCOCO',
        identificador: '2011558',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '343721', nombre: 'ISDARELY SAIDALY GARCIA FERRETIZ' },
        ]
    },
    {
        ciudad: 'ECATEPEC',
        identificador: '2010489',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '343719', nombre: 'OMAR ALEJANDRO ALOR MARTINEZ' },
        ]
    },
    {
        ciudad: 'TECAMAC',
        identificador: '2011615',
        tipo: 'LOCAL',
        usuarios: [
            { usuario: '343722', nombre: 'NOE CONTRERAS ORTIZ' },
        ]
    },
    // PYME
    {
        ciudad: 'PYME-COMERCIAL',
        identificador: '10001386',
        tipo: 'PYME',
        usuarios: [
            { usuario: '347995', nombre: 'OSWALDO BARRADAS SANCHEZ' },
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
