'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Cliente } from '@/types';
import { obtenerClientes } from '@/lib/storage';
import { formatearMoneda, formatearFecha } from '@/lib/utils';
import { Plus, Search, Filter, Trash2, AlertTriangle, Link } from 'lucide-react';
import { eliminarClientesMasivos } from '@/lib/storage';
import { crearSolicitudDocumentos } from '@/lib/solicitudes';
import { Modal } from '@/components/ui/Modal';

export default function ClientesPage() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [stats, setStats] = useState({
        hoy: 0,
        semana: 0,
        mes: 0
    });
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [loading, setLoading] = useState(true);
    const [modalGenerarLink, setModalGenerarLink] = useState(false);
    const [tipoServicioLink, setTipoServicioLink] = useState<'linea_nueva' | 'portabilidad'>('linea_nueva');
    const [generandoLink, setGenerandoLink] = useState(false);
    const [linkGenerado, setLinkGenerado] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        type: 'info' | 'confirm';
        onConfirm?: () => void;
    }>({ title: '', message: '', type: 'info' });

    const handleLimpieza = async () => {
        const unMesAtras = new Date();
        unMesAtras.setMonth(unMesAtras.getMonth() - 1);

        const clientesAntiguos = clientes.filter(c => {
            const fechaCreacion = new Date(c.creado_en);
            return fechaCreacion < unMesAtras;
        });

        if (clientesAntiguos.length === 0) {
            setModalConfig({
                title: 'Limpieza de Datos',
                message: 'No hay clientes con más de 1 mes de antigüedad para eliminar.',
                type: 'info'
            });
            setShowModal(true);
            return;
        }

        setModalConfig({
            title: '⚠️ Eliminar Clientes Antiguos',
            message: `Se encontraron ${clientesAntiguos.length} clientes registrados hace más de 1 mes.\n\nEstos datos se borrarán permanentemente y liberarás espacio en la base de datos.\n\n¿Estás seguro de querer continuar?`,
            type: 'confirm',
            onConfirm: async () => {
                setShowModal(false);
                setLoading(true);
                try {
                    const ids = clientesAntiguos.map(c => c.id);
                    await eliminarClientesMasivos(ids);
                    window.location.reload();
                } catch (error) {
                    console.error(error);
                    alert('❌ Ocurrió un error al intentar eliminar los clientes.');
                    setLoading(false);
                }
            }
        });
        setShowModal(true);
    };

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const cargarClientes = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                const data = await obtenerClientes();

                // Lógica de Filtrado: 
                // Todos ven solo lo SUYO (incluyendo Boss).
                let clientesFiltradosData = data;
                if (user?.email) {
                    clientesFiltradosData = data.filter(c =>
                        c.usuario === user.email ||
                        c.user_id === user.id
                    );
                }

                setClientes(clientesFiltradosData);

                // Calcular estadísticas sobre los datos filtrados
                const hoy = new Date();
                const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

                const primerDiaSemana = new Date(hoy);
                const diaSemana = hoy.getDay() || 7;
                primerDiaSemana.setHours(0, 0, 0, 0);
                primerDiaSemana.setDate(primerDiaSemana.getDate() - diaSemana + 1);

                const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

                const statsCalculated = clientesFiltradosData.reduce((acc, cliente) => {
                    const fechaCreacion = new Date(cliente.creado_en);

                    if (fechaCreacion >= inicioDia) acc.hoy++;
                    if (fechaCreacion >= primerDiaSemana) acc.semana++;
                    if (fechaCreacion >= primerDiaMes) acc.mes++;

                    return acc;
                }, { hoy: 0, semana: 0, mes: 0 });

                setStats(statsCalculated);

            } catch (error) {
                console.error("Error al cargar clientes:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarClientes();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-telmex-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const clientesFiltrados = clientes.filter(cliente => {
        const matchBusqueda = cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            cliente.no_tt.includes(busqueda) ||
            cliente.correo.toLowerCase().includes(busqueda.toLowerCase());

        let matchEstado = false;
        if (filtroEstado === 'todos') {
            // Excluir sin_cobertura de la vista general por defecto
            matchEstado = cliente.estado_pipeline !== 'sin_cobertura';
        } else {
            matchEstado = cliente.estado_pipeline === filtroEstado;
        }

        return matchBusqueda && matchEstado;
    });

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-600 text-sm md:text-base mt-1">
                        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLimpieza}
                        className="hidden sm:flex text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm"
                        title="Eliminar clientes antiguos (> 1 mes)"
                    >
                        <Trash2 size={16} className="mr-2" />
                        Limpieza
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setLinkGenerado(''); setModalGenerarLink(true); }}
                        className="hidden sm:flex text-green-700 border-green-200 bg-green-50 hover:bg-green-100 text-xs md:text-sm"
                    >
                        <Link size={16} className="mr-2" />
                        Generar Link
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push('/clientes/nuevo')}
                        className="hidden sm:flex text-xs md:text-sm"
                    >
                        <Plus size={16} className="mr-2" />
                        Nuevo Cliente
                    </Button>

                    {/* Botón Limpieza móvil (solo icono) */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLimpieza}
                        className="sm:hidden text-red-600 border-red-200 p-2"
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Estadísticas - Scroll horizontal en móvil */}
            <div className="flex overflow-x-auto pb-4 mb-6 gap-4 no-scrollbar md:grid md:grid-cols-3 md:overflow-visible text-gray-500">
                <Card className="min-w-[140px] flex-1 bg-blue-50 border-blue-200">
                    <CardContent className="p-3 md:p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-blue-600 font-medium">Hoy</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-900">{stats.hoy}</p>
                        </div>
                        <div className="hidden sm:block p-2 bg-blue-100 rounded-full text-blue-600">
                            <span className="text-xl">📅</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="min-w-[140px] flex-1 bg-green-50 border-green-200">
                    <CardContent className="p-3 md:p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-green-600 font-medium">Semana</p>
                            <p className="text-xl md:text-2xl font-bold text-green-900">{stats.semana}</p>
                        </div>
                        <div className="hidden sm:block p-2 bg-green-100 rounded-full text-green-600">
                            <span className="text-xl">📆</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="min-w-[140px] flex-1 bg-purple-50 border-purple-200">
                    <CardContent className="p-3 md:p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-sm text-purple-600 font-medium">Mes</p>
                            <p className="text-xl md:text-2xl font-bold text-purple-900">{stats.mes}</p>
                        </div>
                        <div className="hidden sm:block p-2 bg-purple-100 rounded-full text-purple-600">
                            <span className="text-xl">📊</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de Búsqueda */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o teléfono..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Filtros por Chips (Scroll horizontal en móvil) */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
                {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'prospecto', label: 'Prospectos' },
                    { id: 'pendiente_captura', label: 'Pendientes' },
                    { id: 'capturado', label: 'Capturados' },
                    { id: 'posteado', label: 'Posteados' }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFiltroEstado(f.id)}
                        className={`
                            px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                            ${filtroEstado === f.id
                                ? 'bg-telmex-blue text-white border-telmex-blue shadow-md'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }
                        `}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Lista de Clientes */}
            <div className="grid grid-cols-1 gap-4">
                {clientesFiltrados.map((cliente) => (
                    <Card
                        key={cliente.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push(`/clientes/${cliente.id}`)}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate max-w-[200px] md:max-w-none">{cliente.nombre}</h3>
                                        <div className="flex flex-wrap gap-1 md:gap-2">
                                            <span className={`badge text-[10px] md:text-xs ${cliente.estado_pipeline === 'posteado' ? 'badge-green' :
                                                cliente.estado_pipeline === 'capturado' ? 'badge-purple' :
                                                    cliente.estado_pipeline === 'prospecto' ? 'badge-blue' :
                                                        cliente.estado_pipeline === 'pendiente_captura' ? 'badge-yellow' :
                                                            'badge-red'
                                                }`}>
                                                {cliente.estado_pipeline === 'posteado' && 'POSTEADO'}
                                                {cliente.estado_pipeline === 'capturado' && 'CAPTURADO'}
                                                {cliente.estado_pipeline === 'prospecto' && 'PROSPECTO'}
                                                {cliente.estado_pipeline === 'pendiente_captura' && 'PENDIENTE CAPTURA'}
                                                {cliente.estado_pipeline === 'sin_cobertura' && 'SIN COBERTURA'}
                                            </span>
                                            <span className={`badge text-[10px] md:text-xs ${cliente.tipo_servicio === 'linea_nueva' ? 'badge-blue' :
                                                cliente.tipo_servicio === 'portabilidad' ? 'badge-purple' :
                                                    'badge-green'
                                                }`}>
                                                {cliente.tipo_servicio === 'linea_nueva' && 'Línea Nueva'}
                                                {cliente.tipo_servicio === 'portabilidad' && 'Portabilidad'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4 text-xs md:text-sm">
                                        {/* Teléfono y Nombre destacados en móvil */}
                                        <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 sm:bg-transparent sm:p-0 sm:border-0 flex justify-between items-center sm:block">
                                            <div>
                                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-black tracking-tight mb-0.5">Teléfono (TT)</p>
                                                <p className="font-bold text-gray-900 text-sm md:text-base">{cliente.no_tt}</p>
                                            </div>
                                            <a
                                                href={`tel:${cliente.no_tt}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="sm:hidden p-2 bg-telmex-blue text-white rounded-full shadow-lg"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                            </a>
                                        </div>

                                        <div className="p-2 sm:p-0">
                                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight mb-0.5">Dirección</p>
                                            <p className="font-medium text-gray-900 truncate text-xs">
                                                {cliente.calle} {cliente.numero_exterior ? `No. ${cliente.numero_exterior}` : ''}
                                                <span className="block text-[10px] text-gray-400">{cliente.colonia}</span>
                                            </p>
                                        </div>

                                        <div className="hidden sm:block p-2 sm:p-0">
                                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight mb-0.5">Referencias</p>
                                            <p className="font-medium text-gray-900">R1: {cliente.no_ref}</p>
                                        </div>

                                        <div className="p-2 sm:p-0">
                                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight mb-0.5">Paquete</p>
                                            <p className="font-medium text-gray-900 truncate text-xs">{cliente.paquete}</p>
                                        </div>

                                        <div className="p-2 sm:p-0 border-t border-gray-50 mt-1 pt-2 sm:border-0 sm:mt-0 sm:pt-0 flex justify-between items-center sm:block text-gray-500">
                                            <div className="sm:hidden">
                                                <p className="text-gray-500 text-[9px] uppercase font-bold">Comisión</p>
                                                <p className="font-black text-telmex-blue text-lg leading-none">{formatearMoneda(cliente.comision)}</p>
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Comisión</p>
                                                <p className="font-black text-telmex-blue text-base">{formatearMoneda(cliente.comision)}</p>
                                            </div>
                                            <div className="sm:hidden flex items-center text-telmex-blue font-bold text-xs">
                                                Ver detalle
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="m9 18 6-6-6-6" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
                                        <span>ID: {cliente.id.substring(0, 8)}...</span>
                                        <span>Contactado: {formatearFecha(cliente.fecha_contacto)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {clientesFiltrados.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-gray-500">No se encontraron clientes</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Botón Flotante (FAB) para móviles */}
            <button
                onClick={() => router.push('/clientes/nuevo')}
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-telmex-blue text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform"
            >
                <Plus size={32} />
            </button>

            {/* Modal Personalizado */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className={`p-6 ${modalConfig.type === 'confirm' ? 'bg-red-50' : 'bg-blue-50'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                {modalConfig.type === 'confirm' ? (
                                    <AlertTriangle className="text-red-600 w-8 h-8" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">i</div>
                                )}
                                <h3 className={`text-xl font-bold ${modalConfig.type === 'confirm' ? 'text-red-900' : 'text-blue-900'}`}>
                                    {modalConfig.title}
                                </h3>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 whitespace-pre-line text-lg mb-8">
                                {modalConfig.message}
                            </p>

                            <div className="flex justify-end gap-3">
                                {modalConfig.type === 'confirm' ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowModal(false)}
                                            className="text-gray-500 hover:text-gray-700 font-medium"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={() => modalConfig.onConfirm && modalConfig.onConfirm()}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6"
                                        >
                                            Sí, Eliminar
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowModal(false)}
                                        className="w-full"
                                    >
                                        Aceptar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Generar Link sin cliente previo */}
            <Modal
                isOpen={modalGenerarLink}
                onClose={() => setModalGenerarLink(false)}
                title="🔗 Generar Link para Cliente"
                size="md"
            >
                <div className="p-4 space-y-5">
                    {!linkGenerado ? (
                        <>
                            <p className="text-sm text-gray-600">
                                Genera un link seguro para que tu cliente suba sus documentos. Cuando lo envíe, se creará automáticamente como nuevo prospecto en tu panel.
                            </p>
                            <div>
                                <p className="text-sm font-bold text-gray-700 mb-2">Tipo de servicio</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTipoServicioLink('linea_nueva')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${tipoServicioLink === 'linea_nueva' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <p className="font-bold text-sm text-gray-800">📱 Línea Nueva</p>
                                        <p className="text-xs text-gray-500 mt-1">INE por ambos lados</p>
                                    </button>
                                    <button
                                        onClick={() => setTipoServicioLink('portabilidad')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${tipoServicioLink === 'portabilidad' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <p className="font-bold text-sm text-gray-800">🔄 Portabilidad</p>
                                        <p className="text-xs text-gray-500 mt-1">INE + Estado de cuenta</p>
                                    </button>
                                </div>
                            </div>
                            <button
                                disabled={generandoLink}
                                onClick={async () => {
                                    setGenerandoLink(true);
                                    try {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        const url = await crearSolicitudDocumentos(
                                            null,  // sin cliente previo
                                            tipoServicioLink,
                                            user?.email || ''
                                        );
                                        setLinkGenerado(url);
                                        navigator.clipboard.writeText(url);
                                    } catch (e: any) {
                                        alert(`Error: ${e.message}`);
                                    } finally {
                                        setGenerandoLink(false);
                                    }
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-60"
                            >
                                {generandoLink ? '⏳ Generando...' : '🔗 Generar y Copiar Link'}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                <p className="text-green-700 font-bold text-sm mb-1">✅ Link copiado al portapapeles</p>
                                <p className="text-xs text-gray-500 break-all">{linkGenerado}</p>
                            </div>
                            <p className="text-sm text-gray-600 text-center">Manda este link a tu cliente por WhatsApp. Cuando llene el formulario y suba sus documentos, aparecerá automáticamente en tu lista de clientes.</p>
                            <button
                                onClick={() => navigator.clipboard.writeText(linkGenerado)}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                            >
                                📋 Copiar link de nuevo
                            </button>
                            <button
                                onClick={() => { setLinkGenerado(''); }}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                            >
                                Generar otro link
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
