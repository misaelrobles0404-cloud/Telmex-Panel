'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Cliente, PerfilUsuario } from '@/types';
import { Users, Phone, Hash, Key, Clock, CheckCircle2, ChevronDown, FilterX, ListFilter, Search, Calendar } from 'lucide-react';
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
    // Estado para el buscador de promotores
    const [busqueda, setBusqueda] = React.useState('');

    // Obtener lista de emails únicos de perfiles para asegurar que todos aparezcan
    const todosLosEmails = Array.from(new Set(perfiles.map(p => p.email)));

    // Filtrar promotores por búsqueda (nombre o email)
    const emailsBusqueda = todosLosEmails.filter(email => {
        if (!busqueda) return true;
        const perfil = perfiles.find(p => p.email === email);
        const term = busqueda.toLowerCase();
        return (perfil?.nombre_completo?.toLowerCase().includes(term)) || email.toLowerCase().includes(term);
    });

    const toggleExpandir = (email: string) => {
        setExpandidos(prev => ({ ...prev, [email]: !prev[email] }));
    };

    const cambiarFiltro = (email: string, filtro: 'todas' | 'instaladas' | 'programadas') => {
        setFiltros(prev => ({ ...prev, [email]: filtro }));
    };

    // Función simple para formatear fecha a DD/MM/YYYY
    const formatearFechaSimple = (fechaStr?: string) => {
        if (!fechaStr) return '---';
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return '---';
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <Users className="text-telmex-blue" />
                    <h2 className="text-2xl font-bold text-gray-800">Control por Promotor</h2>
                </div>

                <div className="flex items-center gap-3 flex-1 sm:justify-end">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar promotor..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full bg-white border-2 border-gray-100 rounded-xl py-2 pl-9 pr-3 text-sm font-medium focus:border-telmex-blue focus:outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-2 rounded-xl whitespace-nowrap">
                        {todosLosEmails.length} Promotores
                    </div>
                </div>
            </div>

            {emailsBusqueda.length > 0 ? (
                emailsBusqueda.map((email) => {
                    const isExpandido = expandidos[email] || false;
                    const filtroActual = filtros[email] || 'todas';

                    const clientesVendedor = clientes.filter(c =>
                        c.usuario === email ||
                        (c.user_id && perfiles.find(p => p.id === c.user_id)?.email === email)
                    );

                    const ventasProgramadasCount = clientesVendedor.filter(c => c.estado_pipeline === 'cierre_programado').length;
                    const ventasInstaladasCount = clientesVendedor.filter(c => c.estado_pipeline === 'vendido').length;

                    // Aplicar filtro visual refinado
                    const clientesFiltrados = clientesVendedor
                        .filter(c => {
                            if (filtroActual === 'instaladas') return c.estado_pipeline === 'vendido';
                            if (filtroActual === 'programadas') return c.estado_pipeline === 'cierre_programado';
                            return c.estado_pipeline === 'vendido' || c.estado_pipeline === 'cierre_programado';
                        })
                        .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());

                    const perfilVendedor = perfiles.find(p => p.email === email);
                    const nombreMostrar = perfilVendedor ? perfilVendedor.nombre_completo : email.split('@')[0];

                    return (
                        <Card key={email} className={`border-l-4 border-l-telmex-blue shadow-sm hover:shadow-md transition-all duration-200 ${!isExpandido ? 'opacity-90' : ''}`}>
                            <div
                                className="bg-white hover:bg-gray-50/50 cursor-pointer transition-colors"
                                onClick={() => toggleExpandir(email)}
                            >
                                <CardHeader className="px-6 py-4 mb-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-sm transition-transform duration-200 ${isExpandido ? 'scale-110 bg-telmex-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {nombreMostrar.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-xl text-gray-900 font-bold mb-0">{nombreMostrar}</CardTitle>
                                                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isExpandido ? 'rotate-180' : ''}`} />
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium">{email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                            {/* Contadores Resumen */}
                                            <div className="hidden sm:flex items-center gap-4 mr-2">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest leading-none">Prog.</p>
                                                    <p className="text-sm font-black text-blue-800">{ventasProgramadasCount}</p>
                                                </div>
                                                <div className="text-right border-l pl-4 border-gray-200">
                                                    <p className="text-[10px] text-green-500 uppercase font-black tracking-widest leading-none">Inst.</p>
                                                    <p className="text-sm font-black text-green-800">{ventasInstaladasCount}</p>
                                                </div>
                                            </div>

                                            {/* Desglose de Filtro (Select Nativo con estilo Premium) */}
                                            <div className="relative group">
                                                <select
                                                    value={filtroActual}
                                                    onChange={(e) => cambiarFiltro(email, e.target.value as any)}
                                                    className="appearance-none bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-wider text-gray-700 hover:border-telmex-blue focus:border-telmex-blue focus:outline-none transition-all cursor-pointer shadow-sm min-w-[160px]"
                                                >
                                                    <option value="todas">Ver Todos</option>
                                                    <option value="programadas">Cierres Prog.</option>
                                                    <option value="instaladas">Instaladas</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ListFilter size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </div>

                            {isExpandido && (
                                <CardContent className="p-0 overflow-x-auto border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                    {clientesFiltrados.length > 0 ? (
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-black">
                                                    <th className="px-6 py-4">Cliente / Contacto</th>
                                                    <th className="px-6 py-4">Fecha Mov.</th>
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
                                                            <div className="font-bold text-gray-900 group-hover:text-telmex-blue transition-colors text-sm">
                                                                {cliente.nombre}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                                                <Phone size={10} />
                                                                {cliente.no_tt}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">
                                                                    {cliente.estado_pipeline === 'vendido' ? 'Instalación' : 'Registro'}
                                                                </span>
                                                                <span className="text-xs font-black text-gray-700 flex items-center gap-1">
                                                                    <Calendar size={12} className="text-telmex-blue" />
                                                                    {cliente.estado_pipeline === 'vendido'
                                                                        ? formatearFechaSimple(cliente.fecha_instalacion)
                                                                        : formatearFechaSimple(cliente.creado_en)
                                                                    }
                                                                </span>
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
                                                            <div className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
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
                                                            <span className="text-base font-black text-gray-900">
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
                                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                                <FilterX size={32} />
                                            </div>
                                            <p className="text-gray-500 font-bold">No hay registros con este filtro</p>
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
                })
            ) : (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-900 font-black text-xl">No se encontró al promotor</p>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Prueba buscando por nombre o correo electrónico</p>
                    <button
                        onClick={() => setBusqueda('')}
                        className="mt-6 px-6 py-2 bg-telmex-blue text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-telmex-blue/30"
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            )}
        </div>
    );
}
