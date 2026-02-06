'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PLANTILLAS_WHATSAPP, reemplazarVariables } from '@/data/plantillas';
import { Copy, Check } from 'lucide-react';

export default function PlantillasPage() {
    const [copiado, setCopiado] = useState<string | null>(null);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');

    const plantillasFiltradas = categoriaSeleccionada === 'todas'
        ? PLANTILLAS_WHATSAPP
        : PLANTILLAS_WHATSAPP.filter(p => p.categoria === categoriaSeleccionada);

    const copiarAlPortapapeles = (texto: string, id: string) => {
        navigator.clipboard.writeText(texto);
        setCopiado(id);
        setTimeout(() => setCopiado(null), 2000);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Plantillas WhatsApp</h1>
                <p className="text-gray-600 mt-1">
                    Mensajes predefinidos para agilizar tu comunicación
                </p>
            </div>

            {/* Filtros por Categoría */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <Button
                    variant={categoriaSeleccionada === 'todas' ? 'primary' : 'secondary'}
                    onClick={() => setCategoriaSeleccionada('todas')}
                >
                    Todas
                </Button>
                <Button
                    variant={categoriaSeleccionada === 'prospeccion' ? 'primary' : 'secondary'}
                    onClick={() => setCategoriaSeleccionada('prospeccion')}
                >
                    Prospección
                </Button>
                <Button
                    variant={categoriaSeleccionada === 'seguimiento' ? 'primary' : 'secondary'}
                    onClick={() => setCategoriaSeleccionada('seguimiento')}
                >
                    Seguimiento
                </Button>
                <Button
                    variant={categoriaSeleccionada === 'cotizacion' ? 'primary' : 'secondary'}
                    onClick={() => setCategoriaSeleccionada('cotizacion')}
                >
                    Cotización
                </Button>
                <Button
                    variant={categoriaSeleccionada === 'cierre' ? 'primary' : 'secondary'}
                    onClick={() => setCategoriaSeleccionada('cierre')}
                >
                    Cierre
                </Button>
                <Button
                    variant={categoriaSeleccionada === 'postventa' ? 'primary' : 'secondary'}
                    onClick={() => setCategoriaSeleccionada('postventa')}
                >
                    Postventa
                </Button>
            </div>

            {/* Plantillas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {plantillasFiltradas.map((plantilla) => (
                    <Card key={plantilla.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle>{plantilla.nombre}</CardTitle>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`badge ${plantilla.categoria === 'prospeccion' ? 'badge-blue' :
                                                plantilla.categoria === 'seguimiento' ? 'badge-purple' :
                                                    plantilla.categoria === 'cotizacion' ? 'badge-yellow' :
                                                        plantilla.categoria === 'cierre' ? 'badge-green' :
                                                            'bg-gray-100 text-gray-800'
                                            }`}>
                                            {plantilla.categoria.charAt(0).toUpperCase() + plantilla.categoria.slice(1)}
                                        </span>
                                        {plantilla.tipoServicio && (
                                            <span className="badge badge-blue">
                                                {plantilla.tipoServicio === 'linea_nueva' && 'Línea Nueva'}
                                                {plantilla.tipoServicio === 'portabilidad' && 'Portabilidad'}
                                                {plantilla.tipoServicio === 'winback' && 'Winback'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copiarAlPortapapeles(plantilla.contenido, plantilla.id)}
                                >
                                    {copiado === plantilla.id ? (
                                        <>
                                            <Check size={16} className="text-success" />
                                            Copiado
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copiar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg mb-3">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                    {plantilla.contenido}
                                </pre>
                            </div>

                            {plantilla.variables.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-2">Variables disponibles:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {plantilla.variables.map((variable) => (
                                            <code
                                                key={variable}
                                                className="px-2 py-1 bg-telmex-blue/10 text-telmex-blue rounded text-xs font-mono"
                                            >
                                                {`{${variable}}`}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {plantillasFiltradas.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-gray-500">No hay plantillas en esta categoría</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
