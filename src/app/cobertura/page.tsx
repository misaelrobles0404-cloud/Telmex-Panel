'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Clock, Globe } from 'lucide-react';

// Mapa de zonas horarias por Estado (Aproximación para México)
const obtenerZonaHoraria = (estado: string) => {
    // Normalizamos el texto (quitar acentos, minusculas)
    const estadoNorm = estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Zona Noroeste (UTC-8)
    if (estadoNorm.includes('baja california') && !estadoNorm.includes('sur')) return 'America/Tijuana';

    // Zona Pacífico (UTC-7)
    if (estadoNorm.includes('baja california sur') ||
        estadoNorm.includes('chihuahua') ||
        estadoNorm.includes('nayarit') ||
        estadoNorm.includes('sinaloa') ||
        estadoNorm.includes('sonora')) return 'America/Mazatlan';

    // Zona Sureste (UTC-5)
    if (estadoNorm.includes('quintana roo')) return 'America/Cancun';

    // Zona Centro (UTC-6) - Resto del país
    return 'America/Mexico_City';
};

// Mapa de claves LADA principales de México
const MAPA_LADAS: Record<string, string> = {
    '55': 'Ciudad de México y Área Metropolitana',
    '33': 'Guadalajara, Jalisco',
    '81': 'Monterrey, Nuevo León',
    '222': 'Puebla, Puebla',
    '442': 'Querétaro, Querétaro',
    '998': 'Cancún, Quintana Roo',
    '664': 'Tijuana, Baja California',
    '477': 'León, Guanajuato',
    '722': 'Toluca, Estado de México',
    '444': 'San Luis Potosí, SLP',
    '999': 'Mérida, Yucatán',
    '614': 'Chihuahua, Chihuahua',
    '844': 'Saltillo, Coahuila',
    '311': 'Tepic, Nayarit',
    '951': 'Oaxaca, Oaxaca',
    '229': 'Veracruz, Veracruz',
    '833': 'Tampico, Tamaulipas',
    '322': 'Puerto Vallarta, Jalisco',
    '612': 'La Paz, Baja California Sur',
    '686': 'Mexicali, Baja California',
    '449': 'Aguascalientes, Ags.',
    '443': 'Morelia, Michoacán',
    '777': 'Cuernavaca, Morelos',
    '744': 'Acapulco, Guerrero',
    '271': 'Córdoba, Veracruz',
    '272': 'Orizaba, Veracruz',
    '618': 'Durango, Durango',
    '667': 'Culiacán, Sinaloa',
    '662': 'Hermosillo, Sonora',
    '867': 'Nuevo Laredo, Tamaulipas',
    '868': 'Matamoros, Tamaulipas',
    '899': 'Reynosa, Tamaulipas',
    '921': 'Coatzacoalcos, Veracruz',
    '981': 'Campeche, Campeche',
    '961': 'Tuxtla Gutiérrez, Chiapas',
    '461': 'Celaya, Guanajuato',
    '462': 'Irapuato, Guanajuato',
    '473': 'Guanajuato, Gto.',
    '228': 'Xalapa, Veracruz',
    '771': 'Pachuca, Hidalgo',
    '427': 'San Juan del Río, Qro.',
    '656': 'Ciudad Juárez, Chihuahua',
    '753': 'Lázaro Cárdenas, Michoacán',
    '492': 'Zacatecas, Zac.',
    '312': 'Colima, Colima',
    '938': 'Ciudad del Carmen, Camp.',
    '747': 'Chilpancingo, Guerrero',
    '967': 'San Cristóbal de las Casas, Chis.',
};

