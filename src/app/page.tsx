'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { PipelineView } from '@/components/PipelineView';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Users,
    DollarSign,
    TrendingUp,
    Phone,
    Plus,
    Calendar,
} from 'lucide-react';
import { obtenerClientes } from '@/lib/storage';
import { calcularMetricas, formatearMoneda } from '@/lib/utils';
import { Cliente } from '@/types';
import { BLOQUES_TIEMPO, obtenerBloqueActual } from '@/data/agenda';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [metricas, setMetricas] = useState(calcularMetricas());
    const bloqueActual = obtenerBloqueActual();

    useEffect(() => {
        const clientesData = obtenerClientes();
        setClientes(clientesData);
        setMetricas(calcularMetricas());
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenido a TELMEX Panel Pro
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

            {/* Bloque de Tiempo Actual */}
            {bloqueActual && (
                <Card className="bg-gradient-to-r from-telmex-blue to-telmex-lightblue text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">{bloqueActual.icono}</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold">{bloqueActual.actividad}</h3>
                                <p className="text-white/90 mt-1">{bloqueActual.objetivo}</p>
                                <p className="text-sm text-white/80 mt-2">
                                    {bloqueActual.horaInicio} - {bloqueActual.horaFin}
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/agenda')}
                            >
                                Ver Agenda
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Leads del Mes"
                    value={metricas.leadsMes}
                    icon={Users}
                    color="blue"
                    trend={{ value: 12, isPositive: true }}
                />

                <MetricCard
                    title="Ventas del Mes"
                    value={metricas.ventasMes}
                    icon={TrendingUp}
                    color="green"
                    trend={{ value: 8, isPositive: true }}
                />

                <MetricCard
                    title="Comisiones del Mes"
                    value={formatearMoneda(metricas.comisionesMes)}
                    icon={DollarSign}
                    color="yellow"
                />

                <MetricCard
                    title="Tasa de Conversión"
                    value={`${metricas.tasaConversion.toFixed(1)}%`}
                    icon={Phone}
                    color="purple"
                />
            </div>

            {/* Pipeline de Ventas */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Pipeline de Ventas</h2>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/clientes')}
                    >
                        Ver Todos
                    </Button>
                </div>

                <PipelineView
                    clientes={clientes}
                    onClienteClick={(cliente) => router.push(`/clientes/${cliente.id}`)}
                />
            </div>

            {/* Agenda del Día */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Agenda del Día</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/agenda')}
                        >
                            <Calendar size={16} />
                            Ver Completa
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {BLOQUES_TIEMPO.map((bloque) => {
                            const esActual = bloqueActual?.id === bloque.id;

                            return (
                                <div
                                    key={bloque.id}
                                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${esActual ? 'bg-telmex-blue/10 border-2 border-telmex-blue' : 'bg-gray-50'
                                        }`}
                                >
                                    <div className="text-2xl">{bloque.icono}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900">{bloque.actividad}</h4>
                                            {esActual && (
                                                <span className="badge badge-blue">Ahora</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{bloque.objetivo}</p>
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        {bloque.horaInicio} - {bloque.horaFin}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/plantillas')}
                >
                    <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">💬</div>
                        <h3 className="font-semibold text-gray-900">Plantillas WhatsApp</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Mensajes predefinidos para prospectar
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/calculadora')}
                >
                    <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">🧮</div>
                        <h3 className="font-semibold text-gray-900">Calculadora</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Comparar paquetes y generar cotizaciones
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/publicaciones')}
                >
                    <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">📢</div>
                        <h3 className="font-semibold text-gray-900">Publicaciones</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Gestionar anuncios y presupuesto
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
