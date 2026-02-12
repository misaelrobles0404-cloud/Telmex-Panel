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
    AlertCircle,
    Star,
    Trophy
} from 'lucide-react';
import { obtenerClientes } from '@/lib/storage';
import { calcularMetricas, formatearMoneda } from '@/lib/utils';
import { Cliente } from '@/types';
import { BLOQUES_TIEMPO, obtenerBloqueActual } from '@/data/agenda';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BossDashboardView } from '@/components/BossDashboardView';
import { PerfilUsuario } from '@/types';

export default function DashboardPage() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [metricas, setMetricas] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const bloqueActual = obtenerBloqueActual();

    const [user, setUser] = useState<any>(null);
    const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
    const [perfilActual, setPerfilActual] = useState<PerfilUsuario | null>(null);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                const clientesData = await obtenerClientes();

                // Lógica de Perfiles: Solo para el Súper Boss
                const esBoss = user?.email === 'ruizmosinfinitum2025@gmail.com';
                const esAdmin = user?.email === 'misaelrobles0404@gmail.com' || esBoss;

                if (esBoss) {
                    const { data: perfilesData, error: pfError } = await supabase.from('perfiles').select('*');
                    if (pfError) console.error("Error cargando perfiles:", pfError);
                    setPerfiles(perfilesData || []);
                }

                // Cargar perfil del usuario actual para el saludo
                if (user?.id) {
                    const { data: miPerfil } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    if (miPerfil) setPerfilActual(miPerfil);
                }

                let clientesFiltrados = clientesData;
                if (!esAdmin && user?.email) {
                    clientesFiltrados = clientesData.filter(c => c.usuario === user.email);
                }

                setClientes(clientesFiltrados);
                setMetricas(calcularMetricas(clientesFiltrados));

                // Si es Admin, calcular Super Vendedores (>7 instalaciones por semana)
                if (esAdmin) {
                    const hoy = new Date();
                    const inicioSemana = new Date(hoy);
                    const diaSemana = hoy.getDay() || 7;
                    inicioSemana.setHours(0, 0, 0, 0);
                    inicioSemana.setDate(inicioSemana.getDate() - diaSemana + 1);

                    const ventasPorUsuario: Record<string, number> = {};
                    clientesData.forEach(c => {
                        if (c.estado_pipeline === 'vendido' && c.fecha_instalacion) {
                            const fechaInst = new Date(c.fecha_instalacion);
                            if (fechaInst >= inicioSemana && c.usuario) {
                                ventasPorUsuario[c.usuario] = (ventasPorUsuario[c.usuario] || 0) + 1;
                            }
                        }
                    });

                    const superVendedores = Object.entries(ventasPorUsuario)
                        .filter(([_, total]) => total > 7)
                        .map(([email, total]) => ({ email, total }));

                    (window as any).superVendedores = superVendedores; // Temporal para pasar al render o usar un state
                    setSuperVendedores(superVendedores);
                }
            } catch (error) {
                console.error("Error al cargar dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    const [superVendedores, setSuperVendedores] = useState<{ email: string, total: number }[]>([]);

    if (loading || !metricas) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-telmex-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenido, <span className="font-semibold text-telmex-blue">{perfilActual?.nombre_completo || user?.email?.split('@')[0] || 'Usuario'}</span>
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

            {/* Alerta de Productividad (Solo Boss) */}
            {superVendedores.length > 0 && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {superVendedores.map((v) => (
                        <Card key={v.email} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 text-yellow-200/50 rotate-12">
                                <Trophy size={100} />
                            </div>
                            <CardContent className="p-5 flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-yellow-400 text-white rounded-full shadow-lg animate-bounce">
                                    <Star size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-yellow-800">¡Alerta de Meta Superada! 🏆</h3>
                                    <p className="text-yellow-700">
                                        El empleado <span className="font-bold underline">{v.email.split('@')[0]}</span> ha realizado <span className="text-2xl font-black">{v.total}</span> instalaciones esta semana.
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1 uppercase tracking-wider font-semibold">Excelente rendimiento detectado</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

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

            {/* Contenido Principal: Pipeline para empleados / Tablas por Promotor para Súper Boss */}
            <div>
                {user?.email === 'ruizmosinfinitum2025@gmail.com' ? (
                    <BossDashboardView
                        clientes={clientes}
                        perfiles={perfiles}
                    />
                ) : (
                    <>
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
                    </>
                )}
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
                    onClick={() => router.push('/campanas')}
                >
                    <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">📢</div>
                        <h3 className="font-semibold text-gray-900">Campañas</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Gestionar anuncios y presupuesto
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