export default function CoberturaPage() {
    const [cp, setCp] = useState('');
    const [calle, setCalle] = useState('');
    const [numero, setNumero] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [resultado, setResultado] = useState<any>(null);
    const [horaLocal, setHoraLocal] = useState('');

    // Estados para el buscador de LADA
    const [lada, setLada] = useState('');
    const [resultadoLada, setResultadoLada] = useState('');

    // Lógica de búsqueda de LADA automática
    useEffect(() => {
        if (lada.length >= 2) {
            // Primero checamos las de 2 dígitos (CDMX, GDL, MTY)
            const lada2 = lada.slice(0, 2);
            if (['55', '33', '81'].includes(lada2)) {
                setResultadoLada(MAPA_LADAS[lada2]);
                return;
            }

            // Si no, checamos las de 3 dígitos
            if (lada.length === 3) {
                const region = MAPA_LADAS[lada];
                setResultadoLada(region || 'LADA no reconocida o poco común');
            } else {
                setResultadoLada('');
            }
        } else {
            setResultadoLada('');
        }
    }, [lada]);

    // Actualizar el reloj cada segundo si hay resultado
    useEffect(() => {
        if (!resultado?.zonaHoraria) return;

        const ticket = setInterval(() => {
            const ahora = new Date();
            // Formatear hora según la zona horaria del estado
            const horaStr = ahora.toLocaleTimeString('es-MX', {
                timeZone: resultado.zonaHoraria,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            setHoraLocal(horaStr);
        }, 1000);

        return () => clearInterval(ticket);
    }, [resultado]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cp.length !== 5) {
            alert('Por favor ingresa un código postal válido de 5 dígitos.');
            return;
        }

        setBuscando(true);
        setResultado(null);
        setHoraLocal('');

        try {
            // Usando Nominatim (OpenStreetMap) para obtener datos precisos y sin ofuscación
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?postalcode=${cp}&country=Mexico&format=json&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'TelmexPanel/1.0 (misaelrobles0404@gmail.com)'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();

                if (data.length === 0) {
                    alert("No se encontró información para este Código Postal.");
                    return;
                }

                // Nominatim devuelve un array de posibles ubicaciones, tomamos la más relevante
                const info = data[0].address;

                const estado = info.state || '';
                const municipio = info.county || info.municipality || info.city_district || '';
                const ciudad = info.city || info.town || info.village || municipio || '';
                const colonia = info.neighbourhood || info.suburb || info.quarter || '';
                const pais = info.country || 'México';

                const zonaHoraria = obtenerZonaHoraria(estado);

                // Calculamos la hora inicial inmediatamente
                const ahora = new Date();
                const horaStr = ahora.toLocaleTimeString('es-MX', {
                    timeZone: zonaHoraria,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                setHoraLocal(horaStr);

                setResultado({
                    cp: cp,
                    estado: estado,
                    calle: calle,
                    numero: numero,
                    colonia: colonia,
                    ciudad: ciudad,
                    municipio: municipio,
                    pais: pais,
                    zonaHoraria: zonaHoraria
                });
            } else {
                alert("No se encontró información para este Código Postal.");
            }

        } catch (error) {
            console.error("Error al buscar CP", error);
            alert("Hubo un error de conexión.");
        } finally {
            setBuscando(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="text-telmex-blue" />
                    Verificador de Cobertura y Ubicación
                </h1>
                <p className="text-gray-600 mt-2">
                    Consulta la ubicación exacta (Colonia, Ciudad, Estado) y la hora local de tus clientes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulario de Búsqueda */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Datos del Domicilio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Botón de mensaje rápido */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                            <p className="text-xs text-blue-700 font-medium mb-2 uppercase tracking-wide">Mensaje para el Cliente</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full text-xs bg-white hover:bg-white/80 border-blue-200 text-blue-700 shadow-sm"
                                onClick={() => {
                                    const mensaje = `¡Hola! 👋 Gracias por contactar a TELMEX. Para decirte exactamente qué promociones y qué velocidad de Fibra Óptica llegan a tu casa, ¿me podrías proporcionar estos dos datos?\n\n📍 **Código Postal:**\n🏠 **Calle y Número:**\n\nEn cuanto me los pases, verifico tu cobertura en el sistema y te doy respuesta inmediata. 😊`;
                                    navigator.clipboard.writeText(mensaje);
                                    alert('¡Mensaje copiado! Pégalo en el WhatsApp del cliente.');
                                }}
                            >
                                <span className="mr-2">💬</span> Copiar solicitud de datos
                            </Button>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-4">
                            <Input
                                label="Código Postal"
                                placeholder="Ej. 06500"
                                value={cp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                                    setCp(val);
                                }}
                                required
                            />

                            <Input
                                label="Calle"
                                placeholder="Ej. Av. Reforma"
                                value={calle}
                                onChange={(e) => setCalle(e.target.value)}
                                required
                            />

                            <Input
                                label="Número"
                                placeholder="Ej. 123"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                required
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={buscando || cp.length < 5}
                            >
                                {buscando ? 'Verificando...' : (
                                    <span className="flex items-center gap-2">
                                        <Search size={18} />
                                        Verificar Cobertura
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Buscador de LADA Independiente */}
                <Card className="h-fit border-telmex-blue/30 bg-telmex-blue/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-xl">📞</span> Identificador de LADA
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-xs text-gray-500">Averigua de dónde es el número del cliente (2 o 3 dígitos).</p>
                        <Input
                            placeholder="Ej. 55 o 998"
                            value={lada}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                                setLada(val);
                            }}
                            className="text-lg font-bold text-center tracking-widest"
                        />

                        {resultadoLada && (
                            <div className="p-3 bg-white rounded-lg border border-telmex-blue/20 shadow-sm animate-in fade-in slide-in-from-top-1">
                                <p className="text-[10px] text-telmex-blue font-bold uppercase tracking-tighter">Procedencia:</p>
                                <p className="text-sm font-semibold text-gray-800 leading-tight">
                                    {resultadoLada}
                                </p>
                            </div>
                        )}

                        {lada.length > 0 && !resultadoLada && lada.length < 2 && (
                            <p className="text-[10px] text-gray-400 text-center italic">Escribe al menos 2 dígitos...</p>
                        )}
                    </CardContent>
                </Card>

                {/* Resultados */}
                <div className="md:col-span-2">
                    {!resultado && !buscando && (
                        <div className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <MapPin size={48} className="mb-4 opacity-50" />
                            <p className="font-medium">Ingresa los datos para verificar...</p>
                        </div>
                    )}

                    {buscando && (
                        <div className="h-48 border border-gray-200 rounded-xl flex items-center justify-center bg-white">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {resultado && (
                        <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-md">
                                <CardContent className="p-8">
                                    <div className="flex flex-col gap-6">
                                        {/* Ubicación */}
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-blue-100 text-telmex-blue rounded-full">
                                                <MapPin size={32} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Dirección Completa</p>

                                                <div className="mt-2 space-y-1">
                                                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                                        {resultado.calle} #{resultado.numero}
                                                    </h2>
                                                    <p className="text-xl text-telmex-blue font-semibold">
                                                        Col. {resultado.colonia}
                                                    </p>
                                                    <div className="text-lg text-gray-700">
                                                        {resultado.ciudad && resultado.ciudad !== resultado.municipio && (
                                                            <p>Ciudad: {resultado.ciudad}</p>
                                                        )}
                                                        <p>{resultado.municipio}, {resultado.estado}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-mono tracking-wider">
                                                            CP: {resultado.cp}
                                                        </span>
                                                        <span className="text-gray-400 text-sm italic">{resultado.pais}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Separador */}
                                        <hr className="border-gray-200" />

                                        {/* Hora Local */}
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                                                <Clock size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Hora Local en {resultado.estado}</p>
                                                <div className="text-4xl font-mono font-bold text-gray-900 mt-1 bg-white inline-block px-3 py-1 rounded shadow-sm">
                                                    {horaLocal || '--:--:--'}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">Zona Horaria: {resultado.zonaHoraria}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button
                                variant="outline"
                                className="w-full py-6 text-lg border-2"
                                onClick={() => {
                                    const ciudadStr = resultado.ciudad && resultado.ciudad !== resultado.municipio ? `Ciudad: ${resultado.ciudad}\n` : '';
                                    const texto = `📍 UBICACIÓN VERIFICADA:\nCalle: ${resultado.calle}\nNúmero: ${resultado.numero}\nColonia: ${resultado.colonia}\n${ciudadStr}Municipio/Alc: ${resultado.municipio}\nEstado: ${resultado.estado}\nCP: ${resultado.cp}\n\n⏰ Hora Local: ${horaLocal}`;
                                    navigator.clipboard.writeText(texto);
                                    alert('Dirección completa copiada.');
                                }}
                            >
                                📋 Copiar Dirección Completa
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
