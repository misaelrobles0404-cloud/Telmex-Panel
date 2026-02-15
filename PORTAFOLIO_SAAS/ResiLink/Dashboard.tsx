'use client';

import React from 'react';
import {
    Building2,
    Megaphone,
    Wallet,
    ShieldCheck,
    Plus,
    Clock,
    FileText,
    UserCheck
} from 'lucide-react';

export default function ResiLinkDashboard() {
    return (
        <div className="min-h-screen bg-emerald-50/20 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Elegante / Residencial */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 p-3 rounded-[1.5rem] shadow-xl shadow-emerald-200">
                            <Building2 className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">ResiLink</h1>
                            <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Colinas del Sol Residencial</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2">
                            <Megaphone size={18} />
                            Publicar Aviso
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna de Finanzas */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                                <Wallet className="text-emerald-500" size={20} />
                                Estado de Caja
                            </h2>
                            <div className="space-y-2">
                                <h3 className="text-4xl font-black text-slate-900">$124,500</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recaudado este mes</p>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Pagado</p>
                                    <p className="text-lg font-black text-emerald-700">85%</p>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Mora</p>
                                    <p className="text-lg font-black text-rose-700">15%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                                <ShieldCheck className="text-blue-500" size={20} />
                                Seguridad / Accesos
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { user: 'Visitante H-42', time: 'hace 5 min', icon: UserCheck },
                                    { user: 'Proveedor Agua', time: 'hace 20 min', icon: Clock },
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="bg-slate-50 p-2 rounded-xl">
                                            <log.icon className="text-slate-400" size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{log.user}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Validaciones de Pagos Pendientes */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                            <FileText className="text-emerald-500" size={24} />
                            Validar Comprobantes (3)
                        </h2>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-6 w-full">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-slate-400 text-xs">
                                            IMG
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-slate-900">Familia Gonzalez - Casa 104</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">Cuota Feb 2026 • $850.00</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button className="flex-1 md:flex-none px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-colors">
                                            APROBAR
                                        </button>
                                        <button className="flex-1 md:flex-none px-6 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-xs hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                            RECHAZAR
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
