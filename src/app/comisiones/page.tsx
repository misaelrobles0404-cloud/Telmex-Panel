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
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const todos = await obtenerClientes();
            const filtrados = todos.filter(c =>
                c.folioSiac &&
                c.folioSiac.trim() !== '' &&
                c.estadoPipeline !== 'vendido' &&
                c.estadoPipeline !== 'perdido'
            );
            setClientes(filtrados);
        } catch (error) {
            console.error("Error al cargar comisiones:", error);
        } finally {
            setLoading(false);
        }
    };

    const confirmarInstalacion = async (cliente: Cliente) => {
        if (!confirm(`¿Confirmar instalación del folio ${cliente.folioSiac}?\n\nEsto marcará al cliente como VENDIDO y sumará la comisión a tus reportes.`)) return;

        setLoading(true);
        const clienteActualizado: Cliente = {
            ...cliente,
            estadoPipeline: 'vendido',
            actualizadoEn: new Date().toISOString(),
            actividades: [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: 'Instalación confirmada. Comisión activada.',
                    fecha: new Date().toISOString()
                },
                ...cliente.actividades
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
            estadoPipeline: 'perdido',
            actualizadoEn: new Date().toISOString(),
            actividades: [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: `Instalación rechazada/cancelada. Motivo: ${motivo}`,
                    fecha: new Date().toISOString()
                },
                ...cliente.actividades
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

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.folioSiac?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDiasTranscurridos = (fecha: string) => {
        const fechaCreacion = new Date(fecha).getTime();
        const ahora = new Date().getTime();
        const dias = Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60 * 24));
        return dias;
    };

    if (loading) return <div className="p-6">Cargando verificación...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Verificación de Comisiones</h1>
                    <p className="text-gray-600 mt-1">Confirma las instalaciones para liberar tus comisiones.</p>
                </div>
                {/* <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {clientes.length} instalaciones pendientes
                </div> */}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar por nombre o folio SIAC..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {clientesFiltrados.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <CheckCircle size={48} className="mx-auto mb-4 text-green-100" />
                            <p>¡Todo al día! No tienes instalaciones pendientes de verificar.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left text-gray-500 font-medium">
                                        <th className="py-3 px-4">Fecha Captura</th>
                                        <th className="py-3 px-4">Folio SIAC</th>
                                        <th className="py-3 px-4">Cliente</th>
                                        <th className="py-3 px-4">Paquete</th>
                                        <th className="py-3 px-4">Comisión</th>
                                        <th className="py-3 px-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientesFiltrados.map((cliente) => {
                                        const dias = getDiasTranscurridos(cliente.creadoEn);
                                        const esUrgente = dias >= 2;

                                        return (
                                            <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {formatearFecha(cliente.creadoEn)}
                                                        {esUrgente && (
                                                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                                                {dias} días
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-medium text-gray-700">
                                                    {cliente.folioSiac}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">{cliente.nombre}</div>
                                                    <div className="text-gray-500 text-xs">{cliente.tipoServicio.replace('_', ' ').toUpperCase()}</div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">{cliente.paquete}</td>
                                                <td className="py-3 px-4 font-medium text-green-600">
                                                    {formatearMoneda(cliente.comision)}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            className="h-8 px-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                            onClick={() => reportarRechazo(cliente)}
                                                            title="Reportar problema/rechazo"
                                                        >
                                                            <XCircle size={16} />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-green-600 hover:bg-green-700 text-white border-green-700"
                                                            onClick={() => confirmarInstalacion(cliente)}
                                                            title="Confirmar Instalación"
                                                        >
                                                            <CheckCircle size={16} className="mr-1.5" />
                                                            Confirmar
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
        </div>
    );
}
