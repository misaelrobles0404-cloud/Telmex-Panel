'use client';

import React from 'react';
import {
    Waves,
    Timer,
    Car,
    CheckCircle2,
    Plus,
    ArrowRight,
    User,
    Zap
} from 'lucide-react';

export default function WashFlowDashboard() {
    return (
        <div className="min-h-screen bg-sky-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header estilo High-Tech */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-sky-600 p-3 rounded-2xl shadow-xl shadow-sky-200 animate-pulse">
                            <Waves className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">WASHFLOW</h1>
                            <p className="text-sky-600 font-black text-xs uppercase tracking-[0.2em]">Extreme Detailing</p>
                        </div>
                    </div>
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2">
                        <Car size={20} />
                        REGISTRAR VEHÍCULO
                    </button>
                </div>

                {/* Tablero Kanban de Producción */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { tag: 'EN ESPERA', color: 'bg-slate-200 text-slate-600', count: 3 },
                        { tag: 'LAVADO', color: 'bg-blue-200 text-blue-700', count: 2, active: true },
                        { tag: 'DETALLADO', color: 'bg-purple-200 text-purple-700', count: 1 },
                        { tag: 'LISTO', color: 'bg-green-200 text-green-700', count: 4 },
                    ].map((col, i) => (
                        <div key={i} className="flex flex-col gap-4">
                            <div className="flex justify-between items-center px-4">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${col.color}`}>
                                    {col.tag}
                                </span>
                                <span className="text-slate-400 font-black text-sm">{col.count}</span>
                            </div>

                            <div className="space-y-4">
                                {Array.from({ length: col.count }).map((_, j) => (
                                    <div key={j} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-slate-800 text-lg">BMW M3</h4>
                                            <div className="text-[10px] font-bold text-slate-300">#4392</div>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2">
                                            <User size={12} />
                                            C. Martinez
                                        </div>

                                        <div className="flex justify-between items-center py-3 border-t border-slate-50 mt-3">
                                            <div className="flex items-center gap-1 text-slate-900 font-bold text-xs">
                                                <Timer size={14} className="text-sky-500" />
                                                15 min
                                            </div>
                                            <ArrowRight size={18} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Flotante de Acciones Rápidas */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-white px-8 py-4 rounded-full shadow-2xl flex gap-8 items-center">
                    <div className="text-center">
                        <div className="text-blue-600 font-black text-xl">12</div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hoy</div>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-100"></div>
                    <div className="text-center">
                        <div className="text-slate-900 font-black text-xl">$4,250</div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ventas</div>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-100"></div>
                    <button className="flex items-center gap-2 text-indigo-600 font-black text-xs hover:scale-105 transition-transform">
                        <Zap size={16} />
                        EXPRESS
                    </button>
                </div>
            </div>
        </div>
    );
}
