'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Facebook, Instagram, Calendar as CalendarIcon, DollarSign, Users, BarChart2, Zap, Pause, Play, Trash2 } from 'lucide-react';
import { Publicacion } from '@/types';
import { obtenerPublicaciones, obtenerClientes, guardarPublicacion, eliminarPublicacion } from '@/lib/storage';
import { formatearMoneda, formatearFecha, generarId, calcularEstadisticasCampana } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const [user, setUser] = useState<any>(null);

useEffect(() => {
    const cargarDatos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const [pubs, clients] = await Promise.all([
                obtenerPublicaciones(),
                obtenerClientes()
            ]);
            setPublicaciones(calcularEstadisticasCampana(pubs, clients));
        } catch (error) {
            console.error("Error al cargar campañas:", error);
        } finally {
            setLoading(false);
        }
    };
    cargarDatos();
}, []);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
        alert('Error: Sesión de usuario no detectada. Por favor re-inicia sesión.');
        return;
    }

    const nuevaPublicacion: Publicacion = {
        id: generarId(),
        user_id: user.id,
        titulo,
        plataforma,
        fechaPublicacion: fecha,
        presupuesto: parseFloat(presupuesto),
        leadsGenerados: 0,
        alcance: 0,
        interacciones: 0,
        activa: true
    };

    try {
        await guardarPublicacion(nuevaPublicacion);
        const nuevasPublicaciones = [...publicaciones, nuevaPublicacion];
        setPublicaciones(nuevasPublicaciones);
        setModalOpen(false);
        resetForm();
    } catch (error) {
        console.error("Error al guardar campaña:", error);
        alert('Error al guardar campaña');
    }
};

const resetForm = () => {
    setTitulo('');
    setPlataforma('facebook');
    setPresupuesto('35');
    setFecha(new Date().toISOString().slice(0, 10));
};

const toggleEstado = async (id: string) => {
    const updated = publicaciones.map(p =>
        p.id === id ? { ...p, activa: !p.activa } : p
    );

    const pub = updated.find(p => p.id === id);
    if (pub) {
        try {
            await guardarPublicacion(pub);
            setPublicaciones(updated);
        } catch (error) {
            alert('Error al actualizar estado de la campaña');
        }
    }
};

const handleDeletePublicacion = async (id: string) => {
    if (!confirm('¿Eliminar publicación?')) return;

    try {
        await eliminarPublicacion(id);
        const updated = publicaciones.filter(p => p.id !== id);
        setPublicaciones(updated);
    } catch (error) {
        alert('Error al eliminar campaña');
    }
};

// Cálculos
const gastadoMes = publicaciones.reduce((acc, curr) => acc + (curr.activa ? curr.presupuesto : 0), 0) * 30; // Proyección simple
const leadsTotal = publicaciones.reduce((acc, curr) => acc + curr.leadsGenerados, 0);

// Calendario
const hoy = new Date();
const inicioMes = startOfMonth(hoy);
const finMes = endOfMonth(hoy);
const diasCalendario = eachDayOfInterval({ start: inicioMes, end: finMes });

