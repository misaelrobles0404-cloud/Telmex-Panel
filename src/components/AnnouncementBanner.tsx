'use client';

import React, { useEffect, useState } from 'react';
import { obtenerAnuncio, AppAnnouncement } from '@/lib/admin';
import { AlertCircle, Info, CheckCircle, XCircle, X } from 'lucide-react';

export function AnnouncementBanner() {
    const [announcement, setAnnouncement] = useState<AppAnnouncement | null>(null);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            const data = await obtenerAnuncio();
            if (data && data.active) {
                setAnnouncement(data);
            }
        };
        fetchAnnouncement();
    }, []);

    if (!announcement || !visible) return null;

    const styles = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-green-50 border-green-200 text-green-800',
    };

    const icons = {
        info: <Info className="h-5 w-5 text-blue-400" />,
        warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
        error: <XCircle className="h-5 w-5 text-red-400" />,
        success: <CheckCircle className="h-5 w-5 text-green-400" />,
    };

    return (
        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-4 ${styles[announcement.type]}`}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[announcement.type]}
            </div>
            <div className="flex-grow">
                <p className="text-sm font-medium">
                    {announcement.text}
                </p>
            </div>
            <button
                onClick={() => setVisible(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar aviso"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
