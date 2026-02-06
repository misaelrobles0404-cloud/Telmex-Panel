'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cliente, Actividad, Documento, EstadoPipeline } from '@/types';
import { obtenerClientes, guardarCliente, eliminarCliente } from '@/lib/storage';
import { formatearMoneda, formatearFecha, formatearFechaHora, generarId } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, FileText, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DocumentManager } from '@/components/DocumentManager';

export default function ClienteDetallePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [nuevaNota, setNuevaNota] = useState('');
    const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);

    useEffect(() => {
        const clientes = obtenerClientes();
        const clienteEncontrado = clientes.find(c => c.id === params.id);
        setCliente(clienteEncontrado || null);
        setLoading(false);
    }, [params.id]);

    if (loading) return <div className="p-6">Cargando...</div>;
    if (!cliente) return <div className="p-6">Cliente no encontrado</div>;

    const actualizarEstado = (nuevoEstado: EstadoPipeline) => {
        if (!cliente) return;

        // Crear actividad de cambio de estado
        const actividad: Actividad = {
            id: generarId(),
            clienteId: cliente.id,
            tipo: 'cambio_estado',
            descripcion: `Estado actualizado de ${cliente.estadoPipeline} a ${nuevoEstado}`,
            fecha: new Date().toISOString(),
            // realizada: true // Removed as it's not in the type definition, implied by existence in history
        };

        const clienteActualizado = {
            ...cliente,
            estadoPipeline: nuevoEstado,
            actividades: [actividad, ...cliente.actividades],
            actualizadoEn: new Date().toISOString()
        };

        guardarCliente(clienteActualizado);
        setCliente(clienteActualizado);
    };

    const agregarNota = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cliente || !nuevaNota.trim()) return;

        const actividad: Actividad = {
            id: generarId(),
            clienteId: cliente.id,
            tipo: 'nota',
            descripcion: nuevaNota,
            fecha: new Date().toISOString(),
            // realizada: true
        };

        const clienteActualizado = {
            ...cliente,
            actividades: [actividad, ...cliente.actividades],
            actualizadoEn: new Date().toISOString()
        };

        guardarCliente(clienteActualizado);
        setCliente(clienteActualizado);
        setNuevaNota('');
    };

    const handleDocumentosChange = (nuevosDocumentos: Documento[]) => {
        if (!cliente) return;
        const clienteActualizado = { ...cliente, documentos: nuevosDocumentos };
        guardarCliente(clienteActualizado);
        setCliente(clienteActualizado);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4"
            >
                <ArrowLeft size={20} />
                Volver a Clientes
            </Button>

            {/* Encabezado del Cliente */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{cliente.nombre}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`badge ${cliente.tipoServicio === 'linea_nueva' ? 'badge-blue' :
                            cliente.tipoServicio === 'portabilidad' ? 'badge-purple' :
                                'badge-green'
                            }`}>
                            {cliente.tipoServicio === 'linea_nueva' ? 'Línea Nueva' :
                                cliente.tipoServicio === 'portabilidad' ? 'Portabilidad' : 'Winback'}
                        </span>
                        <span className="text-gray-500 text-sm">
                            Creado: {formatearFecha(cliente.creadoEn)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => {/* TODO: Implementar editar */ }}>
                        <Edit size={16} /> Editar
                    </Button>
                    <Button variant="danger" onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
                            if (cliente) {
                                eliminarCliente(cliente.id);
                                router.push('/clientes');
                            }
                        }
                    }}>
                        <Trash2 size={16} /> Eliminar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Detalles del Cliente */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Pipeline de Estado */}
                    <Card>
                        <CardContent className="p-6">
                            <label className="label mb-2">Estado del Pipeline</label>
                            <div className="flex flex-wrap gap-2">
                                {['contactado', 'interesado', 'cotizacion', 'cierre_programado', 'vendido', 'perdido'].map((estado) => (
                                    <button
                                        key={estado}
                                        onClick={() => actualizarEstado(estado as EstadoPipeline)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${cliente.estadoPipeline === estado
                                            ? 'bg-telmex-blue text-white border-telmex-blue'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-telmex-blue'
                                            }`}
                                    >
                                        {estado.replace('_', ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información de Contacto y Servicio */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Servicio</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Paquete</p>
                                <p className="font-medium">{cliente.paquete}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Precio Mensual</p>
                                <p className="font-medium text-telmex-blue">{formatearMoneda(cliente.precioMensual)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Velocidad</p>
                                <p className="font-medium">{cliente.velocidad} Mbps</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Comisión Estimada</p>
                                <p className="font-medium text-success text-lg">{formatearMoneda(cliente.comision)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Datos de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Phone className="text-gray-400" size={18} />
                                <div>
                                    <p className="text-sm text-gray-500">Teléfono (TT)</p>
                                    <p className="font-medium">{cliente.noTT}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="text-gray-400" size={18} />
                                <div>
                                    <p className="text-sm text-gray-500">Correo</p>
                                    <p className="font-medium">{cliente.correo}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="text-gray-400 mt-1" size={18} />
                                <div>
                                    <p className="text-sm text-gray-500">Dirección</p>
                                    <p className="font-medium">
                                        {cliente.calle} {cliente.colonia}, {cliente.cp}<br />
                                        {cliente.cd}, {cliente.estado}
                                    </p>
                                    {(cliente.entreCalle1 || cliente.entreCalle2) && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Entre: {cliente.entreCalle1} y {cliente.entreCalle2}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Historial de Actividad */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Actividad</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={agregarNota} className="mb-6">
                                <Textarea
                                    placeholder="Agregar una nota sobre este cliente..."
                                    value={nuevaNota}
                                    onChange={(e) => setNuevaNota(e.target.value)}
                                    className="mb-2"
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" variant="primary" size="sm" disabled={!nuevaNota.trim()}>
                                        Agregar Nota
                                    </Button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                {cliente.actividades.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No hay actividad registrada.</p>
                                ) : (
                                    cliente.actividades.map((actividad) => (
                                        <div key={actividad.id} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                            <div className={`mt-1 p-1.5 rounded-full ${actividad.tipo === 'cambio_estado' ? 'bg-blue-100 text-blue-600' :
                                                actividad.tipo === 'llamada' ? 'bg-green-100 text-green-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {actividad.tipo === 'cambio_estado' && <CheckCircle size={14} />}
                                                {actividad.tipo === 'llamada' && <Phone size={14} />}
                                                {(actividad.tipo === 'whatsapp' || actividad.tipo === 'correo') && <Mail size={14} />}
                                                {actividad.tipo === 'cita' && <Calendar size={14} />}
                                                {actividad.tipo === 'nota' && <FileText size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900">{actividad.descripcion}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatearFechaHora(actividad.fecha)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Documentos y Datos Adicionales */}
                <div className="space-y-6">

                    {/* Documentos Requeridos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                <span className="text-sm font-medium">INE/Identificación</span>
                                {cliente.ine ? (
                                    <span className="text-success text-xs flex items-center gap-1"><CheckCircle size={12} /> OK</span>
                                ) : (
                                    <span className="text-error text-xs">Pendiente</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                <span className="text-sm font-medium">CURP</span>
                                {cliente.curp ? (
                                    <span className="text-success text-xs flex items-center gap-1"><CheckCircle size={12} /> {cliente.curp}</span>
                                ) : (
                                    <span className="text-error text-xs">Pendiente</span>
                                )}
                            </div>

                            {(cliente.tipoServicio === 'portabilidad' || cliente.tipoServicio === 'winback') && (
                                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                    <span className="text-sm font-medium">NIP Portabilidad</span>
                                    {cliente.nipPortabilidad ? (
                                        <span className="text-success text-xs flex items-center gap-1"><CheckCircle size={12} /> OK</span>
                                    ) : (
                                        <span className="text-error text-xs">Pendiente</span>
                                    )}
                                </div>
                            )}

                            <div className="mt-4">
                                <Button
                                    variant="secondary"
                                    className="w-full text-sm"
                                    onClick={() => setModalDocumentosOpen(true)}
                                >
                                    <FileText size={16} /> Gestionar Documentos
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detalles Específicos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles Técnicos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500">No. Referencia</p>
                                <p className="font-medium text-gray-900">{cliente.noRef}</p>
                            </div>

                            {cliente.usuario && (
                                <div>
                                    <p className="text-gray-500">Usuario Asignado</p>
                                    <p className="font-medium text-gray-900">{cliente.usuario}</p>
                                </div>
                            )}

                            {(cliente.tipoServicio === 'portabilidad' || cliente.tipoServicio === 'winback') && (
                                <>
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="font-semibold text-gray-900 mb-2">Datos de Portabilidad</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Proveedor Anterior</p>
                                        <p className="font-medium text-gray-900 capitalize">{cliente.proveedorActual}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Número a Portar</p>
                                        <p className="font-medium text-gray-900">{cliente.numeroAPortar}</p>
                                    </div>
                                    {cliente.fechaVigencia && (
                                        <div>
                                            <p className="text-gray-500">Vigencia NIP</p>
                                            <p className="font-medium text-gray-900">{cliente.fechaVigencia}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal de Documentos */}
            <Modal
                isOpen={modalDocumentosOpen}
                onClose={() => setModalDocumentosOpen(false)}
                title="Gestión de Documentos"
                size="lg"
            >
                {cliente && (
                    <DocumentManager
                        clienteId={cliente.id}
                        documentos={cliente.documentos}
                        onDocumentosChange={handleDocumentosChange}
                    />
                )}
            </Modal>
        </div>
    );
}
