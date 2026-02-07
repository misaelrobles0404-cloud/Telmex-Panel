'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cliente, Actividad, Documento, EstadoPipeline } from '@/types';
import { obtenerClientes, obtenerCliente, guardarCliente, eliminarCliente } from '@/lib/storage';
import { formatearMoneda, formatearFecha, formatearFechaHora, generarId } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, FileText, CheckCircle, Copy, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DocumentManager } from '@/components/DocumentManager';

export default function ClienteDetallePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [nuevaNota, setNuevaNota] = useState('');
    const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);
    const [modalReferidosOpen, setModalReferidosOpen] = useState(false);
    const [modalSeguimientoOpen, setModalSeguimientoOpen] = useState(false);
    const [folioSiacInput, setFolioSiacInput] = useState('');

    useEffect(() => {
        const cargarCliente = async () => {
            try {
                const data = await obtenerCliente(params.id);
                if (data) {
                    setCliente(data);
                    setFolioSiacInput(data.folioSiac || '');
                }
            } catch (error) {
                console.error("Error al cargar cliente:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarCliente();
    }, [params.id]);

    if (loading) return <div className="p-6">Cargando...</div>;
    if (!cliente) return <div className="p-6">Cliente no encontrado</div>;

    const actualizarEstado = async (nuevoEstado: EstadoPipeline) => {
        if (!cliente) return;

        const actividad: Actividad = {
            id: generarId(),
            clienteId: cliente.id,
            tipo: 'cambio_estado',
            descripcion: `Estado actualizado de ${cliente.estadoPipeline} a ${nuevoEstado}`,
            fecha: new Date().toISOString(),
        };

        const clienteActualizado = {
            ...cliente,
            estadoPipeline: nuevoEstado,
            actividades: [actividad, ...cliente.actividades],
            actualizadoEn: new Date().toISOString()
        };

        try {
            await guardarCliente(clienteActualizado);
            setCliente(clienteActualizado);
        } catch (error) {
            alert('Error al actualizar estado');
        }
    };

    const agregarNota = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cliente || !nuevaNota.trim()) return;

        const actividad: Actividad = {
            id: generarId(),
            clienteId: cliente.id,
            tipo: 'nota',
            descripcion: nuevaNota,
            fecha: new Date().toISOString(),
        };

        const clienteActualizado = {
            ...cliente,
            actividades: [actividad, ...cliente.actividades],
            actualizadoEn: new Date().toISOString()
        };

        try {
            await guardarCliente(clienteActualizado);
            setCliente(clienteActualizado);
            setNuevaNota('');
        } catch (error) {
            alert('Error al agregar nota');
        }
    };

    const handleDocumentosChange = async (nuevosDocumentos: Documento[]) => {
        if (!cliente) return;
        const clienteActualizado = { ...cliente, documentos: nuevosDocumentos };
        try {
            await guardarCliente(clienteActualizado);
            setCliente(clienteActualizado);
        } catch (error) {
            alert('Error al actualizar documentos');
        }
    };

    const guardarFolioSiac = async () => {
        if (!cliente) return;

        const nuevoEstado: EstadoPipeline = 'cierre_programado';

        const clienteActualizado: Cliente = {
            ...cliente,
            folioSiac: folioSiacInput,
            estadoPipeline: cliente.estadoPipeline === 'vendido' ? 'vendido' : nuevoEstado,
            actualizadoEn: new Date().toISOString()
        };

        if (cliente.estadoPipeline !== nuevoEstado && cliente.estadoPipeline !== 'vendido') {
            clienteActualizado.actividades = [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: `Folio SIAC asignado: ${folioSiacInput}. Estado actualizado a Cierre Programado.`,
                    fecha: new Date().toISOString()
                },
                ...cliente.actividades
            ];
        }

        try {
            await guardarCliente(clienteActualizado);
            setCliente(clienteActualizado);
            alert('Folio SIAC guardado en la nube.');
        } catch (error) {
            alert('Error al guardar Folio SIAC');
        }
    };

    const generarFormatoSIAC = () => {
        if (!cliente) return;

        let formato = '';

        if (cliente.tipoCliente === 'pyme') {
            formato = `PLANTILLA PARA CLIENTE PYME
NOMBRE DE PROMOTOR: AILTON MISAEL AGUILAR ROBLES
—————————————————
FECHA DE CAPTURA: ${new Date().toLocaleDateString('es-MX')}
—————————————————
FOLIO SIAC: ${cliente.folioSiac || 'PENDIENTE'}
—————————————————
NOMBRE DE CLIENTE: 
${cliente.nombre.toUpperCase()}
—————————————————
■ NUM. TITULAR:  ${cliente.noTT}
■ NUM. REFERENCIA 1: ${cliente.noRef}
■ NUM. REFERENCIA 2: 
■ CORREO: ${cliente.correo}
—————————————————
CALLE: ${cliente.calle.toUpperCase()}
NÚMERO: ${cliente.numeroExterior ? cliente.numeroExterior : ''} ${cliente.numeroInterior ? `INT ${cliente.numeroInterior}` : ''} 
MANZ:    LOT:    EDF:    DPTO:
ENTRE 1: ${cliente.entreCalle1 ? cliente.entreCalle1.toUpperCase() : ''}
ENTRE 2: ${cliente.entreCalle2 ? cliente.entreCalle2.toUpperCase() : ''}
COLONIA: ${cliente.colonia.toUpperCase()}
CP: ${cliente.cp}
CIUDAD: ${cliente.cd.toUpperCase()}
ESTADO: ${cliente.estado.toUpperCase()}
—————————————————
PAQUETE COMERCIAL: ${cliente.paquete} ($${cliente.precioMensual + 100})
—————————————————
GASTOS DE INSTALACION
☐ $400 DE PAGO INICIAL & 12 MESES DE $100 (TOTAL) $1,600`;
        } else if (cliente.tipoServicio === 'portabilidad') {
            formato = `PLANTILLA PARA PORTABILIDAD
NOMBRE DE PROMOTOR: AILTON MISAEL AGUILAR ROBLES
—————————————————
FECHA DE CAPTURA: ${new Date().toLocaleDateString('es-MX')}
—————————————————
FOLIO SIAC: ${cliente.folioSiac || 'PENDIENTE'}
—————————————————
**PORTABILIDAD**
NIP: ${cliente.nipPortabilidad || ''}
GENERICO: 
NUMERO A SER PORTADO: ${cliente.numeroAPortar || ''}
((COMPETIDOR)): ${cliente.proveedorActual ? cliente.proveedorActual.toUpperCase() : ''}
—————————————————
NOMBRE DE CLIENTE: 
${cliente.nombre.toUpperCase()}
—————————————————
■ NUM. TITULAR:  ${cliente.noTT}
■ NUM. REFERENCIA 1: ${cliente.noRef}
■ NUM. REFERENCIA 2: 
■ CORREO: ${cliente.correo}
—————————————————
CALLE: ${cliente.calle.toUpperCase()}
NÚMERO: ${cliente.numeroExterior ? cliente.numeroExterior : ''} ${cliente.numeroInterior ? `INT ${cliente.numeroInterior}` : ''} 
MANZ:    LOT:    EDF:    DPTO:
ENTRE 1: ${cliente.entreCalle1 ? cliente.entreCalle1.toUpperCase() : ''}
ENTRE 2: ${cliente.entreCalle2 ? cliente.entreCalle2.toUpperCase() : ''}
COLONIA: ${cliente.colonia.toUpperCase()}
CP: ${cliente.cp}
CIUDAD: ${cliente.cd.toUpperCase()}
ESTADO: ${cliente.estado.toUpperCase()}
—————————————————
PAQUETE: ${cliente.paquete}
—————————————————
GASTOS DE INSTALACION
***SIN GASTO DE INSTALACION, NO APLICA POR PROMOCION***`;
        } else if (cliente.tipoServicio === 'winback') {
            formato = `PLANTILLA PARA WIN-BACK (ALTA INTERNET RECUPERADO)
NOMBRE DE PROMOTOR: AILTON MISAEL AGUILAR ROBLES
—————————————————
FECHA DE CAPTURA: ${new Date().toLocaleDateString('es-MX')}
—————————————————
FOLIO SIAC: ${cliente.folioSiac || 'PENDIENTE'}
—————————————————
**ALTAN INTERNET RECUPERADO: WIN-BACK**
((COMPETIDOR)): ${cliente.proveedorActual ? cliente.proveedorActual.toUpperCase() : ''}
—————————————————
NOMBRE DE CLIENTE: 
${cliente.nombre.toUpperCase()}
—————————————————
■ NUM. TITULAR:  ${cliente.noTT}
■ NUM. REFERENCIA 1: ${cliente.noRef}
■ NUM. REFERENCIA 2: 
■ CORREO: ${cliente.correo}
—————————————————
CALLE: ${cliente.calle.toUpperCase()}
NÚMERO: ${cliente.numeroExterior ? cliente.numeroExterior : ''} ${cliente.numeroInterior ? `INT ${cliente.numeroInterior}` : ''} 
MANZ:    LOT:    EDF:    DPTO:
ENTRE 1: ${cliente.entreCalle1 ? cliente.entreCalle1.toUpperCase() : ''}
ENTRE 2: ${cliente.entreCalle2 ? cliente.entreCalle2.toUpperCase() : ''}
COLONIA: ${cliente.colonia.toUpperCase()}
CP: ${cliente.cp}
CIUDAD: ${cliente.cd.toUpperCase()}
ESTADO: ${cliente.estado.toUpperCase()}
—————————————————
PAQUETE: ${cliente.paquete}
—————————————————
GASTOS DE INSTALACION
***SIN GASTO DE INSTALACION, NO APLICA POR PROMOCION***`;
        } else {
            // Formato para Línea Nueva
            formato = `NOMBRE DE PROMOTOR: AILTON MISAEL AGUILAR ROBLES
—————————————————
FECHA DE CAPTURA: ${new Date().toLocaleDateString('es-MX')}
—————————————————
FOLIO SIAC: ${cliente.folioSiac || 'PENDIENTE'}

—————————————————
NOMBRE DE CLIENTE: 
${cliente.nombre.toUpperCase()}

—————————————————
NUM. TITULAR:  
${cliente.noTT}
NUM. REFERENCIA:
${cliente.noRef}
CORREO:
${cliente.correo}
—————————————————
CALLE: ${cliente.calle.toUpperCase()}
NÚMERO: ${cliente.numeroExterior ? cliente.numeroExterior : ''} 
ENTRE 1: ${cliente.entreCalle1 ? cliente.entreCalle1.toUpperCase() : ''}
ENTRE 2: ${cliente.entreCalle2 ? cliente.entreCalle2.toUpperCase() : ''}
COLONIA: ${cliente.colonia.toUpperCase()}
CP: ${cliente.cp}
CIUDAD: ${cliente.cd.toUpperCase()}
ESTADO: ${cliente.estado.toUpperCase()}
—————————————————
PAQUETE: ${cliente.paquete} ($${cliente.precioMensual + 100})
INTERNET Y TELEFONÍA 
—————————————————
GASTOS DE INSTALACION
☐ $400 DE PAGO INICIAL & 12 MESES DE $100 (TOTAL) $1,600`;
        }

        navigator.clipboard.writeText(formato).then(() => {
            alert('¡Formato copiado al portapapeles!');
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('Error al copiar el formato');
        });
    };

    const copiarTelefono = () => {
        if (!cliente) return;
        navigator.clipboard.writeText(cliente.noTT).then(() => {
            alert('Teléfono copiado. Búscalo en WhatsApp.');
        });
    };

    const copiarMensajeReferidos = () => {
        if (!cliente) return;

        const mensaje = `¡Hola ${cliente.nombre.split(' ')[0]}! 🌟

Espero que estés disfrutando tu nuevo internet TELMEX.

Quería pedirte un pequeño favor:
¿Conoces a algún amigo, vecino o familiar que esté batallando con su internet? 🤔

Si me pasas su contacto y contrata, ¡te lo agradeceré muchísimo! Mi trabajo depende de recomendaciones de clientes felices como tú. 🙏

¡Gracias por tu apoyo!`;

        navigator.clipboard.writeText(mensaje).then(() => {
            alert('Mensaje copiado. Pégalo en el chat.');
            setModalReferidosOpen(false);
        });
    };



    const copiarMensajeSeguimiento = () => {
        if (!cliente) return;

        const nombre = cliente.nombre.includes('Prospecto') ? '' : ` ${cliente.nombre.split(' ')[0]}`;
        const direccion = cliente.calle !== 'PENDIENTE' ? cliente.calle : 'tu domicilio';
        const paquete = cliente.paquete !== 'POR DEFINIR' ? cliente.paquete : 'el paquete que cotizamos';

        const mensaje = `¡Hola${nombre}! 👋

Te escribo para dar seguimiento a tu trámite de internet TELMEX. 🚀

Tenemos estos datos registrados:
📦 Paquete: ${paquete}
💰 Precio: $${cliente.precioMensual}/mes
📍 Dirección: ${direccion}

¿Te gustaría que procedamos con la instalación/validación? 🤔
Solo necesito que me confirmes para agendar.

¡Quedo atento!`;

        navigator.clipboard.writeText(mensaje).then(() => {
            alert('Mensaje de seguimiento copiado.');
            setModalSeguimientoOpen(false);
        });
    };

    const solicitarReferidos = () => {
        if (!cliente) return;
        setModalReferidosOpen(true);
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
                            Creado: {formatearFechaHora(cliente.creadoEn)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {cliente.estadoPipeline !== 'vendido' && cliente.estadoPipeline !== 'perdido' && (
                        <Button
                            variant="secondary"
                            onClick={() => setModalSeguimientoOpen(true)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            title="Dar seguimiento a prospecto"
                        >
                            <span className="mr-1">📨</span> Dar Seguimiento
                        </Button>
                    )}

                    {cliente.estadoPipeline === 'vendido' && (
                        <Button
                            variant="secondary"
                            onClick={() => setModalReferidosOpen(true)}
                            className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                            title="Pedir referidos a cliente feliz"
                        >
                            <span className="mr-1">🎁</span> Pedir Referidos
                        </Button>
                    )}
                    <Button variant="secondary" onClick={generarFormatoSIAC} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                        <Copy size={16} /> Copiar Formato
                    </Button>
                    <Button variant="secondary" onClick={() => router.push(`/clientes/${cliente.id}/editar`)}>
                        <Edit size={16} /> Editar
                    </Button>
                    <Button variant="danger" onClick={async () => {
                        if (confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
                            if (cliente) {
                                try {
                                    await eliminarCliente(cliente.id);
                                    router.push('/clientes');
                                } catch (error) {
                                    alert('Error al eliminar cliente');
                                }
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
                                        {cliente.calle} {cliente.numeroExterior ? `No. ${cliente.numeroExterior}` : ''} {cliente.numeroInterior ? `Int. ${cliente.numeroInterior}` : ''}, {cliente.colonia}, {cliente.cp}<br />
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
                                <p className="font-medium text-gray-900">{cliente.noRef}</p>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-gray-500 mb-1 block">Folio SIAC</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={folioSiacInput}
                                        onChange={(e) => setFolioSiacInput(e.target.value)}
                                        placeholder="Ingresa Folio SIAC"
                                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-telmex-blue"
                                    />
                                    <Button variant="primary" size="sm" onClick={guardarFolioSiac} disabled={folioSiacInput === (cliente.folioSiac || '')}>
                                        <Save size={14} />
                                    </Button>
                                </div>
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

            {/* Modal de Referidos */}
            <Modal
                isOpen={modalReferidosOpen}
                onClose={() => setModalReferidosOpen(false)}
                title="🎁 Solicitar Referidos"
                size="md"
            >
                {cliente && (
                    <div className="space-y-6 p-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="font-semibold text-blue-900 mb-2">Paso 1: Busca el contacto en WhatsApp</h3>
                            <p className="text-sm text-blue-700 mb-3">Copia el número del cliente para buscarlo en tu lista de chats.</p>

                            <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                                <Phone size={18} className="text-blue-500" />
                                <span className="font-mono text-lg font-medium flex-1">{cliente.noTT}</span>
                                <Button size="sm" onClick={copiarTelefono}>
                                    <Copy size={14} className="mr-1" /> Copiar Teléfono
                                </Button>
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h3 className="font-semibold text-green-900 mb-2">Paso 2: Copia el mensaje</h3>
                            <p className="text-sm text-green-700 mb-3">Una vez en el chat, pega este mensaje para pedir referidos.</p>

                            <div className="bg-white p-3 rounded border border-green-200 text-sm text-gray-600 italic mb-3">
                                "¡Hola {cliente.nombre.split(' ')[0]}! 🌟 Espero que estés disfrutando tu nuevo internet TELMEX..."
                            </div>

                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={copiarMensajeReferidos}>
                                <Copy size={16} className="mr-2" /> Copiar Mensaje
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Seguimiento */}
            <Modal
                isOpen={modalSeguimientoOpen}
                onClose={() => setModalSeguimientoOpen(false)}
                title="📨 Dar Seguimiento"
                size="md"
            >
                {cliente && (
                    <div className="space-y-6 p-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="font-semibold text-blue-900 mb-2">Paso 1: Busca el contacto en WhatsApp</h3>
                            <p className="text-sm text-blue-700 mb-3">Copia el número del cliente para buscarlo en tu lista de chats.</p>

                            <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                                <Phone size={18} className="text-blue-500" />
                                <span className="font-mono text-lg font-medium flex-1">{cliente.noTT}</span>
                                <Button size="sm" onClick={copiarTelefono}>
                                    <Copy size={14} className="mr-1" /> Copiar Teléfono
                                </Button>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h3 className="font-semibold text-indigo-900 mb-2">Paso 2: Copia el mensaje de seguimiento</h3>
                            <p className="text-sm text-indigo-700 mb-3">Este mensaje incluye los datos registrados (Paquete, Precio, Dirección) para recordar al cliente.</p>

                            <div className="bg-white p-3 rounded border border-indigo-200 text-sm text-gray-600 italic mb-3 whitespace-pre-wrap">
                                {`¡Hola${cliente.nombre.includes('Prospecto') ? '' : ` ${cliente.nombre.split(' ')[0]}`}! 👋
Te escribo para dar seguimiento a tu trámite de internet TELMEX. 🚀
...`}
                            </div>

                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={copiarMensajeSeguimiento}>
                                <Copy size={16} className="mr-2" /> Copiar Mensaje
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