return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestor de Campañas</h1>
                <p className="text-gray-600 mt-1">
                    Controla tus campañas y presupuesto diario
                </p>
            </div>

            <Button variant="primary" size="lg" onClick={() => setModalOpen(true)}>
                <Plus size={20} />
                Nueva Campaña
            </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Presupuesto Diario</p>
                        <p className="text-2xl font-bold text-gray-900">${presupuestoDiario}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-telmex-blue rounded-full">
                        <DollarSign size={24} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Proyección Mensual</p>
                        <p className="text-2xl font-bold text-warning">{formatearMoneda(gastadoMes)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 text-warning rounded-full">
                        <BarChart2 size={24} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Leads Generados</p>
                        <p className="text-2xl font-bold text-success">{leadsTotal}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-success rounded-full">
                        <Users size={24} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Campañas Activas</p>
                        <p className="text-2xl font-bold text-telmex-blue">
                            {publicaciones.filter(p => p.activa).length}
                        </p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                        <Zap size={24} />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Publicaciones */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Campañas Activas</h2>
                {publicaciones.length === 0 ? (
                    <Card className="bg-gray-50 border-dashed">
                        <CardContent className="p-8 text-center text-gray-500">
                            <p>No hay campañas creadas aún.</p>
                            <Button variant="secondary" className="mt-4" onClick={() => setModalOpen(true)}>
                                Crear primera campaña
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    publicaciones.map(pub => (
                        <Card key={pub.id} className={`transition-all ${!pub.activa ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${pub.plataforma === 'facebook' ? 'bg-blue-100 text-blue-600' :
                                            pub.plataforma === 'instagram' ? 'bg-pink-100 text-pink-600' :
                                                'bg-orange-100 text-orange-600'
                                            }`}>
                                            {pub.plataforma === 'facebook' && <Facebook size={20} />}
                                            {pub.plataforma === 'instagram' && <Instagram size={20} />}
                                            {pub.plataforma === 'marketplace' && <Users size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{pub.titulo}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <span>{formatearFecha(pub.fechaPublicacion)}</span>
                                                <span>•</span>
                                                <span className="font-medium text-green-600">
                                                    {formatearMoneda(pub.presupuesto)}/día
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleEstado(pub.id)}
                                            className={pub.activa ? 'text-green-600' : 'text-gray-400'}
                                            title={pub.activa ? 'Pausar' : 'Reanudar'}
                                        >
                                            {pub.activa ? <Pause size={18} /> : <Play size={18} />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeletePublicacion(pub.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats Mini */}
                                {pub.activa && (
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 p-2 rounded">
                                        <div>
                                            <p className="text-gray-500">Alcance</p>
                                            <p className="font-semibold">{pub.alcance || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Clicks</p>
                                            <p className="font-semibold">{pub.interacciones || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Leads</p>
                                            <p className="font-semibold text-telmex-blue">{pub.leadsGenerados || 0}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Calendario de Contenido */}
            <div>
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon size={18} />
                            Calendario {format(hoy, 'MMMM', { locale: es })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                                <div key={d} className="font-bold text-gray-400">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {diasCalendario.map((dia, i) => {
                                const tienePublicacion = publicaciones.some(p =>
                                    isSameDay(new Date(p.fechaPublicacion), dia) && p.activa
                                );
                                return (
                                    <div
                                        key={i}
                                        className={`
                                                aspect-square flex items-center justify-center rounded-md text-xs
                                                ${tienePublicacion ? 'bg-telmex-blue text-white font-bold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                                            `}
                                    >
                                        {format(dia, 'd')}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                            <div className="w-3 h-3 bg-telmex-blue rounded"></div>
                            <span>Días con campaña activa</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Banco de Recursos (Placeholder) */}
                <Card className="mt-6">
                    <CardHeader><CardTitle>Recursos Rápidos</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <a href="#" className="block p-2 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100">
                            🖼️ Kit de Imágenes TELMEX
                        </a>
                        <a href="#" className="block p-2 bg-purple-50 text-purple-700 text-sm rounded hover:bg-purple-100">
                            📝 Copywriting para Ventas
                        </a>
                        <a href="#" className="block p-2 bg-green-50 text-green-700 text-sm rounded hover:bg-green-100">
                            💬 Respuestas de WhatsApp
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Modal Nueva Publicación */}
        <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Nueva Campaña"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Título del Anuncio"
                    placeholder="Ej: Promo Fibra Óptica"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                />

                <Select
                    label="Plataforma"
                    value={plataforma}
                    onChange={(e) => setPlataforma(e.target.value as any)}
                    options={[
                        { value: 'facebook', label: 'Facebook Ads' },
                        { value: 'instagram', label: 'Instagram' },
                        { value: 'marketplace', label: 'Marketplace' },
                    ]}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Presupuesto Diario ($)"
                        type="number"
                        value={presupuesto}
                        onChange={(e) => setPresupuesto(e.target.value)}
                        required
                    />
                    <Input
                        label="Fecha de Inicio"
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary">
                        Crear Campaña
                    </Button>
                </div>
            </form>
        </Modal>
    </div>
);
}
