'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { PipelineView } from '@/components/PipelineView';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import {
    CheckCircle,
    XCircle,
    Search,
    Calendar,
    AlertCircle,
    Copy,
    Key,
    Users,
    DollarSign,
    TrendingUp,
    Phone,
    Plus,
    Star,
    Trophy
} from 'lucide-react';
import { obtenerClientes, guardarCliente, obtenerEstadoPortal, marcarPortalEnUso, liberarPortalGlobal, EstadoPortal } from '@/lib/storage';
import { calcularMetricas, formatearMoneda, generarId, calcularMinutosTranscurridos } from '@/lib/utils';
import { Cliente } from '@/types';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BossDashboardView } from '@/components/BossDashboardView';
import { PerfilUsuario } from '@/types';
import { InstalacionAlert } from '@/components/InstalacionAlert';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';

export default function DashboardPage() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [metricas, setMetricas] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

    const [user, setUser] = useState<any>(null);
    const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
    const [perfilActual, setPerfilActual] = useState<PerfilUsuario | null>(null);
    const [nuevaAlerta, setNuevaAlerta] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
    const [estadoPortal, setEstadoPortal] = useState<EstadoPortal>({ en_uso_por: null, en_uso_desde: null });

    const mostrarToast = (message: string) => {
        setToast({ message, isVisible: true });
    };

    const copiarAlPortapapeles = (texto: string, label: string) => {
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast(`${label} copiado`);
        });
    };

    const marcarUsoPortal = async () => {
        if (!user) return;

        setLoading(true);
        const nombreUsuario = perfilActual?.nombre_completo || user.email || 'Usuario';

        const yaEstaEnUso = !!estadoPortal.en_uso_por;
        const esMismoUsuario = estadoPortal.en_uso_por === nombreUsuario;
        const esAdmin = user.email === 'misaelrobles0404@gmail.com' || user.email?.includes('infinitummisael');

        const minutosTranscurridos = estadoPortal.en_uso_desde ? calcularMinutosTranscurridos(estadoPortal.en_uso_desde) : 0;
        const haExpirado = minutosTranscurridos >= 15;

        // Regla: Solo el que marcó puede liberar, A MENOS que sea admin y hayan pasado 15 min
        if (yaEstaEnUso && !esMismoUsuario) {
            if (esAdmin && haExpirado) {
                // Permitir liberación forzada por admin si ya pasó el tiempo
                mostrarToast(`⚠️ Forzando liberación del portal (ocupado por ${minutosTranscurridos} min)`);
            } else {
                const mensaje = haExpirado
                    ? `🔒 Ocupado por ${estadoPortal.en_uso_por}. Solo el admin puede liberarlo tras 15 min.`
                    : `🔒 Ocupado por ${estadoPortal.en_uso_por}. Quedan ${15 - minutosTranscurridos} min para liberación forzada.`;
                mostrarToast(mensaje);
                setLoading(false);
                return;
            }
        }

        const debeLiberar = yaEstaEnUso && (esMismoUsuario || (esAdmin && haExpirado));

        try {
            if (debeLiberar) {
                await liberarPortalGlobal();
                mostrarToast('✅ Portal liberado.');
            } else {
                await marcarPortalEnUso(nombreUsuario);
                mostrarToast(`🌐 Portal marcado por ${nombreUsuario}`);
            }
            const estado = await obtenerEstadoPortal();
            setEstadoPortal(estado);
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const cargarDatos = React.useCallback(async (skipLoading = false) => {
        try {
            if (!skipLoading) setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const clientesData = await obtenerClientes();

            // Lógica de Perfiles: Súper Boss (Ruiz) y Administrador (Misael)
            const esBoss = user?.email === 'carrillomarjory7@gmail.com';
            const esAdmin = esBoss;

            const { data: perfilesData } = await supabase.from('perfiles').select('*');
            if (esAdmin) {
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
            setMetricas(calcularMetricas(clientesFiltrados, perfilesData || undefined));

            // Seleccionar cliente por defecto para el banner si hay uno pendiente
            const pendiente = clientesFiltrados.find(c =>
                c.folio_siac &&
                c.folio_siac.trim() !== '' &&
                c.estado_pipeline !== 'posteado' &&
                c.estado_pipeline !== 'sin_cobertura' &&
                c.estado_pipeline !== 'cancelado'
            );
            if (pendiente && !clienteSeleccionado) {
                setClienteSeleccionado(pendiente);
            } else if (clienteSeleccionado) {
                // Actualizar el cliente seleccionado con datos frescos si ya hay uno
                const actualizado = clientesFiltrados.find(c => c.id === clienteSeleccionado.id);
                if (actualizado) setClienteSeleccionado(actualizado);
            }

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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload: any) => {
                cargarDatos(true);
                if (user?.email === 'carrillomarjory7@gmail.com') {
                    const { new: newRow, old: oldRow } = payload;
                    if (newRow && newRow.estado_pipeline === 'posteado' && (!oldRow || oldRow.estado_pipeline !== 'posteado')) {
                        setNuevaAlerta({ cliente: newRow.nombre, promotor: newRow.promotor_nombre || newRow.usuario || 'Promotor', paquete: newRow.paquete });
                    }
                }
            })
            .subscribe();

        // Cargar y suscribir estado global del portal
        obtenerEstadoPortal().then(setEstadoPortal);
        const portalChannel = supabase
            .channel('portal_estado_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_estado' }, async () => {
                const estado = await obtenerEstadoPortal();
                setEstadoPortal(estado);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(portalChannel);
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
            {/* Header Rediseñado Premium */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-xl" />
                <div className="relative bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard Central</h1>
                            {user?.email === 'carrillomarjory7@gmail.com' && (
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-500/30">
                                    Súper Admin
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 font-medium">
                            Bienvenido, <span className="font-bold text-telmex-blue text-lg">{perfilActual?.nombre_completo || user?.email?.split('@')[0] || 'Usuario'}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {user?.email === 'carrillomarjory7@gmail.com' && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 sm:flex-none border-blue-200 text-blue-700 bg-white/50 backdrop-blur-md hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-all"
                                onClick={() => router.push('/nominas')}
                            >
                                <DollarSign size={20} className="mr-2" />
                                Nóminas
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1 sm:flex-none bg-gradient-to-r from-telmex-blue to-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
                            onClick={() => router.push('/clientes/nuevo')}
                        >
                            <Plus size={20} className="mr-2" />
                            Nuevo Cliente
                        </Button>
                    </div>
                </div>
            </div>

            {/* Banner de Acceso Rápido (Clave Universal) */}
            <div className="bg-white/40 backdrop-blur-md border border-blue-100 rounded-3xl p-4 md:p-5 shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors" />

                <div className="relative flex flex-col lg:flex-row items-stretch gap-4">
                    {/* Título y Badge */}
                    <div className="flex items-center gap-3 min-w-fit px-2">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                            <Key size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[#001b44] tracking-tight leading-tight">Clave Universal</h2>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Acceso Portales</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                        {/* Cuenta de Acceso */}
                        <div className="bg-white/60 rounded-2xl p-3 border border-blue-50 shadow-sm flex flex-col justify-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Cuenta de Acceso</p>
                            <div className="flex flex-wrap gap-1.5">
                                {['GUSTAVO', 'ACEVEDO', 'ZAMARRON'].map((nombre, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => copiarAlPortapapeles(nombre, 'Nombre')}
                                        className="bg-blue-50/50 hover:bg-blue-100 text-blue-700 font-black text-[10px] px-2.5 py-1 rounded-lg border border-blue-100 transition-all active:scale-95 uppercase"
                                    >
                                        {nombre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ID de Usuario */}
                        <div className="bg-white/60 rounded-2xl p-3 border border-blue-50 shadow-sm flex flex-col justify-center relative group/id">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">ID Usuario</p>
                            <button
                                onClick={() => copiarAlPortapapeles('10000900', 'ID')}
                                className="flex items-center justify-between bg-white border border-gray-100 px-3 py-1.5 rounded-xl hover:border-blue-200 transition-all active:scale-95 group-hover/id:shadow-sm"
                            >
                                <span className="text-sm font-black text-gray-800 tracking-widest uppercase">10000900</span>
                                <Copy size={14} className="text-gray-300 group-hover/id:text-blue-500 transition-colors" />
                            </button>
                        </div>

                        {/* Clave de Captura */}
                        <div className="bg-white/60 rounded-2xl p-3 border border-blue-50 shadow-sm flex flex-col justify-center group/key">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Clave Captura</p>
                            <button
                                onClick={() => copiarAlPortapapeles('337595', 'Clave')}
                                className="flex items-center justify-between bg-white/80 border border-yellow-200 px-3 py-1.5 rounded-xl hover:border-yellow-400 transition-all active:scale-95 group-hover/key:shadow-md"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🔓</span>
                                    <span className="text-xl font-black text-yellow-700 tracking-[0.15em]">337595</span>
                                </div>
                                <Copy size={16} className="text-yellow-600/30 group-hover/key:text-yellow-600 transition-colors" />
                            </button>
                        </div>

                        {/* Panel de Acción (Marcado) */}
                        <div className="bg-white rounded-xl p-2 border border-blue-50 shadow-sm flex flex-col justify-center">
                            {(() => {
                                const nombreUsuario = perfilActual?.nombre_completo || user?.email || '';
                                const esMismoUsuario = estadoPortal.en_uso_por === nombreUsuario;
                                const esAdmin = user?.email === 'misaelrobles0404@gmail.com' || user?.email?.includes('infinitummisael');
                                const estaOcupado = !!estadoPortal.en_uso_por;
                                const minutos = estadoPortal.en_uso_desde ? calcularMinutosTranscurridos(estadoPortal.en_uso_desde) : 0;
                                const haExpirado = minutos >= 15;
                                const puedeLiberar = esMismoUsuario || (esAdmin && haExpirado);

                                return (
                                    <button
                                        onClick={() => marcarUsoPortal()}
                                        className={`rounded-xl py-2 px-4 shadow-sm border w-full flex items-center justify-center gap-2 transition-all ${estaOcupado && !puedeLiberar
                                                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 active:scale-95'
                                                : estaOcupado
                                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 active:scale-95'
                                                    : 'bg-white border-gray-100 text-[#001b44] hover:bg-gray-50 active:scale-95'
                                            }`}
                                    >
                                        <span className="text-sm">{estaOcupado ? '🔒' : '🌐'}</span>
                                        <span className="font-black text-[10px] tracking-wide uppercase flex flex-col items-start leading-tight">
                                            <span>
                                                {estaOcupado
                                                    ? esMismoUsuario
                                                        ? `LIBERAR (${estadoPortal.en_uso_por!.split(' ')[0]})`
                                                        : haExpirado && esAdmin
                                                            ? `FORZAR (HACE ${minutos}')`
                                                            : `EN USO: ${estadoPortal.en_uso_por!.split(' ')[0]}`
                                                    : 'Marcar Uso Portal'}
                                            </span>
                                            {estaOcupado && (
                                                <span className="text-[7px] opacity-60 font-bold">
                                                    Hace {minutos} min
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerta de Productividad (Solo Boss) - Premium */}
            {superVendedores.length > 0 && (
                <div className="grid grid-cols-1 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    {superVendedores.map((v) => (
                        <Card key={v.email} className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 border-0 overflow-hidden relative shadow-[0_8px_30px_rgb(251,191,36,0.2)]">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="absolute -right-4 -top-8 text-white/20 rotate-12 scale-150 blur-sm mix-blend-overlay pointer-events-none">
                                <Trophy size={160} />
                            </div>
                            <CardContent className="p-6 md:p-8 flex items-center gap-6 relative z-10">
                                <div className="p-4 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-2xl shadow-xl animate-bounce">
                                    <Star size={32} fill="currentColor" />
                                </div>
                                <div className="text-white">
                                    <h3 className="text-2xl font-black mb-1 drop-shadow-sm flex items-center gap-2">
                                        ¡Meta Superada! <Trophy size={24} className="text-yellow-200" />
                                    </h3>
                                    <p className="text-white/90 text-sm md:text-base font-medium">
                                        El asesor <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">{perfiles.find(p => p.email === v.email)?.nombre_completo || v.email.split('@')[0]}</span> ha alcanzado <span className="text-2xl font-black mx-1 drop-shadow-md">{v.total}</span> instalaciones esta semana.
                                    </p>
                                    <div className="inline-block mt-3 px-3 py-1 bg-black/10 backdrop-blur-sm rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                                        Rendimiento Extraordinario
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}


            {/* Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {user?.email === 'carrillomarjory7@gmail.com' ? (
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



            {/* Contenido Principal: Pipeline para empleados / Tablas por Promotor para Súper Boss */}
            <div>
                {user?.email === 'carrillomarjory7@gmail.com' ? (
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
            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div >
    );
}
