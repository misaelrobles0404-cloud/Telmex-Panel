'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { FacebookPixelWrapper } from '@/components/FacebookPixelWrapper';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    // Cerrar el sidebar automáticamente cuando cambia la ruta (solo para móviles)
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {!isLoginPage && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {!isLoginPage && (
                    <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
                )}

                <main className={`flex-1 overflow-y-auto w-full ${!isLoginPage ? '' : ''}`}>
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            <FacebookPixelWrapper />
        </div>
    );
}
