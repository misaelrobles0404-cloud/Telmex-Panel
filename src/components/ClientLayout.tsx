'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { FacebookPixelWrapper } from '@/components/FacebookPixelWrapper';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className={`flex-1 overflow-y-auto w-full bg-gray-50 ${!isLoginPage ? 'lg:ml-64' : ''}`}>
                {children}
            </main>
            <FacebookPixelWrapper />
        </div>
    );
}
