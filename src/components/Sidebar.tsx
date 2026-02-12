'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, MessageSquare, BarChart3, Calculator, Settings, Menu, X, ImageIcon, CheckCircle, MapPin, Megaphone, LogOut, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Plantillas WhatsApp', href: '/plantillas', icon: MessageSquare },
    { name: 'Verificar Comisiones', href: '/comisiones', icon: CheckCircle }, // Nuevo módulo
    { name: 'Campañas', href: '/campanas', icon: Megaphone },
    { name: 'Auditoría', href: '/auditoria', icon: ClipboardCheck },
    { name: 'Calculadora', href: '/calculadora', icon: Calculator },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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

    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
    const [isInstallable, setIsInstallable] = React.useState(false);

    React.useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (pathname === '/login') return null;

    return (
        <>
            {/* Overlay para móviles */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-telmex-darkblue transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full min-h-0">
                    {/* Logo & Close button */}
                    <div className="flex items-center justify-between h-16 flex-shrink-0 px-6 bg-telmex-blue text-white">
                        <h1 className="text-2xl font-bold">
                            TELMEX Panel
                        </h1>
                        <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
                        {navigation.map((item) => {
                            // Restricción para Auditoría
                            if (item.name === 'Auditoría' && user?.email !== 'misaelrobles0404@gmail.com') {
                                return null;
                            }

                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
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

                    {/* Install App Button */}
                    {isInstallable && (
                        <div className="px-3 pb-2">
                            <button
                                onClick={handleInstallClick}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-telmex-blue hover:bg-telmex-blue/80 transition-all duration-200 shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Instalar App
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex-shrink-0 p-4 border-t border-telmex-blue/30 bg-telmex-darkblue">
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
        </>
    );
}
