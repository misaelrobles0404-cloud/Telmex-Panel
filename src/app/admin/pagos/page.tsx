'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { obtenerClientes, marcarComisionPagada, marcarTodasPagadasByEmail } from '@/lib/storage';
import { Cliente, PerfilUsuario } from '@/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Banknote, CheckCircle, Clock, Users, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { formatearMoneda } from '@/lib/utils';

function formatFecha(fechaStr?: string) {
    if (!fechaStr) return '---';
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PagosPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
    const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
    const [pagando, setPagando] = useState<Record<string, boolean>>({});
    const [pagandoTodos, setPagandoTodos] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState('');

    const mostrarToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const cargarDatos = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== 'carrillomarjory7@gmail.com') {
            router.push('/');
            return;
        }

        const [data, { data: perfilesData }] = await Promise.all([
            obtenerClientes(),
            supabase.from('perfiles').select('*')
        ]);

        // Solo clientes posteados con comisión confirmada
        const confirmados = data.filter(c =>
            c.estado_pipeline === 'posteado' && c.comision_confirmada === true
        );
        setClientes(confirmados);
        setPerfiles(perfilesData || []);
        setLoading(false);
    };

    useEffect(() => { cargarDatos(); }, []);

    const handlePagarUno = async (clienteId: string) => {
        setPagando(prev => ({ ...prev, [clienteId]: true }));
        try {
            await marcarComisionPagada(clienteId);
            mostrarToast('✅ Comisión marcada como pagada');
            await cargarDatos();
        } catch {
            mostrarToast('❌ Error al marcar como pagada');
        } finally {
            setPagando(prev => ({ ...prev, [clienteId]: false }));
        }
    };

    const handlePagarTodos = async (email: string) => {
        setPagandoTodos(prev => ({ ...prev, [email]: true }));
        try {
            await marcarTodasPagadasByEmail(email);
            mostrarToast(`✅ Todas las comisiones de ${email.split('@')[0]} marcadas como pagadas`);
            await cargarDatos();
        } catch {
            mostrarToast('❌ Error al marcar todas como pagadas');
        } finally {
            setPagandoTodos(prev => ({ ...prev, [email]: false }));
        }
    };

    // Agrupar por promotor
    const emailsUnicos = Array.from(new Set(clientes.map(c => c.usuario).filter(Boolean)));

    const totalPendiente = clientes.filter(c => !c.comision_pagada).reduce((acc, c) => acc + (c.comision || 0), 0);
    const totalPagado = clientes.filter(c => c.comision_pagada).reduce((acc, c) => acc + (c.comision || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-telmex-blue border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#001b44] to-[#0066cc] rounded-3xl p-6 md:p-8 text-white overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Banknote size={28} className="text-green-300" />
                            <h1 className="text-3xl font-extrabold tracking-tight">Módulo de Pagos</h1>
                        </div>
                        <p className="text-white/70 text-sm">Gestión de comisiones confirmadas y pagos a promotores</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                            <p className="text-[10px] font-black text-green-300 uppercase tracking-widest">Por Pagar</p>
                            <p className="text-2xl font-black text-white">{formatearMoneda(totalPendiente)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Pagado</p>
                            <p className="text-2xl font-black text-white">{formatearMoneda(totalPagado)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen de promotores */}
            {emailsUnicos.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-900 font-black text-xl">No hay comisiones confirmadas</p>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Confirma comisiones desde el Dashboard principal para verlas aquí.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 px-6 py-2 bg-telmex-blue text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
                    >
                        Ir al Dashboard
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {emailsUnicos.map(email => {
                        const perfil = perfiles.find(p => p.email === email);
                        const nombre = perfil?.nombre_completo || email.split('@')[0];
                        const clientesPromotor = clientes.filter(c => c.usuario === email);
                        const pendientes = clientesPromotor.filter(c => !c.comision_pagada);
                        const pagados = clientesPromotor.filter(c => c.comision_pagada);
                        const totalPromotor = pendientes.reduce((acc, c) => acc + (c.comision || 0), 0);
                        const isExpandido = expandidos[email] ?? true;

                        return (
                            <Card key={email} className="border-0 rounded-2xl overflow-hidden shadow-sm">
                                {/* Header promotor */}
                                <div
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-gray-50/80 transition-colors"
                                    onClick={() => setExpandidos(prev => ({ ...prev, [email]: !isExpandido }))}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-telmex-blue to-blue-600 flex items-center justify-center text-white text-xl font-black uppercase">
                                            {nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-extrabold text-gray-900">{nombre}</h3>
                                                {isExpandido ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                            </div>
                                            <p className="text-xs text-gray-500">{email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Por pagar</p>
                                            <p className="text-xl font-black text-gray-900">{formatearMoneda(totalPromotor)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                {pendientes.length} pendientes / {pagados.length} pagados
                                            </p>
                                            <Button
                                                onClick={() => handlePagarTodos(email)}
                                                disabled={pagandoTodos[email] || pendientes.length === 0}
                                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${pendientes.length === 0
                                                    ? 'bg-gray-100 text-gray-400 cursor-default border border-gray-200'
                                                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 active:scale-95'
                                                    }`}
                                            >
                                                {pagandoTodos[email] ? '⏳ Pagando...' : pendientes.length === 0 ? '✅ Todo Pagado' : `💸 Pagar Todo (${pendientes.length})`}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla de clientes */}
                                {isExpandido && (
                                    <CardContent className="p-0 overflow-x-auto border-t border-gray-100">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-black">
                                                    <th className="px-5 py-3">Cliente</th>
                                                    <th className="px-5 py-3">Tipo Servicio</th>
                                                    <th className="px-5 py-3">Folio SIAC</th>
                                                    <th className="px-5 py-3">Orden Servicio</th>
                                                    <th className="px-5 py-3">Comisión</th>
                                                    <th className="px-5 py-3">Estado Pago</th>
                                                    <th className="px-5 py-3 text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {clientesPromotor.map(cliente => (
                                                    <tr key={cliente.id} className={`hover:bg-blue-50/20 transition-colors ${cliente.comision_pagada ? 'opacity-60' : ''}`}>
                                                        <td className="px-5 py-3">
                                                            <div className="font-bold text-sm text-gray-900">{cliente.nombre}</div>
                                                            <div className="text-[10px] text-gray-400">Inst: {formatFecha(cliente.fecha_instalacion)}</div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">
                                                                {cliente.tipo_servicio?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="font-mono text-xs text-gray-700">{cliente.folio_siac || '---'}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="font-mono text-xs text-gray-700">{cliente.orden_servicio || '---'}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="font-black text-base text-gray-900">{formatearMoneda(cliente.comision || 0)}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            {cliente.comision_pagada ? (
                                                                <div>
                                                                    <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase">
                                                                        <CheckCircle size={12} /> Pagado
                                                                    </span>
                                                                    <span className="text-[9px] text-gray-400">{formatFecha(cliente.fecha_pago)}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[10px] font-black text-yellow-600 uppercase">
                                                                    <Clock size={12} /> Pendiente
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            {!cliente.comision_pagada && (
                                                                <button
                                                                    onClick={() => handlePagarUno(cliente.id)}
                                                                    disabled={pagando[cliente.id]}
                                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ml-auto transition-all active:scale-95 disabled:opacity-60"
                                                                >
                                                                    {pagando[cliente.id] ? '⏳' : '💸'} {pagando[cliente.id] ? 'Pagando...' : 'Pagar'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-bottom-4 z-50">
                    {toast}
                </div>
            )}
        </div>
    );
}
