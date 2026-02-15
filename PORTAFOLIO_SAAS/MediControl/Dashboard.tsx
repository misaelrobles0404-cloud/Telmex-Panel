'use client';

import React from 'react';
import {
    Calendar,
    Users,
    Clock,
    Search,
    Plus,
    ChevronRight,
    ClipboardList,
    AlertCircle
} from 'lucide-react';

export default function MediControlDashboard() {
    const [activeTab, setActiveTab] = React.useState('citas');

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">MediControl</h1>
                    <p className="text-slate-500">Bienvenido, Dr. Robles</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all">
                        <Plus size={20} />
                        Nueva Cita
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Principal - Próximas Citas */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="text-blue-500" size={18} />
                                Agenda de Hoy
                            </h2>
                            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                4 Pendientes
                            </span>
                        </div>

                        <div className="divide-y divide-slate-50">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                                P{i}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Paciente Ejemplo {i}</h3>
                                                <p className="text-sm text-slate-500">Consulción General - 4:00 PM</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Buscador de Pacientes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users className="text-indigo-500" size={18} />
                            Buscar Expediente
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Nombre del paciente..."
                                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar de Acciones Rápidas */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
                        <h3 className="text-lg font-bold mb-2">Recordatorios</h3>
                        <p className="text-blue-100 text-sm mb-4">Tienes 2 pacientes que no han confirmado su cita para mañana.</p>
                        <button className="w-full bg-white text-blue-700 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-50 transition-colors">
                            Enviar confirmación (WhatsApp)
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Estadísticas del Mes</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Consultas realizadas</span>
                                <span className="font-bold text-slate-900">42</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Nuevos pacientes</span>
                                <span className="font-bold text-green-600">+12</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Eficiencia de citas</span>
                                <span className="font-bold text-blue-600">92%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
