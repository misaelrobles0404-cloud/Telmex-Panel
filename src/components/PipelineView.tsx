'use client';

import React from 'react';
import { Cliente, EstadoPipeline } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { formatearMoneda } from '@/lib/utils';

interface PipelineViewProps {
    clientes: Cliente[];
    onClienteClick?: (cliente: Cliente) => void;
}

const ESTADOS: { estado: EstadoPipeline; label: string; color: string }[] = [
    { estado: 'contactado', label: 'Prospectos', color: 'bg-gray-100 border-gray-300' },
    { estado: 'interesado', label: 'Interesado', color: 'bg-blue-100 border-blue-300' },
    { estado: 'cierre_programado', label: 'Cierre Programado (Folio SIAC)', color: 'bg-purple-100 border-purple-300' },
    { estado: 'vendido', label: 'Instalado', color: 'bg-green-100 border-green-300' },
    { estado: 'sin_cobertura', label: 'Sin Cobertura', color: 'bg-red-100 border-red-300' },
];

export function PipelineView({ clientes, onClienteClick }: PipelineViewProps) {
    const clientesPorEstado = (estado: EstadoPipeline) =>
        clientes.filter((c) => c.estado_pipeline === estado);

    return (
        <div className="flex flex-nowrap lg:grid lg:grid-cols-5 gap-4 overflow-x-auto pb-4 lg:pb-0 lg:overflow-x-visible">
            {ESTADOS.map(({ estado, label, color }) => {
                const clientesEnEstado = clientesPorEstado(estado);
                const totalComision = clientesEnEstado.reduce((sum, c) => sum + c.comision, 0);

                return (
                    <div key={estado} className="flex flex-col">
                        <div className={`p-3 rounded-t-lg border-2 ${color}`}>
                            <h3 className="font-semibold text-sm">{label}</h3>
                            <p className="text-xs text-gray-600 mt-1">
                                {clientesEnEstado.length} cliente{clientesEnEstado.length !== 1 ? 's' : ''}
                                {estado === 'vendido' && ` • ${formatearMoneda(totalComision)}`}
                            </p>
                        </div>

                        <div className="flex-1 bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                            {clientesEnEstado.map((cliente) => (
                                <Card
                                    key={cliente.id}
                                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => onClienteClick?.(cliente)}
                                >
                                    <p className="font-medium text-sm truncate">{cliente.nombre}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {cliente.paquete} • {formatearMoneda(cliente.comision)}
                                    </p>
                                    <div className="mt-2">
                                        <span className={`badge ${cliente.tipo_servicio === 'linea_nueva' ? 'badge-blue' :
                                            cliente.tipo_servicio === 'portabilidad' ? 'badge-purple' :
                                                'badge-green'
                                            }`}>
                                            {cliente.tipo_servicio === 'linea_nueva' ? 'Línea Nueva' :
                                                cliente.tipo_servicio === 'portabilidad' ? 'Portabilidad' :
                                                    'Winback'}
                                        </span>
                                    </div>
                                </Card>
                            ))}

                            {clientesEnEstado.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-8">
                                    Sin clientes
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
