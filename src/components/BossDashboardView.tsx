'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Cliente, PerfilUsuario } from '@/types';
import { Copy, Users, Phone, Hash, Key, Clock, CheckCircle2, ChevronDown, FilterX, ListFilter, Search, Calendar } from 'lucide-react';
import { formatearMoneda } from '@/lib/utils';
import { Toast } from './ui/Toast';
import { guardarCliente, confirmarComisionesByEmail } from '@/lib/storage';
import { Edit2, Save as SaveIcon, X as CancelIcon } from 'lucide-react';

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
    const [toast, setToast] = React.useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

    // Estados para edición inline
    const [editando, setEditando] = React.useState<{ id: string, campo: 'folio_siac' | 'orden_servicio' } | null>(null);
    const [valorEditado, setValorEditado] = React.useState('');
    const [confirmando, setConfirmando] = React.useState<Record<string, boolean>>({});
    const [marcandoPosteado, setMarcandoPosteado] = React.useState<Record<string, boolean>>({});

    const handleUpdateCliente = async (cliente: Cliente, campo: 'folio_siac' | 'orden_servicio', valor: string) => {
        try {
            const clienteActualizado: Cliente = {
                ...cliente,
                [campo]: valor,
                actualizado_en: new Date().toISOString()
            };
            await guardarCliente(clienteActualizado);
            mostrarToast('Datos actualizados');
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            mostrarToast('Error al guardar');
        } finally {
            setEditando(null);
        }
    };

    const mostrarToast = (message: string) => {
        setToast({ message, isVisible: true });
    };

    const copiarAlPortapapeles = (e: React.MouseEvent, texto: string, label: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast(`${label} copiado`);
        });
    };

    const handleConfirmarComisiones = async (email: string) => {
        setConfirmando(prev => ({ ...prev, [email]: true }));
        try {
            await confirmarComisionesByEmail(email);
            mostrarToast('✅ Comisiones confirmadas correctamente');
        } catch {
            mostrarToast('❌ Error al confirmar comisiones');
        } finally {
            setConfirmando(prev => ({ ...prev, [email]: false }));
        }
    };

    const handleMarcarPosteado = async (cliente: Cliente) => {
        const confirmar = window.confirm(
            `¿Marcar como POSTEADO a ${cliente.nombre}?\n\nEsto contabilizará la comisión del promotor.`
        );
        if (!confirmar) return;

        setMarcandoPosteado(prev => ({ ...prev, [cliente.id]: true }));
        try {
            const clienteActualizado: Cliente = {
                ...cliente,
                estado_pipeline: 'posteado',
                fecha_instalacion: cliente.fecha_instalacion || new Date().toISOString(),
                actualizado_en: new Date().toISOString()
            };
            await guardarCliente(clienteActualizado);
            mostrarToast(`✅ ${cliente.nombre} marcado como POSTEADO`);
        } catch {
            mostrarToast(`❌ Error al actualizar estado`);
        } finally {
            setMarcandoPosteado(prev => ({ ...prev, [cliente.id]: false }));
        }
    };

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
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Users className="text-telmex-blue" />
                        <h2 className="text-2xl font-bold text-gray-800">Control por Promotor</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1 mb-0.5">SIAC Interactivo</span>
                            <a
                                href="https://siac-interac.telmex.com/siac_interactivo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-all border border-blue-200 flex items-center gap-1.5 shadow-sm group"
                            >
                                <span className="text-xs group-hover:scale-110 transition-transform">🌐</span>
                                <span className="underline decoration-blue-200 underline-offset-2 tracking-tight">siac-interac.telmex.com/...</span>
                            </a>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest ml-1 mb-0.5">Portal DV</span>
                            <a
                                href="https://portalwcex-2.telmex.com:4200/login"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-purple-100 transition-all border border-purple-200 flex items-center gap-1.5 shadow-sm group"
                            >
                                <span className="text-xs group-hover:scale-110 transition-transform">🔑</span>
                                <span className="underline decoration-purple-200 underline-offset-2 tracking-tight">portalwcex-2.telmex.com...</span>
                            </a>
                        </div>
                    </div>
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
                        (c.usuario === email ||
                            (c.user_id && perfiles.find(p => p.id === c.user_id)?.email === email)) &&
                        !c.comision_pagada  // Ocultar las ya pagadas — se gestionan desde /admin/pagos
                    );

                    const ventasProgramadasCount = clientesVendedor.filter(c => c.estado_pipeline === 'capturado').length;
                    const ventasInstaladasCount = clientesVendedor.filter(c => c.estado_pipeline === 'posteado').length;

                    // Aplicar filtro visual refinado
                    const clientesFiltrados = clientesVendedor
                        .filter(c => {
                            if (filtroActual === 'instaladas') return c.estado_pipeline === 'posteado';
                            if (filtroActual === 'programadas') return c.estado_pipeline === 'capturado';
                            return c.estado_pipeline === 'posteado' || c.estado_pipeline === 'capturado';
                        })
                        .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());

                    const perfilVendedor = perfiles.find(p => p.email === email);
                    const nombreMostrar = perfilVendedor ? perfilVendedor.nombre_completo : email.split('@')[0];

                    return (
                        <Card key={email} className={`border-0 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 ${!isExpandido ? 'opacity-95 hover:opacity-100' : 'ring-2 ring-telmex-blue/20'}`}>
                            <div
                                className={`cursor-pointer transition-colors duration-300 ${isExpandido ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm' : 'bg-white hover:bg-gray-50/80'}`}
                                onClick={() => toggleExpandir(email)}
                            >
                                <CardHeader className="px-6 py-5 mb-0 relative overflow-hidden">
                                    {isExpandido && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-telmex-blue to-purple-600 shimmer-effect" />}
                                    {!isExpandido && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200" />}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl uppercase shadow-inner transition-all duration-300 ${isExpandido ? 'bg-gradient-to-br from-telmex-blue to-blue-600 text-white rotate-3 scale-110 shadow-blue-500/30' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 hover:rotate-3'}`}>
                                                {nombreMostrar.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-xl md:text-2xl text-gray-900 font-extrabold mb-0 tracking-tight">{nombreMostrar}</CardTitle>
                                                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-500 ${isExpandido ? 'rotate-180 text-telmex-blue' : ''}`} />
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    {email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                            {/* Contadores Resumen */}
                                            <div className="hidden sm:flex items-center gap-4 mr-2">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest leading-none">Capt.</p>
                                                    <p className="text-sm font-black text-blue-800">{ventasProgramadasCount}</p>
                                                </div>
                                                <div className="text-right border-l pl-4 border-gray-200">
                                                    <p className="text-[10px] text-green-500 uppercase font-black tracking-widest leading-none">Post.</p>
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
                                                    <option value="programadas">CAPTURADOS</option>
                                                    <option value="instaladas">POSTEADOS</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ListFilter size={14} />
                                                </div>
                                            </div>

                                            {/* Botón Confirmar Comisiones */}
                                            {(() => {
                                                const pendientes = clientesVendedor.filter(c => c.estado_pipeline === 'posteado' && !c.comision_confirmada);
                                                const confirmadas = clientesVendedor.filter(c => c.estado_pipeline === 'posteado' && c.comision_confirmada).length;
                                                if (ventasInstaladasCount === 0) return null;
                                                return (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        {confirmadas > 0 && (
                                                            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">{confirmadas} confirmadas</span>
                                                        )}
                                                        <button
                                                            onClick={() => handleConfirmarComisiones(email)}
                                                            disabled={confirmando[email] || pendientes.length === 0}
                                                            className={`relative px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm border ${pendientes.length === 0
                                                                ? 'bg-green-50 border-green-100 text-green-500 cursor-default'
                                                                : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white cursor-pointer active:scale-95 shadow-emerald-200'
                                                                } disabled:opacity-70`}
                                                        >
                                                            {confirmando[email] ? '⏳' : pendientes.length === 0 ? '✅' : '✔'}
                                                            {confirmando[email] ? 'Confirmando...' : pendientes.length === 0 ? 'Todo Confirmado' : `Confirmar (${pendientes.length})`}
                                                        </button>
                                                    </div>
                                                );
                                            })()}
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
                                                    <th className="px-6 py-4">Dirección</th>
                                                    <th className="px-6 py-4">Fecha Mov.</th>
                                                    <th className="px-6 py-4">Datos Portal</th>
                                                    <th className="px-6 py-4">Servicio / Paquete</th>
                                                    <th className="px-6 py-4">Estado</th>
                                                    <th className="px-6 py-4">Acción</th>
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
                                                        <td className="px-6 py-4">
                                                            <div className="text-[11px] text-gray-700 font-black uppercase tracking-tight">
                                                                {cliente.cd}, {cliente.estado}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Registro</span>
                                                                    <span className="text-xs font-black text-gray-700 flex items-center gap-1">
                                                                        <Calendar size={12} className="text-telmex-blue" />
                                                                        {formatearFechaSimple(cliente.creado_en)}
                                                                    </span>
                                                                </div>
                                                                {cliente.estado_pipeline === 'posteado' && (
                                                                    <div className="flex flex-col border-t pt-1 border-gray-100">
                                                                        <span className="text-[10px] text-green-500 font-bold uppercase leading-none mb-1">Instalación</span>
                                                                        <span className="text-xs font-black text-green-700 flex items-center gap-1">
                                                                            <CheckCircle2 size={12} className="text-green-500" />
                                                                            {formatearFechaSimple(cliente.fecha_instalacion)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-2">
                                                                {/* SIAC Field */}
                                                                <div className="flex items-center gap-2 group/field">
                                                                    {editando?.id === cliente.id && editando?.campo === 'folio_siac' ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                autoFocus
                                                                                className="bg-white border-2 border-telmex-blue rounded px-2 py-0.5 text-[10px] font-mono w-24 outline-none"
                                                                                value={valorEditado}
                                                                                onChange={(e) => setValorEditado(e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') handleUpdateCliente(cliente, 'folio_siac', valorEditado);
                                                                                    if (e.key === 'Escape') setEditando(null);
                                                                                }}
                                                                            />
                                                                            <SaveIcon size={12} className="text-green-500 cursor-pointer" onClick={() => handleUpdateCliente(cliente, 'folio_siac', valorEditado)} />
                                                                        </div>
                                                                    ) : (
                                                                        <span
                                                                            className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-gray-200 transition-colors"
                                                                            onClick={() => {
                                                                                setEditando({ id: cliente.id, campo: 'folio_siac' });
                                                                                setValorEditado(cliente.folio_siac || '');
                                                                            }}
                                                                            title="Click para editar SIAC"
                                                                        >
                                                                            <Hash size={10} /> SIAC: {cliente.folio_siac || '---'}
                                                                            <Edit2 size={8} className="ml-1 opacity-0 group-hover/field:opacity-50" />
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* OS Field */}
                                                                <div className="flex items-center gap-2 group/field">
                                                                    {editando?.id === cliente.id && editando?.campo === 'orden_servicio' ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                autoFocus
                                                                                className="bg-white border-2 border-blue-400 rounded px-2 py-0.5 text-[10px] font-mono w-24 outline-none"
                                                                                value={valorEditado}
                                                                                onChange={(e) => setValorEditado(e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') handleUpdateCliente(cliente, 'orden_servicio', valorEditado);
                                                                                    if (e.key === 'Escape') setEditando(null);
                                                                                }}
                                                                            />
                                                                            <SaveIcon size={12} className="text-green-500 cursor-pointer" onClick={() => handleUpdateCliente(cliente, 'orden_servicio', valorEditado)} />
                                                                        </div>
                                                                    ) : (
                                                                        <span
                                                                            className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-blue-100 transition-colors"
                                                                            onClick={() => {
                                                                                setEditando({ id: cliente.id, campo: 'orden_servicio' });
                                                                                setValorEditado(cliente.orden_servicio || '');
                                                                            }}
                                                                            title="Click para editar Orden"
                                                                        >
                                                                            <Key size={10} /> ORDEN: {cliente.orden_servicio || '---'}
                                                                            <Edit2 size={8} className="ml-1 opacity-0 group-hover/field:opacity-50" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
                                                                {cliente.tipo_servicio.replace('_', ' ')}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-medium">
                                                                {cliente.paquete} ({cliente.velocidad} Megas) - {cliente.tipo_servicio === 'portabilidad' || cliente.incluye_telefono ? 'INTERNET Y TELEFONÍA' : 'SOLO INTERNET'}
                                                            </div>
                                                            <div className="text-[9px] text-telmex-blue font-black uppercase mt-0.5">
                                                                {cliente.tipo_servicio === 'portabilidad' || cliente.incluye_telefono ? 'Internet + Telefonía' : 'Solo Internet'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border-2 ${cliente.estado_pipeline === 'posteado'
                                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                                : cliente.estado_pipeline === 'capturado'
                                                                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                }`}>
                                                                {cliente.estado_pipeline === 'posteado' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                                {cliente.estado_pipeline.replace(/_/g, ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {cliente.estado_pipeline === 'capturado' ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleMarcarPosteado(cliente); }}
                                                                    disabled={marcandoPosteado[cliente.id]}
                                                                    className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-sm disabled:opacity-60"
                                                                >
                                                                    {marcandoPosteado[cliente.id] ? '⏳' : <CheckCircle2 size={12} />}
                                                                    {marcandoPosteado[cliente.id] ? 'Marcando...' : 'Marcar Posteado'}
                                                                </button>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400 font-medium">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-base font-black text-gray-900">
                                                                {cliente.estado_pipeline === 'posteado'
                                                                    ? formatearMoneda(cliente.comision || 0)
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

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
