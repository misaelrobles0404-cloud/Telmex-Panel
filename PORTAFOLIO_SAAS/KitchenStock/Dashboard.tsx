'use client';

import React from 'react';
import {
    Package,
    ShoppingCart,
    AlertTriangle,
    BarChart2,
    Plus,
    ArrowDown,
    ChevronRight,
    Flame
} from 'lucide-react';

export default function KitchenStockDashboard() {
    return (
        <div className="min-h-screen bg-orange-50/30 p-4 md:p-8">
            {/* Header Estilo Foodie */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-2xl shadow-lg shadow-orange-200">
                        <Flame className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">KitchenStock</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cocina en Vivo</p>
                        </div>
                    </div>
                </div>
                <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl">
                    <Plus size={20} />
                    Nuevo Insumo
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Alertas de Stock */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
                        <h2 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <AlertTriangle className="text-orange-500" size={18} />
                            Stock Crítico
                        </h2>
                        <div className="space-y-3">
                            {[
                                { name: 'Pan Brioche', stock: '2 pzas', color: 'text-red-500' },
                                { name: 'Carne Res (kg)', stock: '1.5 kg', color: 'text-red-500' },
                                { name: 'Queso Cheddar', stock: '0.8 kg', color: 'text-orange-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                    <span className={`text-xs font-black ${item.color}`}>{item.stock}</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2 text-xs font-bold text-orange-600 hover:underline">Ver todo el inventario</button>
                    </div>
                </div>

                {/* Ventas y Descuentos en Tiempo Real */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-black text-slate-800 flex items-center gap-2">
                                <ShoppingCart className="text-blue-500" size={20} />
                                Últimos Pedidos
                            </h2>
                            <span className="text-xs font-bold text-slate-400">Hoy: 24 pedidos</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-slate-400 uppercase tracking-widest">
                                        <th className="pb-4">Platillo</th>
                                        <th className="pb-4">Insumos Afectados</th>
                                        <th className="pb-4">Total</th>
                                        <th className="pb-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        { name: 'Double Cheese Burger', stock: '-150g carne', price: '$180' },
                                        { name: 'Classic Fries', stock: '-200g papa', price: '$85' },
                                        { name: 'Coca-Cola 355ml', stock: '-1 pza', price: '$35' },
                                    ].map((order, i) => (
                                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-4 font-bold text-slate-800">{order.name}</td>
                                            <td className="py-4">
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                                    <ArrowDown size={12} />
                                                    {order.stock}
                                                </span>
                                            </td>
                                            <td className="py-4 font-black text-slate-900">{order.price}</td>
                                            <td className="py-4 text-right">
                                                <button className="p-2 text-slate-300 hover:text-slate-600">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Resumen de Costos */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <BarChart2 className="text-orange-500 mb-4" size={24} />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Costo Insumos (Mes)</p>
                            <h3 className="text-3xl font-black mt-1">$12,450</h3>
                            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-bold">
                                <span>+5.2%</span>
                                <span className="text-slate-500 font-medium">vs mes pasado</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16"></div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h2 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-wider">Categorías Top</h2>
                        <div className="space-y-4">
                            {[
                                { name: 'Burgers', pct: 65, color: 'bg-orange-500' },
                                { name: 'Sides', pct: 25, color: 'bg-blue-500' },
                                { name: 'Drinks', pct: 10, color: 'bg-slate-300' },
                            ].map((cat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>{cat.name}</span>
                                        <span>{cat.pct}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`${cat.color} h-full`} style={{ width: `${cat.pct}%` }}></div>
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
