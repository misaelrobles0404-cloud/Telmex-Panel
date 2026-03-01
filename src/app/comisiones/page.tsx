'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cliente, EstadoPipeline } from '@/types';
import { obtenerClientes, guardarCliente } from '@/lib/storage';
import { formatearFecha, formatearMoneda, generarId } from '@/lib/utils';
import { CLAVES_PORTAL } from '@/data/claves';
import { CheckCircle, XCircle, Search, Calendar, AlertCircle, Copy } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ComisionesPage() {
    const [clientesPendientes, setClientesPendientes] = useState<Cliente[]>([]);
    const [clientesRechazados, setClientesRechazados] = useState<Cliente[]>([]); // Sin Cobertura
    const [clientesCancelados, setClientesCancelados] = useState<Cliente[]>([]); // Cancelados por cliente
    const [clientesPagados, setClientesPagados] = useState<Record<string, { clientes: Cliente[], total: number }>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

    const mostrarToast = (message: string) => {
        setToast({ message, isVisible: true });
    };

    const copiarAlPortapapeles = (e: React.MouseEvent, texto: string, label: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast(`${label} copiado`);
        });
    };

    const router = useRouter();

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const data = await obtenerClientes();

            // Filtrado: Misael ve todo, los demás (incluyendo Ruiz) solo lo suyo en esta vista personal
            const esSuperAdmin = user?.email === 'misaelrobles0404@gmail.com';

            const todos = esSuperAdmin
                ? data
                : data.filter(c => c.usuario === user?.email);

            // 1. Pendientes: Tienen folio SIAC pero no están instalados, rechazados ni cancelados
            const pendientes = todos.filter(c =>
                c.folio_siac &&
                c.folio_siac.trim() !== '' &&
                c.estado_pipeline !== 'posteado' &&
                c.estado_pipeline !== 'sin_cobertura' &&
                c.estado_pipeline !== 'cancelado'
            );
            setClientesPendientes(pendientes);

            // Seleccionar el primero por defecto si no hay uno seleccionado
            if (pendientes.length > 0 && !clienteSeleccionado) {
                setClienteSeleccionado(pendientes[0]);
            }

            // 1.5 Rechazados / No Instalados: Tienen folio SIAC y estado de rechazo técnico
            const rechazados = todos.filter(c =>
                c.folio_siac &&
                c.folio_siac.trim() !== '' &&
                c.estado_pipeline === 'sin_cobertura'
            );
            setClientesRechazados(rechazados);

            // 1.6 Cancelados: Cliente canceló o no quiso
            const cancelados = todos.filter(c =>
                c.folio_siac &&
                c.folio_siac.trim() !== '' &&
                c.estado_pipeline === 'cancelado'
            );
            setClientesCancelados(cancelados);

            // 2. Pagados/Instalados: Estado 'posteado'
            // Agrupar por semana de corte (Lunes)
            const vendidos = todos.filter(c => c.estado_pipeline === 'posteado');
            const agrupados: Record<string, { clientes: Cliente[], total: number }> = {};

            vendidos.forEach(cliente => {
                // Usar fecha_instalacion o actualizado_en como fallback
                const fechaRef = cliente.fecha_instalacion || cliente.actualizado_en;
                const corte = getFechaCorte(fechaRef);

                if (!agrupados[corte]) {
                    agrupados[corte] = { clientes: [], total: 0 };
                }

                agrupados[corte].clientes.push(cliente);
                agrupados[corte].total += cliente.comision;
            });

            // Ordenar claves de fecha descendente (más reciente primero)
            const ordenados = Object.keys(agrupados).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .reduce((obj, key) => {
                    obj[key] = agrupados[key];
                    return obj;
                }, {} as Record<string, { clientes: Cliente[], total: number }>);

            setClientesPagados(ordenados);

        } catch (error) {
            console.error("Error al cargar comisiones:", error);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener el próximo miércoles (o hoy si es miércoles)
    const getFechaCorte = (fechaStr: string) => {
        const fecha = new Date(fechaStr);
        const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

        // Queremos que el corte sea el Miércoles (3)
        // Días restantes para el próximo miércoles: (3 - diaSemana + 7) % 7
        const diasParaMiercoles = (3 - diaSemana + 7) % 7;

        const fechaCorte = new Date(fecha);
        fechaCorte.setDate(fecha.getDate() + diasParaMiercoles);

        return fechaCorte.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const confirmarInstalacion = async (cliente: Cliente) => {
        if (!confirm(`¿Confirmar instalación del folio ${cliente.folio_siac}?\n\nEsto marcará al cliente como INSTALADO y sumará la comisión a tus reportes.`)) return;

        setLoading(true);
        const hoy = new Date().toISOString();
        const clienteActualizado: Cliente = {
            ...cliente,
            estado_pipeline: 'posteado',
            fecha_instalacion: hoy, // Guardamos fecha exacta
            actualizado_en: hoy,
            actividades: [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: 'Instalación confirmada. Comisión activada.',
                    fecha: hoy
                },
                ...cliente.actividades || []
            ]
        };

        try {
            await guardarCliente(clienteActualizado);
            await cargarClientes();
        } catch (error) {
            alert('Error al confirmar instalación');
            setLoading(false);
        }
    };

    const reportarRechazo = async (cliente: Cliente) => {
        const motivo = prompt('Motivo de SIN COBERTURA / RECHAZO TÉCNICO:', 'Facilidades técnicas no disponibles');
        if (!motivo) return;

        setLoading(true);
        const clienteActualizado: Cliente = {
            ...cliente,
            estado_pipeline: 'sin_cobertura',
            actualizado_en: new Date().toISOString(),
            actividades: [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: `Instalación rechazada (Sin Cobertura). Motivo: ${motivo}`,
                    fecha: new Date().toISOString()
                },
                ...cliente.actividades || []
            ]
        };

        try {
            await guardarCliente(clienteActualizado);
            await cargarClientes();
        } catch (error) {
            alert('Error al reportar rechazo');
            setLoading(false);
        }
    };

    const reportarCancelacion = async (cliente: Cliente) => {
        const motivo = prompt('Motivo de CANCELACIÓN POR CLIENTE:', 'Cliente ya no desea el servicio');
        if (!motivo) return;

        setLoading(true);
        const clienteActualizado: Cliente = {
            ...cliente,
            estado_pipeline: 'cancelado',
            actualizado_en: new Date().toISOString(),
            actividades: [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: `Instalación cancelada por cliente. Motivo: ${motivo}`,
                    fecha: new Date().toISOString()
                },
                ...cliente.actividades || []
            ]
        };

        try {
            await guardarCliente(clienteActualizado);
            await cargarClientes();
        } catch (error) {
            alert('Error al reportar cancelación');
            setLoading(false);
        }
    };

    const pendientesFiltrados = clientesPendientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.folio_siac?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDiasTranscurridos = (fecha: string) => {
        const fechaCreacion = new Date(fecha).getTime();
        const ahora = new Date().getTime();
        const dias = Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60 * 24));
        return dias;
    };

    const marcarUsoPortal = async (cliente: Cliente) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setLoading(true);
        const hoy = new Date().toISOString();

        // Obtener perfil para el nombre
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre_completo')
            .eq('id', user.id)
            .single();

        const nombreUsuario = perfil?.nombre_completo || user.email || 'Usuario';

        const clienteActualizado: Cliente = {
            ...cliente,
            en_uso_por: nombreUsuario,
            en_uso_desde: hoy,
            actualizado_en: hoy,
            actividades: [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: `Portal en uso por ${nombreUsuario}`,
                    fecha: hoy
                },
                ...cliente.actividades || []
            ]
        };

        try {
            await guardarCliente(clienteActualizado);
            mostrarToast(`Marcado como en uso por ${nombreUsuario}`);
            await cargarClientes();
            setClienteSeleccionado(clienteActualizado);
        } catch (error) {
            alert('Error al marcar uso de portal');
            setLoading(false);
        }
    };

    const getDetallesClave = (usuarioId: string) => {
        for (const clave of CLAVES_PORTAL) {
            const usuarioEncontrado = clave.usuarios.find(u => u.usuario === usuarioId);
            if (usuarioEncontrado) {
                return {
                    tienda: clave.identificador,
                    nombre: usuarioEncontrado.nombre,
                    usuario: usuarioEncontrado.usuario
                };
            }
        }
        return null;
    };

    if (loading) return <div className="p-6">Cargando verificación...</div>;

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Comisiones</h1>
                    <p className="text-gray-600 mt-1">Cortes semanales los Miércoles.</p>
                </div>
                {/* Nuevo Banner Estilo Mockup Dinámico y Responsivo */}
                <div className="bg-[#f0f4ff] p-4 md:p-6 rounded-[32px] border border-blue-100 flex flex-col items-center gap-4 w-full max-w-5xl mx-auto shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-50">
                                <span className="text-blue-600">🔑</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-[#001b44] tracking-tight leading-tight">
                                Clave Universal de <br className="hidden md:block" /> Captura
                            </h2>
                        </div>

                        <div className="bg-[#eef2ff] px-4 py-2 rounded-full border border-blue-100 flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors group"
                            onClick={(e) => copiarAlPortapapeles(e as any, '10000900', 'Acceso Único')}>
                            <span className="text-[#3b82f6]">👤</span>
                            <span className="font-mono font-black text-[#3b82f6] text-sm md:text-base">10000900</span>
                            <Copy size={14} className="text-[#3b82f6] opacity-40 group-hover:opacity-100" />
                        </div>
                    </div>

                    <div className="w-full bg-[#fffcf0] border border-[#ffecb3] rounded-2xl p-3 flex items-center gap-3">
                        <span className="text-[#b45309]">🔒</span>
                        <span className="text-[#b45309] text-[10px] font-black uppercase tracking-widest">
                            Clave vinculada al folio SIAC
                        </span>
                    </div>

                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Panel de Datos Dinámicos del Cliente */}
                        <div className="bg-white rounded-2xl p-5 border border-blue-50 shadow-sm flex flex-col gap-4">
                            <div className="pb-3 border-b border-gray-100">
                                <p className="text-[#001b44] font-black text-sm uppercase leading-none">DATOS DEL CLIENTE</p>
                                <p className="text-[#001b44] font-black text-xs opacity-60">Selecciona en la tabla para cargar</p>
                            </div>

                            <div className="bg-[#e3f2ff] rounded-xl p-4 flex flex-col gap-4">
                                {/* Botones de Nombre */}
                                <div className="flex items-start gap-2">
                                    <div className="bg-[#0047b3] p-1.5 rounded-lg shadow-sm mt-1 shrink-0">
                                        <span className="text-white text-[10px] font-bold">ABC</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(clienteSeleccionado?.nombre || 'Sin Selección').split(' ').map((word, idx) => (
                                            <button
                                                key={`${word}-${idx}`}
                                                onClick={(e) => copiarAlPortapapeles(e as any, word.toUpperCase(), 'Nombre')}
                                                className="bg-white px-3 py-1.5 rounded-lg text-[11px] font-black text-[#001b44] shadow-sm border border-white hover:border-blue-300 transition-all active:scale-95 uppercase"
                                            >
                                                {word}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Botones de Folio y OS (Punto 2) */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#0047b3] p-1.5 rounded-lg shadow-sm shrink-0">
                                            <span className="text-white text-[10px] font-bold">SIAC</span>
                                        </div>
                                        <button
                                            disabled={!clienteSeleccionado?.folio_siac}
                                            onClick={(e) => clienteSeleccionado?.folio_siac && copiarAlPortapapeles(e as any, clienteSeleccionado.folio_siac, 'Folio')}
                                            className="bg-white flex-1 px-4 py-1.5 rounded-lg text-sm font-mono font-black text-[#0047b3] shadow-sm border border-white hover:border-blue-300 transition-all flex justify-between items-center group"
                                        >
                                            {clienteSeleccionado?.folio_siac || '---'}
                                            <Copy size={12} className="opacity-40 group-hover:opacity-100" />
                                        </button>
                                    </div>
                                    {clienteSeleccionado?.orden_servicio && (
                                        <div className="flex items-center gap-2">
                                            <div className="bg-[#0047b3] p-1.5 rounded-lg shadow-sm shrink-0">
                                                <span className="text-white text-[10px] font-bold">OS</span>
                                            </div>
                                            <button
                                                onClick={(e) => copiarAlPortapapeles(e as any, clienteSeleccionado.orden_servicio!, 'OS')}
                                                className="bg-white flex-1 px-4 py-1.5 rounded-lg text-sm font-mono font-black text-[#0047b3] shadow-sm border border-white hover:border-blue-300 transition-all flex justify-between items-center group"
                                            >
                                                {clienteSeleccionado.orden_servicio}
                                                <Copy size={12} className="opacity-40 group-hover:opacity-100" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Panel de Acción y Clave */}
                        <div className="bg-white rounded-2xl p-5 border border-blue-50 shadow-sm flex flex-col justify-between gap-4">
                            <div className="flex flex-col items-center gap-3">
                                <button
                                    onClick={() => clienteSeleccionado && marcarUsoPortal(clienteSeleccionado)}
                                    disabled={!clienteSeleccionado || !!clienteSeleccionado.en_uso_por}
                                    className={`rounded-xl py-3 px-6 shadow-sm border w-full flex items-center justify-center gap-3 transition-all ${clienteSeleccionado?.en_uso_por
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700 cursor-not-allowed'
                                        : 'bg-white border-gray-100 text-[#001b44] hover:border-blue-100 active:scale-95'
                                        }`}
                                >
                                    <span className="text-lg">{clienteSeleccionado?.en_uso_por ? '👤' : '🌐'}</span>
                                    <span className="font-black text-sm tracking-wide uppercase">
                                        {clienteSeleccionado?.en_uso_por
                                            ? `En uso por ${clienteSeleccionado.en_uso_por}`
                                            : 'Marcar Uso Portal'}
                                    </span>
                                </button>

                                <div
                                    className="bg-[#fff9f0] border-2 border-[#ffecb3] rounded-2xl py-4 px-8 flex items-center justify-center gap-4 cursor-pointer hover:bg-[#fff4e0] transition-colors group w-full"
                                    onClick={(e) => copiarAlPortapapeles(e as any, '337595', 'Clave Captura')}
                                >
                                    <span className="text-[#d97706] text-xl">🔓</span>
                                    <span className="font-mono text-3xl font-black text-[#d97706] tracking-widest">337595</span>
                                </div>
                            </div>

                            <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-tighter">
                                {clienteSeleccionado ? `Trabajando con: ${clienteSeleccionado.nombre}` : 'Sin cliente seleccionado'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: PENDIENTES DE INSTALACIÓN */}
            <Card className="border-l-4 border-l-yellow-400">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span>⏳ Pendientes de Instalación ({pendientesFiltrados.length})</span>
                        </CardTitle>
                        <div className="flex gap-2">
                            <a
                                href="https://siac-interac.telmex.com/siac_interactivo"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100 flex items-center gap-1 transition-colors"
                            >
                                <Search size={12} /> SIAC Interactivo
                            </a>
                            <a
                                href="https://portalwcex-2.telmex.com:4200/login"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition-colors"
                            >
                                <CheckCircle size={12} /> Portal WCEX
                            </a>
                        </div>
                    </div>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar pendientes..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {pendientesFiltrados.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            <p>No hay instalaciones pendientes.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left text-gray-500 font-medium whitespace-nowrap">
                                        <th className="py-2 px-4">Fecha</th>
                                        <th className="py-2 px-4">Folio SIAC / OS</th>
                                        <th className="py-2 px-4">Cliente</th>
                                        <th className="py-2 px-4">Comisión</th>
                                        <th className="py-2 px-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendientesFiltrados.map((cliente) => {
                                        const dias = getDiasTranscurridos(cliente.creado_en);
                                        return (
                                            <tr
                                                key={cliente.id}
                                                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${clienteSeleccionado?.id === cliente.id ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => setClienteSeleccionado(cliente)}
                                            >
                                                <td className="py-2 px-4 text-gray-600 align-top">
                                                    {formatearFecha(cliente.creado_en)}
                                                    {dias >= 2 && <span className="ml-2 text-xs text-red-600 font-bold">({dias}d)</span>}
                                                </td>
                                                <td className="py-2 px-4 align-top">
                                                    <div
                                                        className="font-mono text-gray-900 w-fit cursor-pointer hover:text-telmex-blue transition-colors flex items-center gap-1 group/item"
                                                        onClick={(e) => cliente.folio_siac && copiarAlPortapapeles(e, cliente.folio_siac, 'Folio')}
                                                        title="Click para copiar"
                                                    >
                                                        {cliente.folio_siac}
                                                        <Copy size={10} className="opacity-0 group-hover/item:opacity-50 transition-opacity" />
                                                    </div>
                                                    {cliente.orden_servicio && (
                                                        <div
                                                            className="font-mono text-xs text-blue-700 font-bold mt-1 w-fit bg-blue-50/50 px-1 rounded cursor-pointer hover:bg-blue-100 transition-colors flex items-center gap-1 group/item"
                                                            onClick={(e) => copiarAlPortapapeles(e, cliente.orden_servicio!, 'OS')}
                                                            title="Click para copiar"
                                                        >
                                                            OS: {cliente.orden_servicio}
                                                            <Copy size={10} className="opacity-0 group-hover/item:opacity-50 transition-opacity" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 align-top">
                                                    <div
                                                        className="flex flex-wrap gap-1.5"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {cliente.nombre.split(' ').map((parte, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={(e) => copiarAlPortapapeles(e as any, parte.toUpperCase(), 'Nombre')}
                                                                className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-gray-700 hover:bg-telmex-blue hover:text-white hover:border-telmex-blue transition-all active:scale-95 shadow-sm uppercase"
                                                                title={`Copiar "${parte}"`}
                                                            >
                                                                {parte}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 text-green-600 font-medium align-top">{formatearMoneda(cliente.comision)}</td>
                                                <td className="py-2 px-4 text-right align-top">
                                                    <div className="flex justify-end gap-2">
                                                        {cliente.en_uso_por && (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-black rounded-lg border border-yellow-200 animate-pulse">
                                                                <span>👤 EN USO POR: {cliente.en_uso_por.toUpperCase()}</span>
                                                            </div>
                                                        )}
                                                        <Button size="sm" variant="outline" className="text-telmex-blue border-blue-200 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); router.push(`/clientes/${cliente.id}`); }} title="Ver Detalle">
                                                            <Search size={14} /> Ver
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); reportarCancelacion(cliente); }} title="Cliente Canceló">
                                                            Cancelar
                                                        </Button>
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={(e) => { e.stopPropagation(); confirmarInstalacion(cliente); }} title="Confirmar">
                                                            <CheckCircle size={16} /> Confirmar
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SECCIÓN 1.5: SIN COBERTURA / RECHAZADAS */}
            {clientesRechazados.length > 0 && (
                <Card className="border-l-4 border-l-orange-500 bg-orange-50/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl text-orange-700 flex items-center gap-2">
                            <AlertCircle size={24} />
                            <span>Sin Cobertura / Rechazo Técnico ({clientesRechazados.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-orange-200 text-left text-orange-600 font-medium">
                                        <th className="py-2 px-4">Fecha</th>
                                        <th className="py-2 px-4">Folio SIAC</th>
                                        <th className="py-2 px-4">Cliente</th>
                                        <th className="py-2 px-4">Estado</th>
                                        <th className="py-2 px-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientesRechazados.map((cliente) => (
                                        <tr
                                            key={cliente.id}
                                            className="border-b border-orange-100 hover:bg-orange-50 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/clientes/${cliente.id}`)}
                                        >
                                            <td className="py-2 px-4 text-gray-600">{formatearFecha(cliente.actualizado_en)}</td>
                                            <td className="py-2 px-4 font-mono">{cliente.folio_siac}</td>
                                            <td className="py-2 px-4 font-medium">{cliente.nombre}</td>
                                            <td className="py-2 px-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                                    SIN COBERTURA
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={(e) => {
                                                    e.stopPropagation(); // Evitar navegación al clickear botón
                                                    confirmarInstalacion(cliente);
                                                }} title="Reactivar / Confirmar">
                                                    <CheckCircle size={16} /> Reactivar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* SECCIÓN 1.6: CANCELADAS */}
            {clientesCancelados.length > 0 && (
                <Card className="border-l-4 border-l-red-500 bg-red-50/50 mb-8">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl text-red-700 flex items-center gap-2">
                            <XCircle size={24} />
                            <span>Cancelaciones / Bajas ({clientesCancelados.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-red-200 text-left text-red-600 font-medium">
                                        <th className="py-2 px-4">Fecha</th>
                                        <th className="py-2 px-4">Folio SIAC</th>
                                        <th className="py-2 px-4">Cliente</th>
                                        <th className="py-2 px-4">Motivo</th>
                                        <th className="py-2 px-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientesCancelados.map((cliente) => (
                                        <tr
                                            key={cliente.id}
                                            className="border-b border-red-100 hover:bg-red-50 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/clientes/${cliente.id}`)}
                                        >
                                            <td className="py-2 px-4 text-gray-600">{formatearFecha(cliente.actualizado_en)}</td>
                                            <td className="py-2 px-4 font-mono">{cliente.folio_siac}</td>
                                            <td className="py-2 px-4 font-medium">{cliente.nombre}</td>
                                            <td className="py-2 px-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                    CANCELADO
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmarInstalacion(cliente);
                                                }} title="Reactivar / Confirmar">
                                                    <CheckCircle size={16} /> Reactivar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* SECCIÓN 2: HISTORIAL DE PAGOS (AGRUPADO POR CORTE) */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-telmex-blue" />
                    Historial de Cortes (Miércoles)
                </h2>

                {Object.entries(clientesPagados).length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-400">Aún no hay comisiones liberadas.</p>
                    </div>
                ) : (
                    Object.entries(clientesPagados).map(([fechaCorte, datos]) => (
                        <Card key={fechaCorte} className="overflow-hidden border-green-100">
                            <div className="bg-green-50 p-4 flex justify-between items-center border-b border-green-100">
                                <div>
                                    <p className="text-sm text-green-700 font-medium uppercase tracking-wide">Corte Semana</p>
                                    <p className="text-lg font-bold text-green-900">{formatearFecha(fechaCorte)} (Miércoles)</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-green-700 font-medium">Total a Pagar</p>
                                    <p className="text-2xl font-bold text-green-700">{formatearMoneda(datos.total)}</p>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr className="text-left text-gray-500">
                                                <th className="py-2 px-4 font-normal">Instalado el</th>
                                                <th className="py-2 px-4 font-normal">Cliente</th>
                                                <th className="py-2 px-4 font-normal">Folio SIAC</th>
                                                <th className="py-2 px-4 font-normal text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {datos.clientes.map(cliente => (
                                                <tr
                                                    key={cliente.id}
                                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => router.push(`/clientes/${cliente.id}`)}
                                                >
                                                    <td className="py-2 px-4 text-gray-600">
                                                        {formatearFecha(cliente.fecha_instalacion || cliente.actualizado_en)}
                                                    </td>
                                                    <td className="py-2 px-4 font-medium text-gray-900">{cliente.nombre}</td>
                                                    <td className="py-2 px-4 font-mono text-gray-600">{cliente.folio_siac}</td>
                                                    <td className="py-2 px-4 text-right font-medium text-green-600">
                                                        {formatearMoneda(cliente.comision)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
