'use client';

import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <header className="lg:hidden bg-telmex-blue text-white h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
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
