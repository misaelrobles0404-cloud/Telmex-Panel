'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cliente, Actividad, Documento, EstadoPipeline } from '@/types';
import { obtenerClientes, obtenerCliente, guardarCliente, eliminarCliente } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { formatearMoneda, formatearFecha, formatearFechaHora, generarId } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, FileText, CheckCircle, Copy, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DocumentManager } from '@/components/DocumentManager';
import { ClavesPortalCard } from '@/components/ClavesPortalCard';
import { Toast } from '@/components/ui/Toast';

export default function ClienteDetallePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [nuevaNota, setNuevaNota] = useState('');
    const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);
    const [modalReferidosOpen, setModalReferidosOpen] = useState(false);
    const [modalSeguimientoOpen, setModalSeguimientoOpen] = useState(false);
    const [folioSiacInput, setFolioSiacInput] = useState('');
    const [ordenServicioInput, setOrdenServicioInput] = useState('');
    const [perfilUsuario, setPerfilUsuario] = useState<{ nombre_completo: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

    const mostrarToast = (message: string) => {
        setToast({ message, isVisible: true });
    };

    useEffect(() => {
        const cargarCliente = async () => {
            try {
                const [data, { data: { user } }] = await Promise.all([
                    obtenerCliente(params.id),
                    supabase.auth.getUser()
                ]);

                if (data) {
                    // Si el cliente no tiene user_id, le asignamos el del usuario actual para evitar errores RLS
                    if (!data.user_id && user) {
                        data.user_id = user.id;
                    }
                    setCliente(data);
                    setFolioSiacInput(data.folio_siac || '');
                    setOrdenServicioInput(data.orden_servicio || '');
                }

                // Cargar perfil del usuario actual para los formatos
                if (user) {
                    const { data: perfil } = await supabase
                        .from('perfiles')
                        .select('nombre_completo')
                        .eq('id', user.id)
                        .maybeSingle();
                    if (perfil) setPerfilUsuario(perfil);
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
            descripcion: `Estado actualizado de ${cliente.estado_pipeline} a ${nuevoEstado}`,
            fecha: new Date().toISOString(),
        };

        const clienteActualizado = {
            ...cliente,
            estado_pipeline: nuevoEstado,
            actualizado_en: new Date().toISOString(),
            actividades: [actividad, ...(cliente.actividades || [])] // También guardamos la actividad aquí
        };

        try {
            await guardarCliente(clienteActualizado);
            setCliente(clienteActualizado);
        } catch (error: any) {
            console.error('Error al actualizar estado:', error);
            alert(`Error al actualizar estado: ${error.message || 'Desconocido'}`);
        }
    };

    const agregarNota = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cliente || !nuevaNota.trim()) return;

        const nuevaActividad: Actividad = {
            id: generarId(),
            clienteId: cliente.id,
            tipo: 'nota',
            descripcion: nuevaNota,
            fecha: new Date().toISOString(),
        };

        const clienteActualizado = {
            ...cliente,
            actividades: [nuevaActividad, ...(cliente.actividades || [])],
            actualizado_en: new Date().toISOString()
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

    const eliminarActividad = async (id: string) => {
        if (!cliente || !confirm('¿Estás seguro de eliminar esta nota?')) return;

        const nuevasActividades = (cliente.actividades || []).filter(a => a.id !== id);
        const clienteActualizado = {
            ...cliente,
            actividades: nuevasActividades,
            actualizado_en: new Date().toISOString()
        };

        try {
            await guardarCliente(clienteActualizado);
            setCliente(clienteActualizado);
        } catch (error) {
            alert('Error al eliminar la nota');
        }
    };

    const guardarFolioSiac = async () => {
        if (!cliente) return;

        const nuevoEstado: EstadoPipeline = 'capturado';

        const clienteActualizado: Cliente = {
            ...cliente,
            folio_siac: folioSiacInput,
            estado_pipeline: cliente.estado_pipeline === 'posteado' ? 'posteado' : nuevoEstado,
            actualizado_en: new Date().toISOString()
        };

        if (cliente.estado_pipeline !== nuevoEstado && cliente.estado_pipeline !== 'posteado') {
            clienteActualizado.actividades = [
                {
                    id: generarId(),
                    clienteId: cliente.id,
                    tipo: 'cambio_estado',
                    descripcion: `Folio SIAC asignado: ${folioSiacInput}. Estado actualizado a CAPTURADO.`,
                    fecha: new Date().toISOString()
                },
                ...cliente.actividades || []
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

    const guardarOrdenServicio = async () => {
        if (!cliente) return;

        const clienteActualizado: Cliente = {
            ...cliente,
            orden_servicio: ordenServicioInput,
            actualizado_en: new Date().toISOString()
        };

        try {
            await guardarCliente(clienteActualizado);
            setCliente(clienteActualizado);
            alert('Orden de Servicio guardada.');
        } catch (error) {
            alert('Error al guardar Orden de Servicio');
        }
    };

    const generarFormatoSIAC = () => {
        if (!cliente) return;

        const nombrePromotor = perfilUsuario?.nombre_completo || "PROMOTOR NO REGISTRADO";

        // Función para aplicar negritas tipo WhatsApp
        const b = (text: string) => `*${text}*`;

        const line = "———————————————————";
        let formato = "";

        if (cliente.tipo_servicio === 'portabilidad' || cliente.tipo_servicio === 'winback') {
            formato = `${b('PROMOTOR=')} ${b(nombrePromotor.toUpperCase())}
${line}
(${b('PORTABILIDAD')}) 
${line}
${b('NIP-')} ${cliente.nip_portabilidad || 'GENÉRICO'}
${b('VIG-')}
${b('#')} ${cliente.numero_a_portar || ''}
${b('((COMPETIDOR))=')} ${cliente.proveedor_actual?.toUpperCase() || ''}
${line}
${b('FECHA - -')}  (${b(formatearFecha(new Date().toISOString()).toUpperCase())})
${line}

■${b('NUMERO TITULAR-')} ${cliente.no_tt}
■${b('NUMERO REFERENCIA-')} ${cliente.no_ref}
■${b('CORREO ELECTRONICO-')} ${cliente.correo}
${line}
${b('CALLE-')} ${cliente.calle.toUpperCase()} ${cliente.numero_exterior || ''} ${cliente.mz ? `MZ ${cliente.mz}` : ''} ${cliente.lt ? `LT ${cliente.lt}` : ''}
${b('ENTRE-')} ${cliente.entre_calle_1?.toUpperCase() || ''}
${b('ENTRE-')} ${cliente.entre_calle_2?.toUpperCase() || ''}
${b('C.P-')} ${cliente.cp}
${b('COL-')} ${cliente.colonia.toUpperCase()}
${b('C.D-')} ${cliente.cd.toUpperCase()}
${line}
${b('PAQUETE-')} $${cliente.precio_mensual} ${cliente.velocidad} MEGAS ${!cliente.incluye_telefono ? 'INTERNET' : 'INTERNET Y TELEFONIA'}.

${line}
${b('GASTOS DE INSTALACIÓN')} 
$0
${b('((NO APLICA POR PROMOCION))')}`;
        } else {
            formato = `🔹 ${b('NOMBRE DEL PROMOTOR:')} ${b(nombrePromotor.toUpperCase())}

${b('DATOS PERSONALES')}
🔹 ${b('NOMBRE DEL CLIENTE:')} ${cliente.nombre.toUpperCase()}
🔹 ${b('NUMERO TELEFONICO:')} ${cliente.no_tt}
🔹 ${b('NUMERO DE REFERENCIA:')} ${cliente.no_ref}
🔹 ${b('CORREO ELECTRÓNICO:')} ${cliente.correo}

${b('DOMICILIO')}
🔹 ${b('CALLE:')} ${cliente.calle.toUpperCase()}
🔹 ${b('MZ Y LT:')} ${cliente.mz || ''} ${cliente.lt || ''}
🔹 ${b('N. EXT:')} ${cliente.numero_exterior || ''}
🔹 ${b('N. INT:')} ${cliente.numero_interior || ''}
🔹 ${b('ENTRE CALLES:')} ${cliente.entre_calle_1 || ''} Y ${cliente.entre_calle_2 || ''}
🔹 ${b('COLONIA:')} ${cliente.colonia.toUpperCase()}
🔹 ${b('DELEGACIÓN:')} ${cliente.cd.toUpperCase()}, ${cliente.estado.toUpperCase()}
🔹 ${b('CODIGO POSTAL:')} ${cliente.cp}

${b('PAQUETE A CONTRATAR')}
🔹 ${b('PAQUETE:')} ($${cliente.precio_mensual} ${cliente.velocidad} MEGAS ${!cliente.incluye_telefono ? 'INTERNET' : 'INTERNET Y TELEFONÍA'})

🔹️ ${b('GASTOS DE INSTALACIÓN:')} 400 INICIALES Y 1200 DIFERIDOS A CARGO A SU RECIBO TELMEX

🔹 ${b('HORARIO SUGERIDO:')}
🔹 ${b('FECHA SUGERIDA:')} INSTALACIÓN INMEDIATA`;
        }

        navigator.clipboard.writeText(formato).then(() => {
            mostrarToast('¡Formato copiado!');
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('Error al copiar el formato');
        });
    };

    const copiarAlPortapapeles = (texto: string, label: string) => {
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast(`${label} copiado`);
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
    };

    const copiarTelefono = () => {
        if (!cliente) return;
        copiarAlPortapapeles(cliente.no_tt, 'Teléfono');
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
            mostrarToast('Mensaje copiado');
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
💰 Precio: $${cliente.precio_mensual}/mes
📍 Dirección: ${direccion}${cliente.mz ? ` Mz ${cliente.mz}` : ''}${cliente.lt ? ` Lt ${cliente.lt}` : ''}

¿Te gustaría que procedamos con la instalación/validación? 🤔
Solo necesito que me confirmes para agendar.

¡Quedo atento!`;

        navigator.clipboard.writeText(mensaje).then(() => {
            mostrarToast('Seguimiento copiado');
            setModalSeguimientoOpen(false);
        });
    };

    const copiarMensajeAlta = () => {
        if (!cliente) return;

        const nombre = cliente.nombre.toUpperCase();
        const descripcionServicio = !cliente.incluye_telefono ? 'internet' : 'internet y telefonía';
        const precio = cliente.precio_mensual;

        const mensaje = `Buenas tardes
Estamos dando de alta un servicio de telmex para ${nombre}
Un favor para continuar con la solicitud se está solicitando un servicio de (${descripcionServicio} de ${precio})
Con gastos de instalación de 1600 qué se difieren a 1200 a 12 meses de 100 y un pago inicial de 400 qué puede pagar en su primer recibo
Acepta el servicio?`;

        navigator.clipboard.writeText(mensaje).then(() => {
            mostrarToast('Mensaje de Alta copiado');
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('Error al copiar el mensaje');
        });
    };

    const obtenerPartesNombre = () => {
        if (!cliente) return { nombres: '', paterno: '', materno: '' };
        const partes = cliente.nombre.trim().split(/\s+/);
        if (partes.length === 1) return { nombres: partes[0], paterno: '', materno: '' };
        if (partes.length === 2) return { nombres: partes[0], paterno: partes[1], materno: '' };

        const m = partes.pop() || '';
        const p = partes.pop() || '';
        const n = partes.join(' ');
        return { nombres: n, paterno: p, materno: m };
    };

    const { nombres, paterno, materno } = obtenerPartesNombre();

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto overflow-hidden">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4 -ml-2"
            >
                <ArrowLeft size={20} className="mr-2" />
                Volver a Clientes
            </Button>

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            {/* Encabezado del Cliente */}
            <div className="flex flex-col mb-6 gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words leading-tight flex flex-wrap gap-2">
                        <span
                            onClick={() => copiarAlPortapapeles(nombres, 'Nombre(s)')}
                            className="cursor-pointer hover:text-telmex-blue transition-colors underline decoration-transparent hover:decoration-telmex-blue decoration-dotted"
                            title="Copiar Nombres"
                        >
                            {nombres}
                        </span>
                        <span
                            onClick={() => copiarAlPortapapeles(paterno, 'Apellido Paterno')}
                            className="cursor-pointer hover:text-telmex-blue transition-colors underline decoration-transparent hover:decoration-telmex-blue decoration-dotted"
                            title="Copiar Apellido Paterno"
                        >
                            {paterno}
                        </span>
                        <span
                            onClick={() => copiarAlPortapapeles(materno, 'Apellido Materno')}
                            className="cursor-pointer hover:text-telmex-blue transition-colors underline decoration-transparent hover:decoration-telmex-blue decoration-dotted"
                            title="Copiar Apellido Materno"
                        >
                            {materno}
                        </span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`badge ${cliente.tipo_servicio === 'linea_nueva' ? 'badge-blue' :
                            cliente.tipo_servicio === 'portabilidad' ? 'badge-purple' :
                                'badge-green'
                            }`}>
                            {cliente.tipo_servicio === 'linea_nueva' ? 'Línea Nueva' :
                                cliente.tipo_servicio === 'portabilidad' ? 'Portabilidad' : 'Winback'}
                        </span>
                        <span className="text-gray-500 text-sm">
                            Creado: {formatearFechaHora(cliente.creado_en)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full">
                    {cliente.estado_pipeline !== 'posteado' && cliente.estado_pipeline !== 'sin_cobertura' && (
                        <Button
                            variant="secondary"
                            onClick={() => setModalSeguimientoOpen(true)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 flex-1 md:flex-none"
                            title="Dar seguimiento a prospecto"
                        >
                            <span className="mr-1">📨</span> Dar Seguimiento
                        </Button>
                    )}

                    {cliente.estado_pipeline === 'posteado' && (
                        <Button
                            variant="secondary"
                            onClick={() => setModalReferidosOpen(true)}
                            className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 flex-1 md:flex-none"
                            title="Pedir referidos a cliente feliz"
                        >
                            <span className="mr-1">🎁</span> Pedir Referidos
                        </Button>
                    )}

                    {/* Copiar Formato: Solo si tiene Folio SIAC (Capturado o Posteado) */}
                    {(cliente.estado_pipeline === 'capturado' || cliente.estado_pipeline === 'posteado') && cliente.folio_siac && (
                        <Button variant="secondary" onClick={generarFormatoSIAC} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 flex-1 md:flex-none">
                            <Copy size={16} className="mr-1" /> Copiar Formato
                        </Button>
                    )}

                    <Button
                        variant="secondary"
                        onClick={copiarMensajeAlta}
                        className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200 flex-1 md:flex-none"
                    >
                        <Copy size={16} className="mr-1" /> Confirmar Alta
                    </Button>

                    <Button variant="secondary" onClick={() => router.push(`/clientes/${cliente.id}/editar`)} className="flex-1 md:flex-none">
                        <Edit size={16} className="mr-1" /> Editar
                    </Button>

                    {/* Eliminar: Bloqueado en Capturado o Posteado para seguridad */}
                    {cliente.estado_pipeline !== 'capturado' && cliente.estado_pipeline !== 'posteado' ? (
                        <Button
                            variant="danger"
                            className="flex-1 md:flex-none"
                            onClick={async () => {
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
                            }}
                        >
                            <Trash2 size={16} className="mr-1" /> Eliminar
                        </Button>
                    ) : (
                        <div className="flex-1 md:flex-none" title="No se puede eliminar un cliente con Folio SIAC asignado">
                            <Button
                                variant="ghost"
                                className="w-full text-gray-400 cursor-not-allowed border border-gray-100"
                                disabled
                            >
                                <Trash2 size={16} className="mr-1" /> Bloqueado
                            </Button>
                        </div>
                    )}
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
                                {['prospecto', 'pendiente_captura', 'capturado', 'posteado', 'sin_cobertura', 'cancelado'].map((estado) => (
                                    <button
                                        key={estado}
                                        onClick={() => actualizarEstado(estado as EstadoPipeline)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${cliente.estado_pipeline === estado
                                            ? 'bg-telmex-blue text-white border-telmex-blue'
                                            : estado === 'sin_cobertura' || estado === 'cancelado' ? 'bg-red-50 text-red-600 border-red-200 hover:border-red-400' :
                                                'bg-white text-gray-600 border-gray-300 hover:border-telmex-blue'
                                            }`}
                                    >
                                        {estado === 'prospecto' ? 'PROSPECTO' :
                                            estado === 'pendiente_captura' ? 'PENDIENTE CAPTURA' :
                                                estado === 'capturado' ? 'CAPTURADO' :
                                                    estado === 'posteado' ? 'POSTEADO' :
                                                        estado === 'sin_cobertura' ? 'SIN COBERTURA' :
                                                            estado === 'cancelado' ? 'CANCELADO' :
                                                                estado.toUpperCase()}
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
                                <p className="font-medium text-telmex-blue">{formatearMoneda(cliente.precio_mensual)}</p>
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
                            <div
                                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                                onClick={() => copiarAlPortapapeles(cliente.no_tt, 'Teléfono')}
                                title="Click para copiar"
                            >
                                <Phone className="text-gray-400 group-hover:text-telmex-blue transition-colors" size={18} />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Teléfono (TT)</p>
                                    <p className="font-medium flex items-center gap-2">
                                        {cliente.no_tt}
                                        <Copy size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                </div>
                            </div>
                            <div
                                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                                onClick={() => copiarAlPortapapeles(cliente.correo, 'Correo')}
                                title="Click para copiar"
                            >
                                <Mail className="text-gray-400 group-hover:text-telmex-blue transition-colors" size={18} />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Correo</p>
                                    <p className="font-medium flex items-center gap-2">
                                        {cliente.correo}
                                        <Copy size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-2">
                                <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                                <div className="space-y-1 w-full">
                                    <p className="text-sm text-gray-500 mb-1">Dirección (Click en partes para copiar)</p>

                                    <p className="text-lg font-medium text-gray-900 leading-relaxed">
                                        <span
                                            onClick={() => copiarAlPortapapeles(cliente.calle, 'Calle')}
                                            className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                            title="Copiar Calle"
                                        >
                                            {cliente.calle}
                                        </span>
                                        {cliente.numero_exterior && (
                                            <>
                                                {" "}
                                                <span
                                                    onClick={() => copiarAlPortapapeles(cliente.numero_exterior!, 'Número Exterior')}
                                                    className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                                    title="Copiar Número Exterior"
                                                >
                                                    No. {cliente.numero_exterior}
                                                </span>
                                            </>
                                        )}
                                        {cliente.numero_interior && (
                                            <>
                                                {" "}
                                                <span
                                                    onClick={() => copiarAlPortapapeles(cliente.numero_interior!, 'Número Interior')}
                                                    className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                                    title="Copiar Número Interior"
                                                >
                                                    Int. {cliente.numero_interior}
                                                </span>
                                            </>
                                        )}
                                        {(cliente.mz || cliente.lt) && (
                                            <>
                                                ,{" "}
                                                <span
                                                    onClick={() => copiarAlPortapapeles(`Mz ${cliente.mz || ''} Lt ${cliente.lt || ''}`, 'Mz y Lt')}
                                                    className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                                    title="Copiar Manzana y Lote"
                                                >
                                                    {cliente.mz ? `Mz ${cliente.mz}` : ''} {cliente.lt ? `Lt ${cliente.lt}` : ''}
                                                </span>
                                            </>
                                        )}
                                        , <span
                                            onClick={() => copiarAlPortapapeles(cliente.colonia || '', 'Colonia')}
                                            className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                            title="Copiar Colonia"
                                        >
                                            {cliente.colonia}
                                        </span>, <span
                                            onClick={() => copiarAlPortapapeles(cliente.cp || '', 'CP')}
                                            className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                            title="Copiar Código Postal"
                                        >
                                            {cliente.cp}
                                        </span>
                                        <br />
                                        <span
                                            onClick={() => copiarAlPortapapeles(cliente.cd || '', 'Ciudad')}
                                            className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                            title="Copiar Ciudad"
                                        >
                                            {cliente.cd}
                                        </span>, <span
                                            onClick={() => copiarAlPortapapeles(cliente.estado || '', 'Estado')}
                                            className="cursor-pointer hover:text-telmex-blue transition-colors hover:underline decoration-dotted"
                                            title="Copiar Estado"
                                        >
                                            {cliente.estado}
                                        </span>
                                    </p>

                                    {(cliente.entre_calle_1 || cliente.entre_calle_2) && (
                                        <p
                                            onClick={() => copiarAlPortapapeles(`${cliente.entre_calle_1} y ${cliente.entre_calle_2}`, 'Entre Calles')}
                                            className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-telmex-blue transition-colors flex items-center gap-1 italic"
                                            title="Copiar Nombres de Calles"
                                        >
                                            Entre: {cliente.entre_calle_1} y {cliente.entre_calle_2}
                                            <Copy size={10} />
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
                                {(!cliente.actividades || cliente.actividades.length === 0) ? (
                                    <p className="text-gray-500 text-center py-4">No hay actividad registrada.</p>
                                ) : (
                                    cliente.actividades.map((actividad) => (
                                        <div key={actividad.id} className="group flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0 relative">
                                            <div className={`mt-1 p-1.5 rounded-full ${actividad.tipo === 'cambio_estado' ? 'bg-blue-100 text-blue-600' :
                                                actividad.tipo === 'llamada' ? 'bg-green-100 text-green-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {actividad.tipo === 'cambio_estado' && <CheckCircle size={14} />}
                                                {actividad.tipo === 'llamada' && <Phone size={14} />}
                                                {(actividad.tipo === 'whatsapp' || actividad.tipo === 'correo') && <Mail size={14} />}
                                                {actividad.tipo === 'nota' && <FileText size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">{actividad.descripcion}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatearFechaHora(actividad.fecha)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => eliminarActividad(actividad.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all rounded-md hover:bg-red-50"
                                                title="Eliminar nota"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas de Captura */}
                    {cliente.notas && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText size={18} className="text-amber-500" />
                                    Notas de Captura
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-sm text-gray-800 italic whitespace-pre-wrap shadow-inner">
                                    "{cliente.notas}"
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Columna Derecha: Documentos y Datos Adicionales */}
                <div className="space-y-6">

                    {/* Documentos Requeridos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div
                                className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group"
                                onClick={() => cliente.ine && copiarAlPortapapeles(cliente.ine, 'INE')}
                                title="Click para copiar INE"
                            >
                                <span className="text-sm font-medium">INE/Identificación</span>
                                {cliente.ine ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-success text-xs font-bold leading-none">{cliente.ine}</span>
                                        <Copy size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ) : (
                                    <span className="text-error text-xs">Pendiente</span>
                                )}
                            </div>
                            <div
                                className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group"
                                onClick={() => cliente.curp && copiarAlPortapapeles(cliente.curp, 'CURP')}
                                title="Click para copiar CURP"
                            >
                                <span className="text-sm font-medium">CURP</span>
                                {cliente.curp ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-success text-xs font-bold leading-none">{cliente.curp}</span>
                                        <Copy size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ) : (
                                    <span className="text-error text-xs">Pendiente</span>
                                )}
                            </div>

                            {(cliente.tipo_servicio === 'portabilidad' || cliente.tipo_servicio === 'winback') && (
                                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                    <span className="text-sm font-medium">NIP Portabilidad</span>
                                    {cliente.nip_portabilidad ? (
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
                                <p className="text-gray-500 mb-1">Referencias</p>
                                <div className="space-y-1">
                                    <p
                                        className="font-medium text-gray-900 cursor-pointer hover:text-telmex-blue transition-colors flex items-center gap-1"
                                        onClick={() => copiarAlPortapapeles(cliente.no_ref, 'Referencia 1')}
                                        title="Copiar Referencia 1"
                                    >
                                        Ref 1: {cliente.no_ref}
                                        <Copy size={12} className="opacity-50" />
                                    </p>
                                    {cliente.no_ref_2 && (
                                        <p
                                            className="font-medium text-gray-900 cursor-pointer hover:text-telmex-blue transition-colors flex items-center gap-1"
                                            onClick={() => copiarAlPortapapeles(cliente.no_ref_2!, 'Referencia 2')}
                                            title="Copiar Referencia 2"
                                        >
                                            Ref 2: {cliente.no_ref_2}
                                            <Copy size={12} className="opacity-50" />
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-gray-500 mb-1 block">Folio SIAC</label>
                                <div className="relative flex-1 min-w-[120px]">
                                    <input
                                        type="text"
                                        value={folioSiacInput}
                                        onChange={(e) => setFolioSiacInput(e.target.value)}
                                        placeholder="Ingresa Folio SIAC"
                                        className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-telmex-blue"
                                    />
                                    {folioSiacInput && (
                                        <button
                                            onClick={() => copiarAlPortapapeles(folioSiacInput, 'Folio SIAC')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-telmex-blue transition-colors"
                                            title="Copiar Folio"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    )}
                                </div>
                                <Button variant="primary" size="sm" onClick={guardarFolioSiac} disabled={folioSiacInput === (cliente.folio_siac || '')} className="w-full md:w-auto">
                                    <Save size={14} className="mr-1 md:mr-0" />
                                    <span className="md:hidden">Guardar Folio</span>
                                </Button>

                                <div className="mt-2 text-sm">
                                    <a
                                        href="https://siac-interac.telmex.com/siac_interactivo"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                    >
                                        Ir a SIAC Interactivo ↗
                                    </a>
                                </div>

                                <label className="text-gray-500 mb-1 block mt-4">Orden de Servicio (OS)</label>
                                <div className="flex flex-wrap md:flex-nowrap gap-2">
                                    <div className="relative flex-1 min-w-[120px]">
                                        <input
                                            type="text"
                                            value={ordenServicioInput}
                                            onChange={(e) => setOrdenServicioInput(e.target.value)}
                                            placeholder="Orden de Servicio"
                                            className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-telmex-blue"
                                        />
                                        {ordenServicioInput && (
                                            <button
                                                onClick={() => copiarAlPortapapeles(ordenServicioInput, 'OS')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-telmex-blue transition-colors"
                                                title="Copiar OS"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <Button variant="primary" size="sm" onClick={guardarOrdenServicio} disabled={ordenServicioInput === (cliente.orden_servicio || '')} className="w-full md:w-auto">
                                        <Save size={14} className="mr-1 md:mr-0" />
                                        <span className="md:hidden">Guardar OS</span>
                                    </Button>
                                </div>
                                <div className="mt-2 text-sm">
                                    <a
                                        href="https://portalwcex-2.telmex.com:4200/login"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                    >
                                        Ir a Portal WCEX (Instalaciones) ↗
                                    </a>
                                </div>
                            </div>


                            {cliente.usuario && (
                                <div>
                                    <p className="text-gray-500">Usuario Asignado</p>
                                    <p className="font-medium text-gray-900">{cliente.usuario}</p>
                                </div>
                            )}

                            {/* Claves del Portal */}
                            <div className="pt-4 border-t border-gray-100">
                                <ClavesPortalCard
                                    modo="detalle"
                                    claveSeleccionada={cliente.usuario_portal_asignado}
                                    bloqueado={!!cliente.folio_siac}
                                    onSeleccionar={async (usuarioId) => {
                                        if (!cliente) return;

                                        // Si ya está seleccionado, deseleccionar (opcional) o no hacer nada
                                        if (cliente.usuario_portal_asignado === usuarioId) return;

                                        const clienteActualizado = {
                                            ...cliente,
                                            usuario_portal_asignado: usuarioId,
                                            actualizado_en: new Date().toISOString()
                                        };

                                        try {
                                            await guardarCliente(clienteActualizado);
                                            setCliente(clienteActualizado);
                                        } catch (error: any) {
                                            console.error('Error al guardar selección:', error);
                                            alert(`Error al guardar selección: ${error.message || JSON.stringify(error)}`);
                                        }
                                    }}
                                />
                            </div>

                            {(cliente.tipo_servicio === 'portabilidad' || cliente.tipo_servicio === 'winback') && (
                                <>
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="font-semibold text-gray-900 mb-2">Datos de Portabilidad</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Proveedor Anterior</p>
                                        <p className="font-medium text-gray-900 capitalize">{cliente.proveedor_actual}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Número a Portar</p>
                                        <p className="font-medium text-gray-900">{cliente.numero_a_portar}</p>
                                    </div>
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
                        documentos={cliente.documentos || []}
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
                                <span className="font-mono text-lg font-medium flex-1">{cliente.no_tt}</span>
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
                                <span className="font-mono text-lg font-medium flex-1">{cliente.no_tt}</span>
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
