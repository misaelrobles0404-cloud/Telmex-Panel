'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type NotifyType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotifyType;
}

interface NotifyContextValue {
    notify: (message: string, type?: NotifyType) => void;
}

const NotifyContext = createContext<NotifyContextValue>({ notify: () => { } });

export function useNotify() {
    return useContext(NotifyContext);
}

const icons: Record<NotifyType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};

const colors: Record<NotifyType, string> = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-600',
};

function detectType(msg: string): NotifyType {
    const lower = msg.toLowerCase();
    if (lower.includes('error') || lower.includes('❌') || lower.includes('fail')) return 'error';
    if (lower.includes('✅') || lower.includes('éxito') || lower.includes('guardado') || lower.includes('copiado') || lower.includes('correctamente') || lower.includes('recibido') || lower.includes('liberada')) return 'success';
    if (lower.includes('⚠️') || lower.includes('advertencia') || lower.includes('pendiente') || lower.includes('faltante')) return 'warning';
    return 'info';
}

export function NotifyProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = useCallback((message: string, type?: NotifyType) => {
        const id = Math.random().toString(36).slice(2);
        const resolvedType = type ?? detectType(message);
        setNotifications(prev => [...prev, { id, message, type: resolvedType }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    // Override window.alert globally so all existing alert() calls use this system
    useEffect(() => {
        const original = window.alert;
        window.alert = (msg: string) => notify(String(msg));
        return () => { window.alert = original; };
    }, [notify]);

    return (
        <NotifyContext.Provider value={{ notify }}>
            {children}

            {/* Toast container — top-center, above everything */}
            <div
                aria-live="polite"
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
            >
                {notifications.map(n => (
                    <div
                        key={n.id}
                        className={`${colors[n.type]} text-white rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 pointer-events-auto animate-slide-in`}
                        style={{ animation: 'slideIn 0.25s ease' }}
                    >
                        <span className="text-lg shrink-0 mt-0.5">{icons[n.type]}</span>
                        <p className="text-sm font-semibold leading-snug flex-1">{n.message}</p>
                        <button
                            onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                            className="text-white/70 hover:text-white ml-1 shrink-0 text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-16px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </NotifyContext.Provider>
    );
}
