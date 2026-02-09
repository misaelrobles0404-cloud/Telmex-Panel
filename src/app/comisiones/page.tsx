'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cliente, EstadoPipeline } from '@/types';
import { obtenerClientes, guardarCliente } from '@/lib/storage';
import { formatearFecha, formatearMoneda, generarId } from '@/lib/utils';
import { CheckCircle, XCircle, Search, Calendar, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function ComisionesPage() {
    const [clientesPendientes, setClientesPendientes] = useState<Cliente[]>([]);
    const [clientesPagados, setClientesPagados] = useState<Record<string, { clientes: Cliente[], total: number }>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const todos = await obtenerClientes();

            // 1. Pendientes: Tienen folio SIAC pero no están vendidos
            const pendientes = todos.filter(c =>
                c.folio_siac &&
                c.folio_siac.trim() !== '' &&
                c.estado_pipeline !== 'vendido'
            );
            setClientesPendientes(pendientes);

            // 2. Pagados/Vendidos: Estado 'vendido'
            // Agrupar por semana de corte (Miércoles)
            const vendidos = todos.filter(c => c.estado_pipeline === 'vendido');
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
        const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 3 = Miércoles

        const diasParaMiercoles = (3 - diaSemana + 7) % 7;
        // Si hoy es miércoles (diasParaMiercoles es 0), el corte es hoy.
        // Si no, sumamos los días necesarios.

        const fechaCorte = new Date(fecha);
        fechaCorte.setDate(fecha.getDate() + diasParaMiercoles);

        return fechaCorte.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const confirmarInstalacion = async (cliente: Cliente) => {
        if (!confirm(`¿Confirmar instalación del folio ${cliente.folio_siac}?\n\nEsto marcará al cliente como VENDIDO y sumará la comisión a tus reportes.`)) return;

        setLoading(true);
        const hoy = new Date().toISOString();
        const clienteActualizado: Cliente = {
            ...cliente,
            estado_pipeline: 'vendido',
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
        const motivo = prompt('Motivo del rechazo (ej. Facilidades técnicas, Cliente canceló):');
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
                    descripcion: `Instalación rechazada/cancelada. Motivo: ${motivo}`,
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

    if (loading) return <div className="p-6">Cargando verificación...</div>;

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Comisiones</h1>
                    <p className="text-gray-600 mt-1">Cortes semanales los Miércoles.</p>
                </div>
            </div>

            {/* SECCIÓN 1: PENDIENTES DE INSTALACIÓN */}
            <Card className="border-l-4 border-l-yellow-400">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center justify-between">
                        <span>⏳ Pendientes de Instalación ({pendientesFiltrados.length})</span>
                    </CardTitle>
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
                                    <tr className="border-b border-gray-200 text-left text-gray-500 font-medium">
                                        <th className="py-2 px-4">Fecha</th>
                                        <th className="py-2 px-4">Folio SIAC</th>
                                        <th className="py-2 px-4">Cliente</th>
                                        <th className="py-2 px-4">Comisión</th>
                                        <th className="py-2 px-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendientesFiltrados.map((cliente) => {
                                        const dias = getDiasTranscurridos(cliente.creado_en);
                                        return (
                                            <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-2 px-4 text-gray-600">
                                                    {formatearFecha(cliente.creado_en)}
                                                    {dias >= 2 && <span className="ml-2 text-xs text-red-600 font-bold">({dias}d)</span>}
                                                </td>
                                                <td className="py-2 px-4 font-mono">{cliente.folio_siac}</td>
                                                <td className="py-2 px-4 font-medium">{cliente.nombre}</td>
                                                <td className="py-2 px-4 text-green-600 font-medium">{formatearMoneda(cliente.comision)}</td>
                                                <td className="py-2 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="danger" onClick={() => reportarRechazo(cliente)} title="Rechazar">
                                                            <XCircle size={16} />
                                                        </Button>
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmarInstalacion(cliente)} title="Confirmar">
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
                                                <tr key={cliente.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
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
        </div>
    );
}
