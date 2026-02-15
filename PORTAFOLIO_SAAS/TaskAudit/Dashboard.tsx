'use client';

import React from 'react';
import {
    ClipboardCheck,
    MapPin,
    Camera,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreVertical,
    History
} from 'lucide-react';

export default function TaskAuditDashboard() {
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            {/* Header Corporativo */}
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100">
                            <ClipboardCheck className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">TaskAudit</h1>
                            <p className="text-slate-500 font-semibold flex items-center gap-2">
                                <MapPin size={14} className="text-indigo-500" />
                                Hotel Grand Plaza - Centro
                            </p>
                        </div>
                    </div>
                    <button className="bg-white border-2 border-slate-200 p-2 rounded-xl text-slate-400 hover:text-slate-600">
                        <MoreVertical size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Auditorías Activas */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                            <History className="text-indigo-500" size={24} />
                            Auditorías del Turno
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: 'Limpieza Lobby', progress: 85, staff: 'M. Robles', status: 'En Proceso' },
                                { title: 'Revisión Área de Alberca', progress: 100, staff: 'J. Smith', status: 'Completado' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`${item.progress === 100 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                            {item.status}
                                        </div>
                                        <span className="text-slate-300 font-bold text-xs">Ayer 15:30</span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mb-1">{item.title}</h3>
                                    <p className="text-slate-400 text-sm font-medium mb-6">Resp: {item.staff}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-black">
                                            <span className="text-slate-400">Progreso</span>
                                            <span className="text-slate-900">{item.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${item.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reporte de Incidencias */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                            <AlertCircle className="text-rose-500" size={24} />
                            Últimas Alertas
                        </h2>
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-3xl bg-rose-50/50 border border-rose-100">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center border border-rose-200 overflow-hidden">
                                        <Camera className="text-rose-300" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800">Falla de Iluminación</h4>
                                        <p className="text-xs text-slate-500 mt-1">H-302 Piso 3</p>
                                        <span className="text-[10px] bg-rose-200 text-rose-700 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">CRÍTICO</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform active:scale-95">
                            Generar Reporte PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
