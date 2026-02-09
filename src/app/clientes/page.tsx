'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Cliente } from '@/types';
import { obtenerClientes } from '@/lib/storage';
import { formatearMoneda, formatearFecha } from '@/lib/utils';
import { Plus, Search, Filter } from 'lucide-react';

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

    useEffect(() => {
        const cargarClientes = async () => {
            try {
                const data = await obtenerClientes();
                setClientes(data);

                // Calcular estadísticas
                const hoy = new Date();
                const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

                const primerDiaSemana = new Date(hoy);
                const diaSemana = hoy.getDay() || 7; // Hacer que lunes sea 1 y domingo 7
                primerDiaSemana.setHours(0, 0, 0, 0);
                primerDiaSemana.setDate(primerDiaSemana.getDate() - diaSemana + 1);

                const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

                const statsCalculated = data.reduce((acc, cliente) => {
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
            // Excluir sin_cobertura y cobertura_cobre de la vista general por defecto
            matchEstado = cliente.estado_pipeline !== 'sin_cobertura' && cliente.estado_pipeline !== 'cobertura_cobre';
        } else {
            matchEstado = cliente.estado_pipeline === filtroEstado;
        }

        return matchBusqueda && matchEstado;
    });

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-600 mt-1">
                        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => router.push('/clientes/nuevo')}
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </Button>
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
                    <option value="contactado">Contactado</option>
                    <option value="interesado">Interesado</option>
                    <option value="cierre_programado">Cierre Programado</option>
                    <option value="vendido">Vendido</option>
                    <option value="sin_cobertura">Sin Cobertura</option>
                    <option value="cobertura_cobre">Cobertura Cobre</option>
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
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{cliente.nombre}</h3>
                                        <span className={`badge ${cliente.estado_pipeline === 'vendido' ? 'badge-green' :
                                            cliente.estado_pipeline === 'cierre_programado' ? 'badge-purple' :
                                                cliente.estado_pipeline === 'interesado' ? 'badge-blue' :
                                                    cliente.estado_pipeline === 'sin_cobertura' ? 'bg-red-100 text-red-700' :
                                                        cliente.estado_pipeline === 'cobertura_cobre' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-800'
                                            }`}>
                                            {cliente.estado_pipeline === 'vendido' && 'Vendido'}
                                            {cliente.estado_pipeline === 'cierre_programado' && 'Cierre Programado'}
                                            {cliente.estado_pipeline === 'interesado' && 'Interesado'}
                                            {cliente.estado_pipeline === 'contactado' && 'Contactado'}
                                            {cliente.estado_pipeline === 'sin_cobertura' && 'Sin Cobertura'}
                                            {cliente.estado_pipeline === 'cobertura_cobre' && 'Cobertura Cobre'}
                                        </span>
                                        <span className={`badge ${cliente.tipo_servicio === 'linea_nueva' ? 'badge-blue' :
                                            cliente.tipo_servicio === 'portabilidad' ? 'badge-purple' :
                                                'badge-green'
                                            }`}>
                                            {cliente.tipo_servicio === 'linea_nueva' && 'Línea Nueva'}
                                            {cliente.tipo_servicio === 'portabilidad' && 'Portabilidad'}
                                            {cliente.tipo_servicio === 'winback' && 'Winback'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Teléfono (TT)</p>
                                            <p className="font-medium text-gray-900">{cliente.no_tt}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Referencias</p>
                                            <p className="font-medium text-gray-900">R1: {cliente.no_ref}</p>
                                            {cliente.no_ref_2 && (
                                                <p className="text-xs text-gray-500">R2: {cliente.no_ref_2}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Correo</p>
                                            <p className="font-medium text-gray-900">{cliente.correo}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Paquete</p>
                                            <p className="font-medium text-gray-900">{cliente.paquete}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Comisión</p>
                                            <p className="font-medium text-telmex-blue">{formatearMoneda(cliente.comision)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-xs text-gray-500">
                                        Contactado: {formatearFecha(cliente.fecha_contacto)}
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
        </div>
    );
}
