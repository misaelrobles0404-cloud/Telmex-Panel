'use client';

import React from 'react';
import {
    Dumbbell,
    Users,
    CreditCard,
    Calendar,
    CheckCircle2,
    XCircle,
    Zap,
    Search,
    ChevronRight
} from 'lucide-react';

export default function GymPulseDashboard() {
    const [search, setSearch] = React.useState('');

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-white">
            <div className="max-w-6xl mx-auto">
                {/* Header - Diseño Dark Mode Premium */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-400 p-3 rounded-2xl rotate-3 shadow-2xl shadow-yellow-400/20">
                            <Dumbbell className="text-black" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic">GYMPULSE</h1>
                            <p className="text-yellow-400 font-bold text-xs tracking-[0.3em]">REDEFINE LIMITS</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Escanear ID o buscar miembro..."
                            className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-yellow-400 outline-none transition-all placeholder:text-slate-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status de Acceso (Semáforo) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <h2 className="text-xl font-black flex items-center gap-3">
                            <Users className="text-yellow-400" size={24} />
                            Últimos Check-ins
                        </h2>

                        <div className="space-y-4">
                            {[
                                { name: 'Ricardo Alarcon', plan: 'Anual', status: 'valid', expires: '12 Oct 2026' },
                                { name: 'Carla Mendez', plan: 'Mensual', status: 'expired', expires: '01 Feb 2026' },
                                { name: 'David Jones', plan: 'Visita', status: 'valid', expires: 'Hoy' },
                            ].map((member, i) => (
                                <div key={i} className="bg-slate-800/40 p-5 rounded-3xl flex items-center justify-between border border-slate-700/30 group hover:bg-slate-800/80 transition-all cursor-pointer">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-3 h-3 rounded-full animate-pulse ${member.status === 'valid' ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
                                        <div>
                                            <h4 className="font-black text-lg">{member.name}</h4>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{member.plan}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Vence</p>
                                            <p className={`font-bold text-sm ${member.status === 'valid' ? 'text-white' : 'text-red-500'}`}>{member.expires}</p>
                                        </div>
                                        {member.status === 'valid' ? (
                                            <CheckCircle2 className="text-green-500" size={28} />
                                        ) : (
                                            <XCircle className="text-red-500" size={28} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Estadísticas Rápidas */}
                    <div className="space-y-6">
                        <div className="bg-yellow-400 p-8 rounded-[3rem] text-black shadow-2xl shadow-yellow-400/10 relative overflow-hidden">
                            <Zap className="absolute -right-4 -bottom-4 text-black/5" size={120} />
                            <p className="font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-60">Activos Hoy</p>
                            <h3 className="text-5xl font-black tracking-tighter">142</h3>
                            <div className="mt-8 flex justify-between items-center border-t border-black/10 pt-4">
                                <span className="text-xs font-bold">Capacidad 65%</span>
                                <ChevronRight size={20} />
                            </div>
                        </div>

                        <div className="bg-slate-800/40 p-8 rounded-[3rem] border border-slate-700/30">
                            <h4 className="text-sm font-black mb-6 flex items-center gap-2">
                                <CreditCard className="text-yellow-400" size={18} />
                                Ingresos Estimados
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Semana Actual</p>
                                    <p className="text-xl font-black">$8,400</p>
                                </div>
                                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="bg-yellow-400 h-full w-[80%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
