'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Cliente, PerfilUsuario } from '@/types';
import {
    DollarSign,
    Calendar,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    History,
    Download,
    Filter
} from 'lucide-react';
import { formatearMoneda } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Nomina {
    id: string;
    nombre: string;
    periodo_inicio: string;
    periodo_fin: string;
    total_comisiones: number;
    cantidad_ventas: number;
    estado: 'abierta' | 'cerrada' | 'pagada';
    creado_en: string;
}

export default function NominasPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [nominasHistorial, setNominasHistorial] = useState<Nomina[]>([]);
    const [clientesPendientes, setClientesPendientes] = useState<Cliente[]>([]);
    const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
    const [user, setUser] = useState<any>(null);

    // Calcular periodos (Jueves a Miércoles de la semana que acaba de cerrar)
    const getPeriodoSemanaPasada = () => {
        const hoy = new Date();
        const miercolesPasado = new Date(hoy);
        const diaSemana = hoy.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mie, 4 = Jue, 5 = Vie, 6 = Sab

        // Retroceder hasta el miércoles más cercano (si hoy es jue(4), vie(5), sab(6), dom(0), lun(1), mar(2))
        // Días a retroceder para llegar al miércoles: (diaSemana - 3 + 7) % 7
        // Si hoy es Miércoles (3), retrocedemos 7 días para el periodo anterior, o 0 si queremos el que cierra hoy.
        // El usuario dice que el JUEVES a las 5 AM ya deben estar listas.
        // Entonces si hoy es Jueves(4), el miércoles pasado fue ayer.

        const diasARetroceder = (diaSemana - 3 + 7) % 7 || 7;
        miercolesPasado.setDate(hoy.getDate() - diasARetroceder);
        miercolesPasado.setHours(23, 59, 59, 999);

        const juevesAnterior = new Date(miercolesPasado);
        juevesAnterior.setDate(miercolesPasado.getDate() - 6);
        juevesAnterior.setHours(0, 0, 0, 0);

        // Calcular número de semana (Semana 1 empieza el 2 de Feb 2026 - Lunes)
        // Ajustamos para que coincida con la lógica de periodos
        const fechaReferencia = new Date('2026-02-05'); // Jueves
        const diffDias = Math.floor((juevesAnterior.getTime() - fechaReferencia.getTime()) / (1000 * 60 * 60 * 24));
        const numSemana = Math.floor(diffDias / 7) + 1;

        return {
            inicio: juevesAnterior,
            fin: miercolesPasado,
            nombre: `NOMINA SEMANA ${numSemana}`
        };
    };

    const periodoActual = getPeriodoSemanaPasada();

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email !== 'ruizmosinfinitum2025@gmail.com') {
                    router.push('/');
                    return;
                }
                setUser(user);

                // Cargar Nomina Historial
                const { data: hist } = await supabase
                    .from('nominas')
                    .select('*')
                    .order('creado_en', { ascending: false });
                setNominasHistorial(hist || []);

                // Cargar Perfiles para nombres
                const { data: pf } = await supabase.from('perfiles').select('*');
                setPerfiles(pf || []);

                // Cargar Clientes Instalados sin Nómina
                const { data: clientesData } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('estado_pipeline', 'vendido')
                    .is('id_nomina', null);

                setClientesPendientes(clientesData || []);

            } catch (error) {
                console.error("Error cargando nóminas:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, [router]);

    const calcularComision = (tipo: string) => {
        if (tipo === 'portabilidad' || tipo === 'winback') return 300;
        return 250;
    };

    const generarNomina = async () => {
        if (clientesPendientes.length === 0) return;

        const total = clientesPendientes.reduce((acc, c) => acc + calcularComision(c.tipo_servicio), 0);

        try {
            // 1. Crear la Nómina
            const { data: nuevaNomina, error: nError } = await supabase
                .from('nominas')
                .insert({
                    nombre: periodoActual.nombre,
                    periodo_inicio: periodoActual.inicio.toISOString().split('T')[0],
                    periodo_fin: periodoActual.fin.toISOString().split('T')[0],
                    total_comisiones: total,
                    cantidad_ventas: clientesPendientes.length,
                    estado: 'cerrada',
                    creado_por: user.id
                })
                .select()
                .single();

            if (nError) throw nError;

            // 2. Actualizar Clientes
            const idsClientes = clientesPendientes.map(c => c.id);
            const { error: cError } = await supabase
                .from('clientes')
                .update({ id_nomina: nuevaNomina.id })
                .in('id', idsClientes);

            if (cError) throw cError;

            // Refrescar
            window.location.reload();

        } catch (error) {
            alert("Error al generar nómina");
            console.error(error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-telmex-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <DollarSign className="text-telmex-blue p-2 bg-blue-50 rounded-2xl w-12 h-12" />
                        Módulo de Nóminas
                    </h1>
                    <p className="text-gray-50 mt-2 font-medium">Corte semanal los Miércoles | Disponibles los Jueves 5:00 AM</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                        className="rounded-xl border-2"
                    >
                        Volver al Panel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={generarNomina}
                        disabled={clientesPendientes.length === 0}
                        className="rounded-xl shadow-lg shadow-telmex-blue/30"
                    >
                        Generar Corte de Nómina
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats Nómina Actual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-telmex-blue to-blue-700 text-white border-0 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <DollarSign size={120} />
                    </div>
                    <CardContent className="p-8 pt-10">
                        <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">{periodoActual.nombre}</p>
                        <h2 className="text-5xl font-black">
                            {formatearMoneda(clientesPendientes.reduce((acc, c) => acc + calcularComision(c.tipo_servicio), 0))}
                        </h2>
                        <div className="mt-6 flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1.5 rounded-full font-bold">
                            <Calendar size={14} />
                            Periodo: {periodoActual.inicio.toLocaleDateString()} - {periodoActual.fin.toLocaleDateString()}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-gray-50">
                    <CardContent className="p-8">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Ventas Instaladas</p>
                        <h2 className="text-5xl font-black text-gray-900">{clientesPendientes.length}</h2>
                        <div className="mt-6 flex items-center gap-2 text-sm text-green-600 font-bold">
                            <CheckCircle2 size={16} />
                            Listas para liquidación
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-gray-50">
                    <CardContent className="p-8">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Promotores Activos</p>
                        <h2 className="text-5xl font-black text-gray-900">
                            {new Set(clientesPendientes.map(c => c.usuario)).size}
                        </h2>
                        <div className="mt-6 flex items-center gap-2 text-sm text-blue-600 font-bold">
                            <History size={16} />
                            Pendientes de pago
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Listado de Ventas Pendientes de Nómina */}
            <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-telmex-blue text-white rounded-2xl flex items-center justify-center shadow-lg">
                                <Filter size={24} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-gray-900">Ventas para Liquidar</CardTitle>
                                <p className="text-gray-500 text-sm font-medium">Únicamente ventas instaladas sin folio de nómina</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/30 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-gray-100">
                                    <th className="px-8 py-5">Promotor</th>
                                    <th className="px-8 py-5">Cliente / Contacto</th>
                                    <th className="px-8 py-5">Clave Portal</th>
                                    <th className="px-8 py-5">Servicio / Paquete</th>
                                    <th className="px-8 py-5">Estado</th>
                                    <th className="px-8 py-5 text-right">Comisión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {clientesPendientes.map((cliente) => (
                                    <tr key={cliente.id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:bg-telmex-blue group-hover:text-white transition-colors">
                                                    {(perfiles.find(p => p.email === cliente.usuario)?.nombre_completo || cliente.usuario).charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {perfiles.find(p => p.email === cliente.usuario)?.nombre_completo || cliente.usuario.split('@')[0]}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{cliente.usuario}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-gray-800 text-sm">{cliente.nombre}</div>
                                            <div className="text-xs text-gray-500 font-medium mt-1">{cliente.no_tt}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-mono font-bold text-[11px] border border-gray-200 shadow-sm">
                                                {cliente.usuario_portal_asignado || '---'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-[11px] font-black text-blue-900 uppercase tracking-tight">
                                                {cliente.tipo_servicio.replace('_', ' ')}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-black mt-1 uppercase">
                                                {cliente.paquete} ({cliente.velocidad} Megas)
                                            </div>
                                            <div className="text-[9px] text-telmex-blue font-black uppercase mt-0.5">
                                                {cliente.incluye_telefono ? 'Internet + Telefonía' : 'Solo Internet'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 border-2 border-green-200">
                                                <CheckCircle2 size={12} />
                                                Instalado
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-lg font-black text-telmex-blue leading-none">
                                                {formatearMoneda(calcularComision(cliente.tipo_servicio))}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {clientesPendientes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <AlertCircle className="text-gray-300" size={40} />
                                            </div>
                                            <p className="text-xl font-black text-gray-900">No hay ventas pendientes por liquidar</p>
                                            <p className="text-gray-400 text-sm mt-1">Todas las instalaciones han sido procesadas en nóminas previas.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Histórico de Nóminas */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <History className="text-gray-400" />
                    <h2 className="text-2xl font-black text-gray-900">Histórico de Cierres</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nominasHistorial.map((n) => (
                        <Card key={n.id} className="hover:shadow-lg transition-all border-2 border-gray-100 group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">{n.nombre || 'Nómina Cerrada'}</p>
                                            <span className="badge badge-blue text-[9px] uppercase font-black">Finalizada</span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900">
                                            {new Date(n.periodo_inicio).toLocaleDateString()} - {new Date(n.periodo_fin).toLocaleDateString()}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">
                                            Ventas Liquidadas: <span className="text-gray-900 font-black">{n.cantidad_ventas}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-telmex-blue mb-2">
                                            {formatearMoneda(n.total_comisiones)}
                                        </p>
                                        <Button variant="ghost" size="sm" className="group-hover:bg-telmex-blue group-hover:text-white transition-colors rounded-xl">
                                            <Download size={16} />
                                            Exportar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {nominasHistorial.length === 0 && (
                        <div className="col-span-2 p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                            <p className="text-gray-400 font-bold">No hay cierres históricos registrados aún.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
