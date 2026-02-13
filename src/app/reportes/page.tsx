'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Cliente } from '@/types';
import { calcularMetricas, formatearMoneda } from '@/lib/utils';
import { obtenerClientes } from '@/lib/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from '@/lib/supabase';

export default function ReportesPage() {
    const [metricas, setMetricas] = useState(calcularMetricas());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const allClientes = await obtenerClientes();

                // Filtrado: Misael ve todo, los demás solo sus propios datos
                const esSuperAdmin = user?.email === 'misaelrobles0404@gmail.com';
                const clientes: Cliente[] = (esSuperAdmin || !user?.email)
                    ? allClientes
                    : allClientes.filter((c: Cliente) => c.usuario === user.email);

                setMetricas(calcularMetricas(clientes));
            } catch (error) {
                console.error("Error al cargar reportes:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);


    const dataPipeline = [
        { name: 'Prospectos', value: metricas.prospectos },
        { name: 'Pendientes', value: metricas.pendientesCaptura },
        { name: 'Capturados', value: metricas.capturados },
        { name: 'Posteados', value: metricas.posteados },
        { name: 'Sin Cobertur', value: metricas.sin_cobertura },
    ];

    // Datos simulados para razones de rechazo (basado en industria común)
    const dataRechazos = [
        { motivo: 'Precio alto', cantidad: 12 },
        { motivo: 'Poezo forzoso', cantidad: 8 },
        { motivo: 'Mala cobertura', cantidad: 5 },
        { motivo: 'Ya tiene servicio', cantidad: 15 },
        { motivo: 'Mal historial crediticio', cantidad: 3 },
    ];

    const COLORS = ['#94A3B8', '#3B82F6', '#F59E0B', '#8B5CF6', '#10B981'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-telmex-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Reportes y Métricas</h1>
                <p className="text-gray-600 mt-1">
                    Análisis de rendimiento y estadísticas
                </p>
            </div>

            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Leads del Mes</p>
                        <p className="text-3xl font-bold text-gray-900">{metricas.leadsMes}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Ventas del Mes</p>
                        <p className="text-3xl font-bold text-success">{metricas.ventasMes}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Tasa de Conversión</p>
                        <p className="text-3xl font-bold text-telmex-blue">
                            {metricas.tasaConversion.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Comisiones del Mes</p>
                        <p className="text-3xl font-bold text-warning">
                            {formatearMoneda(metricas.comisionesMes)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfica de Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución del Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataPipeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#0066CC" name="Clientes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Razones de Rechazo/Pérdida</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataRechazos} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="motivo" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="instalados" name="Instalados" fill="#22c55e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
