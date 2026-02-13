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
import { Plus, Search, Filter, Trash2, AlertTriangle } from 'lucide-react';
import { eliminarClientesMasivos } from '@/lib/storage';

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
                // Ruiz (Boss) ve todo para gestión.
                // Todos los demás (incluyendo Misael) ven solo lo SUYO.
                const esBoss = user?.email === 'ruizmosinfinitum2025@gmail.com';

                let clientesFiltradosData = data;
                if (!esBoss && user?.email) {
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
                        className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm"
                        title="Eliminar clientes antiguos (> 1 mes)"
                    >
                        <Trash2 size={16} className="mr-1 md:mr-2" />
                        Limpieza
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push('/clientes/nuevo')}
                        className="flex-1 sm:flex-none text-xs md:text-sm"
                    >
                        <Plus size={16} className="mr-1 md:mr-2" />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Registrados Hoy</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.hoy}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <span className="text-xl">📅</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Esta Semana</p>
                            <p className="text-2xl font-bold text-green-900">{stats.semana}</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <span className="text-xl">📆</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Este Mes</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.mes}</p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                            <span className="text-xl">📊</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o correo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="input"
                >
                    <option value="todos">Todos los prospectos activos</option>
                    <option value="prospecto">Prospectos</option>
                    <option value="pendiente_captura">Pendiente Capturar</option>
                    <option value="capturado">Capturado</option>
                    <option value="posteado">Posteado</option>
                </select>
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
                                                {cliente.estado_pipeline === 'posteado' && 'Posteado'}
                                                {cliente.estado_pipeline === 'capturado' && 'Capturado'}
                                                {cliente.estado_pipeline === 'prospecto' && 'Prospecto'}
                                                {cliente.estado_pipeline === 'pendiente_captura' && 'Pendiente'}
                                                {cliente.estado_pipeline === 'sin_cobertura' && 'Sin Cobertura'}
                                            </span>
                                            <span className={`badge text-[10px] md:text-xs ${cliente.tipo_servicio === 'linea_nueva' ? 'badge-blue' :
                                                cliente.tipo_servicio === 'portabilidad' ? 'badge-purple' :
                                                    'badge-green'
                                                }`}>
                                                {cliente.tipo_servicio === 'linea_nueva' && 'Línea Nueva'}
                                                {cliente.tipo_servicio === 'portabilidad' && 'Portabilidad'}
                                                {cliente.tipo_servicio === 'winback' && 'Winback'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
                                        <div className="bg-gray-50 p-2 rounded-md sm:bg-transparent sm:p-0">
                                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Teléfono (TT)</p>
                                            <p className="font-medium text-gray-900 break-all">{cliente.no_tt}</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-md sm:bg-transparent sm:p-0">
                                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Referencias</p>
                                            <p className="font-medium text-gray-900">R1: {cliente.no_ref}</p>
                                            {cliente.no_ref_2 && (
                                                <p className="text-[10px] text-gray-500">R2: {cliente.no_ref_2}</p>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-md sm:bg-transparent sm:p-0">
                                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Correo</p>
                                            <p className="font-medium text-gray-900 break-all">{cliente.correo}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:block sm:bg-transparent sm:p-0">
                                            <div className="bg-gray-50 p-2 rounded-md sm:bg-transparent sm:p-0">
                                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Paquete</p>
                                                <p className="font-medium text-gray-900 truncate">{cliente.paquete}</p>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-md sm:bg-transparent sm:p-0">
                                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Comisión</p>
                                                <p className="font-black text-telmex-blue text-base">{formatearMoneda(cliente.comision)}</p>
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
        </div>
    );
}
