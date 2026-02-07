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

export default function CoberturaPage() {
    const [cp, setCp] = useState('');
    const [calle, setCalle] = useState('');
    const [numero, setNumero] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [resultado, setResultado] = useState<any>(null);
    const [horaLocal, setHoraLocal] = useState('');

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
            const response = await fetch(`https://api.zippopotam.us/mx/${cp}`);

            if (response.ok) {
                const data = await response.json();
                const lugar = data.places[0];
                const estado = lugar['state'];
                const municipio = lugar['place name'];
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
                    municipio: municipio,
                    pais: data['country'],
                    zonaHoraria: zonaHoraria,
                    lat: lugar['latitude'],
                    lon: lugar['longitude']
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
                    Verificador de Ubicación y Hora
                </h1>
                <p className="text-gray-600 mt-2">
                    Consulta la ubicación exacta y la hora local de tus clientes por Código Postal.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulario de Búsqueda */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Buscar CP</CardTitle>
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
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Calle (Opcional)"
                                    placeholder="Ej. Av. Reforma"
                                    value={calle}
                                    onChange={(e) => setCalle(e.target.value)}
                                />
                                <Input
                                    label="Número (Opcional)"
                                    placeholder="Ej. 123"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={buscando || cp.length < 5}
                            >
                                {buscando ? 'Verificando...' : (
                                    <span className="flex items-center gap-2">
                                        <Search size={18} />
                                        Verificar
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Resultados */}
                <div className="md:col-span-2">
                    {!resultado && !buscando && (
                        <div className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <MapPin size={48} className="mb-4 opacity-50" />
                            <p className="font-medium">Esperando Código Postal...</p>
                        </div>
                    )}

                    {buscando && (
                        <div className="h-48 border border-gray-200 rounded-xl flex items-center justify-center bg-white">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {resultado && (
                        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-md">
                            <CardContent className="p-8">
                                <div className="flex flex-col gap-6">
                                    {/* Ubicación */}
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-100 text-telmex-blue rounded-full">
                                            <MapPin size={32} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Ubicación Detectada</p>
                                            <h2 className="text-2xl font-bold text-gray-900 mt-1">
                                                {resultado.municipio}, {resultado.estado}
                                            </h2>
                                            <p className="text-gray-600 font-medium">
                                                {resultado.calle && `${resultado.calle} ${resultado.numero}`}
                                                {resultado.calle ? <br /> : null}
                                                {resultado.pais}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">CP: {resultado.cp}</p>
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
                                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Hora Local</p>
                                            <div className="text-4xl font-mono font-bold text-gray-900 mt-1 bg-white inline-block px-3 py-1 rounded shadow-sm">
                                                {horaLocal || '--:--:--'}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">Zona: {resultado.zonaHoraria}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
