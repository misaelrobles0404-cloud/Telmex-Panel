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
    // Estado para controlar qué tarjetas están expandidas
    const [expandidos, setExpandidos] = React.useState<Record<string, boolean>>({});
    // Estado para controlar el filtro de cada tarjeta: 'todas', 'instaladas', 'programadas'
    const [filtros, setFiltros] = React.useState<Record<string, 'todas' | 'instaladas' | 'programadas'>>({});

    // Obtener lista de emails únicos de perfiles para asegurar que todos aparezcan
    const todosLosEmails = Array.from(new Set(perfiles.map(p => p.email)));

    const toggleExpandir = (email: string) => {
        setExpandidos(prev => ({ ...prev, [email]: !prev[email] }));
    };

    const cambiarFiltro = (email: string, filtro: 'todas' | 'instaladas' | 'programadas') => {
        setFiltros(prev => ({ ...prev, [email]: filtro }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Users className="text-telmex-blue" />
                    <h2 className="text-2xl font-bold text-gray-800">Control por Promotor</h2>
                </div>
                <div className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                    {todosLosEmails.length} Empleados registrados
                </div>
            </div>

            {todosLosEmails.map((email) => {
                const isExpandido = expandidos[email] || false;
                const filtroActual = filtros[email] || 'todas';

                const clientesVendedor = clientes.filter(c =>
                    c.usuario === email ||
                    (c.user_id && perfiles.find(p => p.id === c.user_id)?.email === email)
                );

                const ventasProgramadas = clientesVendedor.filter(c =>
                    c.estado_pipeline === 'cierre_programado' || c.estado_pipeline === 'interesado'
                );
                const ventasInstaladas = clientesVendedor.filter(c => c.estado_pipeline === 'vendido');

                // Aplicar filtro visual
                const clientesFiltrados = clientesVendedor
                    .filter(c => {
                        if (filtroActual === 'instaladas') return c.estado_pipeline === 'vendido';
                        if (filtroActual === 'programadas') return c.estado_pipeline === 'cierre_programado' || c.estado_pipeline === 'interesado';
                        return c.estado_pipeline === 'vendido' || c.estado_pipeline === 'cierre_programado';
                    })
                    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());

                const perfilVendedor = perfiles.find(p => p.email === email);
                const nombreMostrar = perfilVendedor ? perfilVendedor.nombre_completo : email.split('@')[0];

                return (
                    <Card key={email} className={`border-l-4 border-l-telmex-blue shadow-sm hover:shadow-md transition-all duration-200 ${!isExpandido ? 'opacity-90' : ''}`}>
                        <CardHeader
                            className="bg-white hover:bg-gray-50/50 cursor-pointer transition-colors px-6 py-4"
                            onClick={() => toggleExpandir(email)}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-sm transition-transform duration-200 ${isExpandido ? 'scale-110 bg-telmex-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {nombreMostrar.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl text-gray-900 font-bold">{nombreMostrar}</CardTitle>
                                            <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isExpandido ? 'rotate-180' : ''}`} />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">{email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => cambiarFiltro(email, 'programadas')}
                                        className={`text-center px-4 py-2 rounded-xl transition-all border-2 ${filtroActual === 'programadas' ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-100' : 'bg-blue-50/50 border-transparent hover:border-blue-200'}`}
                                    >
                                        <p className={`text-[10px] uppercase font-black tracking-tighter ${filtroActual === 'programadas' ? 'text-blue-700' : 'text-blue-500'}`}>Programadas</p>
                                        <p className={`text-xl font-black ${filtroActual === 'programadas' ? 'text-blue-800' : 'text-blue-600'}`}>{ventasProgramadas.length}</p>
                                    </button>

                                    <button
                                        onClick={() => cambiarFiltro(email, 'instaladas')}
                                        className={`text-center px-4 py-2 rounded-xl transition-all border-2 ${filtroActual === 'instaladas' ? 'bg-green-100 border-green-300 ring-2 ring-green-100' : 'bg-green-50/50 border-transparent hover:border-green-200'}`}
                                    >
                                        <p className={`text-[10px] uppercase font-black tracking-tighter ${filtroActual === 'instaladas' ? 'text-green-700' : 'text-green-500'}`}>Instaladas</p>
                                        <p className={`text-xl font-black ${filtroActual === 'instaladas' ? 'text-green-800' : 'text-green-600'}`}>{ventasInstaladas.length}</p>
                                    </button>

                                    {filtroActual !== 'todas' && (
                                        <button
                                            onClick={() => cambiarFiltro(email, 'todas')}
                                            className="p-2 text-gray-400 hover:text-telmex-blue hover:bg-gray-100 rounded-lg transition-all"
                                            title="Quitar filtro"
                                        >
                                            <FilterX size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        {isExpandido && (
                            <CardContent className="p-0 overflow-x-auto border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                {clientesFiltrados.length > 0 ? (
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-black">
                                                <th className="px-6 py-4">Cliente / Contacto</th>
                                                <th className="px-6 py-4">Datos Portal</th>
                                                <th className="px-6 py-4">Servicio / Paquete</th>
                                                <th className="px-6 py-4">Estado</th>
                                                <th className="px-6 py-4 text-right">Comisión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {clientesFiltrados.map((cliente) => (
                                                <tr key={cliente.id} className="hover:bg-blue-50/30 transition-colors group">
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
                                                            <div className="flex items-center gap-2 text-[10px]">
                                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                                                                    <Hash size={10} /> SIAC: {cliente.folio_siac || '---'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px]">
                                                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                                                                    <Key size={10} /> CLAVE: {cliente.usuario_portal_asignado || '---'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-black text-gray-800 uppercase tracking-tighter">
                                                            {cliente.tipo_servicio.replace('_', ' ')}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-medium">
                                                            {cliente.paquete} ({cliente.velocidad}MB)
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border-2 ${cliente.estado_pipeline === 'vendido'
                                                            ? 'bg-green-100 text-green-700 border-green-200'
                                                            : cliente.estado_pipeline === 'cierre_programado'
                                                                ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                            }`}>
                                                            {cliente.estado_pipeline === 'vendido' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                            {cliente.estado_pipeline === 'vendido' ? 'INSTALADO' :
                                                                cliente.estado_pipeline === 'cancelado' ? 'CANCELADO' :
                                                                    cliente.estado_pipeline.replace(/_/g, ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-lg font-black text-gray-900">
                                                            {cliente.estado_pipeline === 'vendido'
                                                                ? formatearMoneda(
                                                                    (cliente.tipo_servicio === 'portabilidad' || cliente.tipo_servicio === 'winback')
                                                                        ? 300
                                                                        : 250
                                                                )
                                                                : formatearMoneda(0)
                                                            }
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-12 text-center bg-gray-50/30">
                                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <FilterX className="text-gray-400" size={32} />
                                        </div>
                                        <p className="text-gray-500 font-bold">No hay registros para este filtro</p>
                                        <button
                                            onClick={() => cambiarFiltro(email, 'todas')}
                                            className="mt-2 text-telmex-blue text-sm font-bold hover:underline"
                                        >
                                            Ver todos los movimientos
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}

import { ChevronDown, FilterX } from 'lucide-react';
