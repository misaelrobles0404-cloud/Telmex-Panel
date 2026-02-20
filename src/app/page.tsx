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
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BossDashboardView } from '@/components/BossDashboardView';
import { PerfilUsuario } from '@/types';
import { InstalacionAlert } from '@/components/InstalacionAlert';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { ClavesPortalCard } from '@/components/ClavesPortalCard';

export default function DashboardPage() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [metricas, setMetricas] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState<any>(null);
    const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
    const [perfilActual, setPerfilActual] = useState<PerfilUsuario | null>(null);
    const [nuevaAlerta, setNuevaAlerta] = useState<any>(null);

    const cargarDatos = React.useCallback(async (skipLoading = false) => {
        try {
            if (!skipLoading) setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const clientesData = await obtenerClientes();

            // Lógica de Perfiles: Súper Boss (Ruiz) y Administrador (Misael)
            const esBoss = user?.email === 'ruizmosinfinitum2025@gmail.com';
            const esAdmin = esBoss;

            if (esAdmin) {
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
                    .maybeSingle();
                if (miPerfil) setPerfilActual(miPerfil);
            }

            let clientesFiltrados = clientesData;
            if (!esAdmin && user?.email) {
                clientesFiltrados = clientesData.filter(c =>
                    c.usuario === user.email ||
                    c.user_id === user.id
                );
            }

            setClientes(clientesFiltrados);
            setMetricas(calcularMetricas(clientesFiltrados, esAdmin ? perfiles : undefined));

            // Si es Admin, calcular Super Vendedores (>7 instalaciones por semana)
            if (esAdmin) {
                const hoy = new Date();
                const diaSemana = hoy.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mie, 4 = Jue, 5 = Vie, 6 = Sab

                // Si el corte es Miércoles, la semana empieza el Jueves anterior
                // Días a retroceder para llegar al Jueves: (diaSemana - 4 + 7) % 7
                const diasParaJueves = (diaSemana - 4 + 7) % 7;
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - diasParaJueves);
                inicioSemana.setHours(0, 0, 0, 0);

                const ventasPorUsuario: Record<string, number> = {};
                clientesData.forEach(c => {
                    if (c.estado_pipeline === 'posteado' && c.fecha_instalacion) {
                        const fechaInst = new Date(c.fecha_instalacion);
                        if (fechaInst >= inicioSemana && c.usuario) {
                            ventasPorUsuario[c.usuario] = (ventasPorUsuario[c.usuario] || 0) + 1;
                        }
                    }
                });

                // Umbral Super Vendedor: 7 instalaciones por semana
                const umbralSuperVendedor = 7;

                const sv = Object.entries(ventasPorUsuario)
                    .filter(([_, total]) => total >= umbralSuperVendedor)
                    .map(([email, total]) => ({ email, total }));

                setSuperVendedores(sv);
            }
        } catch (error) {
            console.error("Error al cargar dashboard:", error);
        } finally {
            if (!skipLoading) setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Suscripción Realtime (Efecto separado)
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'clientes'
                },
                (payload: any) => {
                    // Refrescar datos silenciosamente ante cualquier cambio
                    cargarDatos(true);

                    // Alerta específica para instalaciones (solo si es Boss)
                    if (user?.email === 'ruizmosinfinitum2025@gmail.com') {
                        const { new: newRow, old: oldRow } = payload;
                        if (newRow && newRow.estado_pipeline === 'posteado' && (!oldRow || oldRow.estado_pipeline !== 'posteado')) {
                            setNuevaAlerta({
                                cliente: newRow.nombre,
                                promotor: newRow.promotor_nombre || newRow.usuario || 'Promotor',
                                paquete: newRow.paquete
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, cargarDatos]);

    const [superVendedores, setSuperVendedores] = useState<{ email: string, total: number }[]>([]);

    if (loading || !metricas) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-telmex-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
            <InstalacionAlert nuevaInstalacion={nuevaAlerta} />
            <AnnouncementBanner />

            {/* Recordatorio de Corte (Solo Miércoles) */}
            {new Date().getDay() === 3 && (
                <Card className="bg-red-600 text-white border-0 shadow-xl animate-pulse">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight text-white">¡HOY ES DÍA DE CORTE! ⚠️</h3>
                                <p className="text-white/90 text-sm">Realiza el último chequeo de los posteos (instaladas) hoy antes del cierre.</p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white text-red-600 hover:bg-gray-100 border-0 font-bold"
                            onClick={() => router.push('/comisiones')}
                        >
                            Ir a Comisiones
                        </Button>
                    </CardContent>
                </Card>
            )}
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenido, <span className="font-semibold text-telmex-blue">{perfilActual?.nombre_completo || user?.email?.split('@')[0] || 'Usuario'}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {user?.email === 'ruizmosinfinitum2025@gmail.com' && (
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-telmex-blue text-telmex-blue hover:bg-blue-50"
                            onClick={() => router.push('/nominas')}
                        >
                            <DollarSign size={20} />
                            Nóminas
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => router.push('/clientes/nuevo')}
                    >
                        <Plus size={20} />
                        Nuevo Cliente
                    </Button>
                </div>
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
                                        El empleado <span className="font-bold underline">{perfiles.find(p => p.email === v.email)?.nombre_completo || v.email.split('@')[0]}</span> ha realizado <span className="text-2xl font-black">{v.total}</span> instalaciones esta semana.
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1 uppercase tracking-wider font-semibold">Excelente rendimiento detectado</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}


            {/* Métricas Principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {user?.email === 'ruizmosinfinitum2025@gmail.com' ? (
                    <>
                        <MetricCard
                            title="Ventas Programadas Hoy"
                            value={metricas.ventasProgramadasHoy}
                            icon={Calendar}
                            color="blue"
                        />
                        <MetricCard
                            title="Ventas de la Semana"
                            value={metricas.ventasSemana}
                            icon={TrendingUp}
                            color="green"
                        />
                        <MetricCard
                            title="Ventas del Mes"
                            value={metricas.ventasMes}
                            icon={Trophy}
                            color="yellow"
                        />
                        <MetricCard
                            title="Promotor Top"
                            value={metricas.promotorTop?.nombre || '---'}
                            subtitle={metricas.promotorTop ? `${metricas.promotorTop.total} instalaciones` : 'Sin ventas'}
                            icon={Star}
                            color="purple"
                        />
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            {/* Acceso a Claves de Portal (Solo para empleados) */}
            {user?.email !== 'ruizmosinfinitum2025@gmail.com' && (
                <div className="w-full">
                    <ClavesPortalCard modo="detalle" />
                </div>
            )}

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


            {/* Acciones Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            </div>
        </div >
    );
}
