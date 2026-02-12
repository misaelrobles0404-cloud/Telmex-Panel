'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Notificacion {
    id: string;
    cliente: string;
    promotor: string;
    paquete: string;
}

export function InstalacionAlert({
    nuevaInstalacion
}: {
    nuevaInstalacion: { cliente: string; promotor: string; paquete: string } | null
}) {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

    useEffect(() => {
        if (nuevaInstalacion) {
            const id = Math.random().toString(36).substring(7);
            const nueva = { ...nuevaInstalacion, id };
            setNotificaciones(prev => [nueva, ...prev].slice(0, 5)); // Mantener máximo 5

            // Auto-eliminar después de 8 segundos
            setTimeout(() => {
                setNotificaciones(prev => prev.filter(n => n.id !== id));
            }, 8000);

            // Sonido de notificación (opcional, habilitar si se desea)
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.3;
                audio.play();
            } catch (e) {
                console.log('Audio blocked by browser');
            }
        }
    }, [nuevaInstalacion]);

    if (notificaciones.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {notificaciones.map((notif) => (
                <div
                    key={notif.id}
                    className="pointer-events-auto bg-white border-2 border-green-500 rounded-xl shadow-2xl p-4 w-80 animate-in slide-in-from-right-full duration-300 ring-4 ring-green-500/10"
                >
                    <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle2 className="text-green-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="font-black text-green-800 text-sm uppercase tracking-tighter">¡NUEVA INSTALACIÓN!</h4>
                                <button
                                    onClick={() => setNotificaciones(prev => prev.filter(n => n.id !== notif.id))}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-gray-900 font-bold mt-1 text-base">{notif.cliente}</p>
                            <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500">
                                    Promotor: <span className="font-bold text-gray-700">{notif.promotor}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    Paquete: <span className="font-bold text-gray-700">{notif.paquete}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-shrink-width" style={{ animationDuration: '8s' }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
