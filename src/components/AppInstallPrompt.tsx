'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { Button } from './ui/Button';

export function AppInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [platform, setPlatform] = useState<'android' | 'ios' | 'other' | null>(null);

    useEffect(() => {
        // Verificar si ya se descartó el prompt en esta sesión
        const isDismissed = localStorage.getItem('pwa-install-dismissed');
        if (isDismissed) return;

        // Detectar iOS
        const ua = window.navigator.userAgent;
        const ios = !!ua.match(/iPad|iPhone|iPod/) && !(window as any).MSStream;
        setIsIOS(ios);

        if (ios) {
            setPlatform('ios');
            // En iOS, verificar si ya está en modo "standalone" (instalada)
            const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
                // Mostrar después de un pequeño delay para no ser intrusivo
                const timer = setTimeout(() => setShowPrompt(true), 3000);
                return () => clearTimeout(timer);
            }
        } else {
            // Detectar Android u otros
            const handleBeforeInstallPrompt = (e: any) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setPlatform(ua.toLowerCase().includes('android') ? 'android' : 'other');

                // Mostrar después de un pequeño delay
                const timer = setTimeout(() => setShowPrompt(true), 3000);
                return () => clearTimeout(timer);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            // También verificar si ya está instalada en navegadores modernos
            window.addEventListener('appinstalled', () => {
                setShowPrompt(false);
                setDeferredPrompt(null);
            });

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const dismissPrompt = () => {
        setShowPrompt(false);
        // Guardar en localStorage para no volver a molestar en un tiempo (ej: 7 días)
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:max-w-sm animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
                <div className="p-4 flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-telmex-blue rounded-xl flex items-center justify-center text-white shadow-inner">
                        <Download size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">Instalar INFINITUM</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-tight">
                            {platform === 'ios'
                                ? 'Agrégala a tu pantalla de inicio para un acceso más rápido.'
                                : 'Accede al panel sin usar el navegador y ahorra datos.'}
                        </p>
                    </div>
                    <button
                        onClick={dismissPrompt}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-4 pb-4">
                    {platform === 'ios' ? (
                        <div className="bg-blue-50 rounded-xl p-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-blue-800">
                                <span className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full">1</span>
                                Toca el botón de <Share size={14} className="mx-1" /> "Compartir" abajo.
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-blue-800">
                                <span className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full">2</span>
                                Selecciona <PlusSquare size={14} className="mx-1" /> "Agregar a Inicio".
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={handleInstallClick}
                            className="w-full bg-telmex-blue hover:bg-telmex-darkblue text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all border-none"
                        >
                            ¡Instalar ahora!
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
