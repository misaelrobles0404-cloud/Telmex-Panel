'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { BLOQUES_TIEMPO, obtenerBloqueActual } from '@/data/agenda';
import { Recordatorio } from '@/types';
import { obtenerRecordatorios, guardarRecordatorio, eliminarRecordatorio } from '@/lib/storage';
import { generarId, formatearFecha } from '@/lib/utils';
import { Bell, Check, Trash2, Plus, Clock, AlertCircle } from 'lucide-react';

export default function AgendaPage() {
    const [bloqueActual, setBloqueActual] = useState(obtenerBloqueActual());
    const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);

    // Form state
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevaPrioridad, setNuevaPrioridad] = useState<'baja' | 'media' | 'alta'>('media');
    const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().slice(0, 16));

    useEffect(() => {
        // Cargar datos iniciales
        setRecordatorios(obtenerRecordatorios());

        // Actualizar bloque actual cada minuto
        const interval = setInterval(() => {
            setBloqueActual(obtenerBloqueActual());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const agregarRecordatorio = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoTitulo.trim()) return;

        const nuevo: Recordatorio = {
            id: generarId(),
            titulo: nuevoTitulo,
            fecha: nuevaFecha,
            prioridad: nuevaPrioridad,
            completado: false
        };

        const actualizados = [...recordatorios, nuevo];
        setRecordatorios(actualizados);
        guardarRecordatorio(nuevo);

        setNuevoTitulo('');
        setNuevaPrioridad('media');
    };

    const toggleCompletado = (id: string) => {
        const recordatorio = recordatorios.find(r => r.id === id);
        if (recordatorio) {
            const actualizado = { ...recordatorio, completado: !recordatorio.completado };
            const listaActualizada = recordatorios.map(r => r.id === id ? actualizado : r);
            setRecordatorios(listaActualizada);
            guardarRecordatorio(actualizado);
        }
    };

    const borrarRecordatorio = (id: string) => {
        if (confirm('¿Borrar recordatorio?')) {
            const filtrados = recordatorios.filter(r => r.id !== id);
            setRecordatorios(filtrados);
            eliminarRecordatorio(id);
        }
    };

    // Ordenar: Pendientes primero, luego por prioridad/fecha
    const recordatoriosOrdenados = [...recordatorios].sort((a, b) => {
        if (a.completado === b.completado) {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        }
        return a.completado ? 1 : -1;
    });

    const pendientes = recordatorios.filter(r => !r.completado).length;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agenda Inteligente</h1>
                    <p className="text-gray-600 mt-1">
                        Tu horario optimizado para máxima productividad
                    </p>
                </div>

                {bloqueActual && (
                    <div className="bg-telmex-blue text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
                        <Clock size={20} />
                        <div>
                            <p className="text-xs opacity-90">Bloque Actual:</p>
                            <p className="font-bold">{bloqueActual.actividad}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Recordatorios */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Bell size={18} className="text-telmex-blue" />
                                    Recordatorios
                                </CardTitle>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${pendientes > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {pendientes} pendientes
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-4">
                            {/* Formulario Rápido */}
                            <form onSubmit={agregarRecordatorio} className="mb-6 space-y-3">
                                <Input
                                    placeholder="Nueva tarea..."
                                    value={nuevoTitulo}
                                    onChange={(e) => setNuevoTitulo(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="datetime-local"
                                        className="input text-sm flex-1"
                                        value={nuevaFecha}
                                        onChange={(e) => setNuevaFecha(e.target.value)}
                                    />
                                    <select
                                        className="input w-24 text-sm"
                                        value={nuevaPrioridad}
                                        onChange={(e) => setNuevaPrioridad(e.target.value as any)}
                                    >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                    </select>
                                </div>
                                <Button type="submit" variant="primary" className="w-full text-sm">
                                    <Plus size={16} /> Agregar Tarea
                                </Button>
                            </form>

                            {/* Lista de Tareas */}
                            <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                                {recordatoriosOrdenados.length === 0 && (
                                    <p className="text-center text-sm text-gray-500 py-4">No hay recordatorios pendientes</p>
                                )}

                                {recordatoriosOrdenados.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`group p-3 rounded-lg border transition-all ${item.completado ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={() => toggleCompletado(item.id)}
                                                className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.completado ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-telmex-blue'
                                                    }`}
                                            >
                                                {item.completado && <Check size={12} />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${item.completado ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                    {item.titulo}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${item.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                                                            item.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {item.prioridad}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(item.fecha).toLocaleDateString()} {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => borrarRecordatorio(item.id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Bloques de Tiempo */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {BLOQUES_TIEMPO.map((bloque) => {
                            const esActual = bloqueActual?.id === bloque.id;

                            return (
                                <Card
                                    key={bloque.id}
                                    className={`transition-all ${esActual ? 'ring-2 ring-telmex-blue shadow-lg scale-[1.01]' : 'opacity-90 hover:opacity-100'}`}
                                >
                                    <div className={`h-1 w-full rounded-t-lg ${bloque.color.replace('text-', 'bg-')}`}></div>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="text-4xl">{bloque.icono}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-gray-900 text-lg">{bloque.actividad}</h3>
                                                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {bloque.horaInicio} - {bloque.horaFin}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1">{bloque.objetivo}</p>

                                                {esActual && (
                                                    <div className="mt-3 flex items-center gap-2 text-sm text-telmex-blue font-medium bg-blue-50 p-2 rounded">
                                                        <AlertCircle size={16} />
                                                        <span>Actividad Recomendada Ahora</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Consejos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>💡 Tips de Productividad</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                                <li className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
                                    <span className="text-telmex-blue font-bold">•</span>
                                    <span>Agrupa llamadas en el bloque de "Prospección"</span>
                                </li>
                                <li className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
                                    <span className="text-telmex-blue font-bold">•</span>
                                    <span>Usa plantillas para responder mensajes repetitivos</span>
                                </li>
                                <li className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
                                    <span className="text-telmex-blue font-bold">•</span>
                                    <span>Revisa métricas al final de cada día</span>
                                </li>
                                <li className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
                                    <span className="text-telmex-blue font-bold">•</span>
                                    <span>Prepara tus publicaciones con un día de anticipación</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
