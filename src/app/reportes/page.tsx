'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { calcularMetricas, formatearMoneda } from '@/lib/utils';
import { obtenerPublicaciones, obtenerClientes } from '@/lib/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function ReportesPage() {
    const [metricas, setMetricas] = useState(calcularMetricas());
    const [roiData, setRoiData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [clientes, pubs] = await Promise.all([
                    obtenerClientes(),
                    obtenerPublicaciones()
                ]);

                setMetricas(calcularMetricas(clientes));
                calcularRoiPorPlataforma(pubs);
            } catch (error) {
                console.error("Error al cargar reportes:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    const calcularRoiPorPlataforma = (pubs: any[]) => {
        const stats: Record<string, { gasto: number; leads: number }> = {
            facebook: { gasto: 0, leads: 0 },
            instagram: { gasto: 0, leads: 0 },
            marketplace: { gasto: 0, leads: 0 }
        };

        pubs.forEach(pub => {
            if (pub.plataforma && stats[pub.plataforma]) {
                stats[pub.plataforma].gasto += (pub.activa ? pub.presupuesto * 30 : 0); // Estimado mensual
                stats[pub.plataforma].leads += (pub.leads_generados || 0);
            }
        });

        const data = [
            { name: 'Facebook', gasto: stats.facebook.gasto, leads: stats.facebook.leads },
            { name: 'Instagram', gasto: stats.instagram.gasto, leads: stats.instagram.leads },
            { name: 'Marketplace', gasto: stats.marketplace.gasto, leads: stats.marketplace.leads },
        ];
        setRoiData(data);
    };

    const dataPipeline = [
        { name: 'Prospectos', value: metricas.contactados },
        { name: 'Interesado', value: metricas.interesados },
        { name: 'Cierre', value: metricas.cierresProgramados },
        { name: 'Instalado', value: metricas.vendidos },
        { name: 'Sin Cobertura', value: metricas.sin_cobertura },
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

            {/* ROI y Comisiones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Inversión en Campañas Estimada (Mensual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={roiData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatearMoneda(value as number)} />
                                <Legend />
                                <Bar dataKey="gasto" fill="#8B5CF6" name="Gasto Estimado" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de Comisiones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <span className="text-gray-700">Comisiones Hoy</span>
                                <span className="text-xl font-bold text-telmex-blue">
                                    {formatearMoneda(metricas.comisionesHoy)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <span className="text-gray-700">Comisiones Semana</span>
                                <span className="text-xl font-bold text-telmex-blue">
                                    {formatearMoneda(metricas.comisionesSemana)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-telmex-blue/10 rounded-lg">
                                <span className="text-gray-700 font-semibold">Comisiones Mes</span>
                                <span className="text-2xl font-bold text-telmex-blue">
                                    {formatearMoneda(metricas.comisionesMes)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
