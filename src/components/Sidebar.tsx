'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, MessageSquare, BarChart3, Calculator, Settings, Menu, X, ImageIcon, CheckCircle, MapPin, Megaphone, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Plantillas WhatsApp', href: '/plantillas', icon: MessageSquare },
    { name: 'Verificar Comisiones', href: '/comisiones', icon: CheckCircle }, // Nuevo módulo
    { name: 'Campañas', href: '/campanas', icon: Megaphone },
    { name: 'Calculadora', href: '/calculadora', icon: Calculator },
    { name: 'Cobertura', href: '/cobertura', icon: MapPin },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getSession();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (pathname === '/login') return null;

    return (
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-telmex-darkblue">
            <div className="flex flex-col flex-1 min-h-0">
                {/* Logo */}
                <div className="flex items-center h-16 flex-shrink-0 px-6 bg-telmex-blue">
                    <h1 className="text-2xl font-bold text-white">
                        TELMEX Panel
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-telmex-blue text-white shadow-lg'
                                        : 'text-gray-300 hover:bg-telmex-blue/50 hover:text-white'
                                    }
                `}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-telmex-blue/30">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                        <div className="w-8 h-8 rounded-full bg-telmex-blue flex items-center justify-center text-white font-semibold">
                            U
                        </div>
                        <div>
                            <p className="font-medium text-white truncate max-w-[140px]">{user?.email?.split('@')[0] || 'Usuario'}</p>
                            <p className="text-xs text-blue-200">{user?.email || 'Agente TELMEX'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 flex items-center gap-2 text-xs text-red-300 hover:text-red-100 transition-colors w-full"
                    >
                        <LogOut size={14} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
