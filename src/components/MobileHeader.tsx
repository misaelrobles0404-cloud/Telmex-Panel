'use client';

import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <header className="lg:hidden bg-telmex-blue text-white h-16 shrink-0 flex items-center justify-between px-4 z-30 shadow-md border-b border-white/10">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-white/20 outline-none"
                    aria-label="Abrir menú"
                >
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold tracking-tight">
                    INFINITUM
                </h1>
            </div>
        </header>
    );
}
