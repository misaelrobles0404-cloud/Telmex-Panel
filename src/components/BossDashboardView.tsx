'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Cliente, PerfilUsuario } from '@/types';
import { Users, Phone, Hash, Key, Clock, CheckCircle2 } from 'lucide-react';
import { formatearMoneda } from '@/lib/utils';

interface BossDashboardViewProps {
    clientes: Cliente[];
    perfiles: PerfilUsuario[];
}

export function BossDashboardView({ clientes, perfiles }: BossDashboardViewProps) {
    // Agrupar clientes por usuario (email)
    const clientesPorPromotor = clientes.reduce((acc, cliente) => {
        const promotorEmail = cliente.usuario || 'Sin Asignar';
        if (!acc[promotorEmail]) acc[promotorEmail] = [];
        acc[promotorEmail].push(cliente);
        return acc;
    }, {} as Record<string, Cliente[]>);

    // Mapeo de emails a nombres completos
    const nombrePromotor = (email: string) => {
        const perfil = perfiles.find(p => p.email === email);
        return perfil ? perfil.nombre_completo : email.split('@')[0];
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 mb-2">
                <Users className="text-telmex-blue" />
                <h2 className="text-2xl font-bold text-gray-800">Control por Promotor</h2>
            </div>

            {Object.entries(clientesPorPromotor).map(([email, clientesVendedor]) => {
                const ventasProgramadas = clientesVendedor.filter(c =>
                    c.estado_pipeline === 'cierre_programado' || c.estado_pipeline === 'interesado'
                );
                const ventasInstaladas = clientesVendedor.filter(c => c.estado_pipeline === 'vendido');

                return (
                    <Card key={email} className="border-l-4 border-l-telmex-blue shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-telmex-blue text-white rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-inner">
                                        {nombrePromotor(email).charAt(0)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-gray-900">{nombrePromotor(email)}</CardTitle>
                                        <p className="text-sm text-gray-500 font-medium">{email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Programadas</p>
                                        <p className="text-xl font-black text-blue-800">{ventasProgramadas.length}</p>
                                    </div>
                                    <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
                                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Instaladas</p>
                                        <p className="text-xl font-black text-green-800">{ventasInstaladas.length}</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-gray-100/50 text-gray-600 text-xs uppercase tracking-widest font-bold">
                                        <th className="px-6 py-4">Cliente / Contacto</th>
                                        <th className="px-6 py-4">Datos Portal</th>
                                        <th className="px-6 py-4">Servicio / Paquete</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4">Comisión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {clientesVendedor.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()).map((cliente) => (
                                        <tr key={cliente.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 group-hover:text-telmex-blue transition-colors">
                                                    {cliente.nombre}
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                                    <Phone size={12} />
                                                    {cliente.no_tt}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                                                            <Hash size={10} /> SIAC: {cliente.folio_siac || '---'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                                                            <Key size={10} /> CLAVE: {cliente.usuario_portal_asignado || '---'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-800 uppercase">
                                                    {cliente.tipo_servicio.replace('_', ' ')}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {cliente.paquete} ({cliente.velocidad}MB)
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-2 ${cliente.estado_pipeline === 'vendido'
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : cliente.estado_pipeline === 'cierre_programado'
                                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                    }`}>
                                                    {cliente.estado_pipeline === 'vendido' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                    {cliente.estado_pipeline.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-black text-gray-900">
                                                    {formatearMoneda(cliente.comision)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
