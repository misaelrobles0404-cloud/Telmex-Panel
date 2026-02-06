'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, CheckCircle, AlertTriangle, XCircle, Wifi } from 'lucide-react';

export default function CoberturaPage() {
    const [cp, setCp] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cp.length !== 5) {
            alert('Por favor ingresa un código postal válido de 5 dígitos.');
            return;
        }

        setBuscando(true);
        setResultado(null);

        try {
            // 1. Identificar Lugar Real con API Pública (Zippopotam.us)
            const response = await fetch(`https://api.zippopotam.us/mx/${cp}`);

            let ubicacionReal = null;
            if (response.ok) {
                const data = await response.json();
                // Zippopotam devuelve 'places' con la información
                const lugar = data.places[0];
                ubicacionReal = {
                    estado: lugar['state'],
                    municipio: lugar['place name'], // En data de MX suele ser la colonia o ciudad
                    pais: data['country']
                };
            }

            // 2. Simular Cobertura (mantenemos la lógica de simulación para disponibilidad técnica)
            // En un caso real, aquí consultaríamos la API de TELMEX con los datos geográficos obtenidos
            const lastDigit = parseInt(cp.slice(-1));
            let res;

            if (lastDigit >= 0 && lastDigit <= 3) {
                res = {
                    tipo: 'fibra',
                    titulo: '¡Felicidades! Hay Fibra Óptica',
                    mensaje: 'Esta zona cuenta con la mejor tecnología de TELMEX.',
                    velocidad: 'Hasta 1,000 Mbps',
                    tecnologia: 'FTTH (Fibra hasta la casa)',
                    paquetesDisponibles: ['Todos los paquetes Residenciales y Negocio', 'Infinitum Puro', 'Paquetes con Netflix'],
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    icon: CheckCircle
                };
            } else if (lastDigit >= 4 && lastDigit <= 6) {
                res = {
                    tipo: 'cobre',
                    titulo: 'Cobertura Tradicional Disponible',
                    mensaje: 'Zona con cobertura de cobre de alta velocidad (VDSL).',
                    velocidad: 'Hasta 50 Mbps',
                    tecnologia: 'VDSL / Cobre',
                    paquetesDisponibles: ['Paquetes hasta 50 Mbps', 'Línea telefónica'],
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    icon: AlertTriangle
                };
            } else {
                res = {
                    tipo: 'sin_cobertura',
                    titulo: 'Requiere Validación en Campo',
                    mensaje: 'No detectamos infraestructura inmediata, se requiere visita técnica.',
                    velocidad: 'Por definir',
                    tecnologia: 'N/A',
                    paquetesDisponibles: ['Sujeto a factibilidad técnica'],
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    icon: XCircle
                };
            }

            // Combinamos resultado técnico simulado + ubicación real
            setResultado({
                ...res,
                ubicacion: ubicacionReal // Agregamos la ubicación real al objeto de resultado
            });

        } catch (error) {
            console.error("Error al buscar CP", error);
            alert("Hubo un error al consultar el código postal. Intenta de nuevo.");
        } finally {
            setBuscando(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="text-telmex-blue" />
                    Verificador de Cobertura
                </h1>
                <p className="text-gray-600 mt-2">
                    Consulta la disponibilidad de servicios TELMEX ingresando el Código Postal del cliente.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulario de Búsqueda */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Buscar por Zona</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <Input
                                label="Código Postal"
                                placeholder="Ej. 06500"
                                value={cp}
                                onChange={(e) => {
                                    // Solo permitir números y máximo 5 dígitos
                                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                                    setCp(val);
                                }}
                                required
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={buscando || cp.length < 5}
                            >
                                {buscando ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Verificando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Search size={18} />
                                        Consultar Cobertura
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Resultados */}
                <div className="lg:col-span-2">
                    {!resultado && !buscando && (
                        <div className="h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <MapPin size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Ingresa un CP para ver resultados</p>
                            <p className="text-sm text-center max-w-xs mt-2">
                                El sistema verificará la infraestructura disponible en la zona (Fibra o Cobre).
                            </p>
                        </div>
                    )}

                    {buscando && (
                        <div className="h-64 border border-gray-200 rounded-xl flex flex-col items-center justify-center bg-white shadow-sm">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-100 border-t-telmex-blue rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Wifi className="text-telmex-blue animate-pulse" size={24} />
                                </div>
                            </div>
                            <p className="mt-4 text-gray-600 font-medium animate-pulse">Analizando infraestructura de la zona...</p>
                        </div>
                    )}

                    {resultado && (
                        <div className={`rounded-xl border-2 p-6 shadow-sm overflow-hidden relative ${resultado.bg} ${resultado.border}`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full bg-white shadow-sm ${resultado.color}`}>
                                    <resultado.icon size={32} />
                                </div>
                                <div className="flex-1">
                                    <h2 className={`text-2xl font-bold mb-1 ${resultado.color}`}>
                                        {resultado.titulo}
                                    </h2>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                                        <p className="text-gray-700 font-medium">
                                            {resultado.mensaje}
                                        </p>
                                        {resultado.ubicacion && (
                                            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-600 flex items-center gap-1 border border-gray-200">
                                                <MapPin size={12} />
                                                {resultado.ubicacion.municipio}, {resultado.ubicacion.estado} ({resultado.ubicacion.pais})
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        <div className="bg-white/60 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Velocidad Estimada</p>
                                            <p className="text-lg font-bold text-gray-900">{resultado.velocidad}</p>
                                        </div>
                                        <div className="bg-white/60 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tecnología</p>
                                            <p className="text-lg font-bold text-gray-900">{resultado.tecnologia}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <CheckCircle size={16} className={resultado.color} />
                                            Oferta Disponible:
                                        </h3>
                                        <ul className="space-y-1">
                                            {resultado.paquetesDisponibles.map((pkg: string, idx: number) => (
                                                <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                    {pkg}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Background decoration */}
                            <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                                <Wifi size={200} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
