'use client';

import React from 'react';
import {
    Home,
    TrendingUp,
    Map,
    Briefcase,
    Plus,
    Filter,
    DollarSign,
    PieChart
} from 'lucide-react';

export default function LoteMasterDashboard() {
    return (
        <div className="min-h-screen bg-[#FDFEFE] p-4 md:p-8">
            {/* Navbar Superior */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">LoteMaster</h1>
                    <p className="text-slate-500 font-medium">Panel de Control Inmobiliario</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                        <Plus size={20} />
                        Nueva Venta
                    </button>
                </div>
            </div>

            {/* Grid de Metricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Ventas del Mes', value: '12', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Comisiones Pend.', value: '$45,200', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Lotes Disponibles', value: '158', icon: Home, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Pipeline Valor', value: '$2.4M', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Mapa / Lista de Lotes */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <Map className="text-blue-500" size={24} />
                            Inventario de Proyectos
                        </h2>
                        <button className="p-2 text-slate-400 hover:text-slate-600">
                            <Filter size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={i}
                                className={`
                  aspect-square rounded-3xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer
                  ${i % 3 === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                        i % 5 === 0 ? 'bg-orange-50 border-orange-100 text-orange-700' :
                                            'bg-slate-50 border-slate-100 text-slate-400'}
                `}
                            >
                                <span className="text-xs font-bold uppercase">Lote</span>
                                <span className="text-lg font-black">{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pipeline / Embudo */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <PieChart className="text-indigo-500" size={24} />
                        Embudo de Ventas
                    </h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Prospectos', count: 45, color: 'bg-blue-500' },
                            { label: 'Demostración', count: 12, color: 'bg-indigo-500' },
                            { label: 'Apartados', count: 8, color: 'bg-orange-500' },
                            { label: 'Vendido', count: 6, color: 'bg-emerald-500' },
                        ].map((stage, i) => (
                            <div key={i} className="relative pt-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stage.label}</span>
                                    <span className="text-sm font-black text-slate-900">{stage.count}</span>
                                </div>
                                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100 font-black">
                                    <div
                                        style={{ width: `${(stage.count / 45) * 100}%` }}
                                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${stage.color}`}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
