
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Copy, Key, Zap } from 'lucide-react';
import { CLAVES_PORTAL, ClavePortal, obtenerClavePorCiudad } from '@/data/claves';
import { Toast } from '@/components/ui/Toast';

interface ClavesPortalCardProps {
    ciudad?: string; // Si se proporciona, filtra automáticamente
    modo?: 'sidebar' | 'detalle'; // Ajusta el estilo
    claveSeleccionada?: string; // ID del usuario seleccionado
    onSeleccionar?: (usuarioId: string) => void; // Callback al seleccionar
}

export const ClavesPortalCard: React.FC<ClavesPortalCardProps> = ({
    ciudad,
    modo = 'sidebar',
    claveSeleccionada,
    onSeleccionar
}) => {
    const [filtro, setFiltro] = useState('');
    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

    const mostrarToast = (message: string) => {
        setToast({ message, isVisible: true });
    };

    const copiarDual = (e: React.MouseEvent, identificador: string, usuario: string) => {
        e.stopPropagation();
        // El carácter \t (Tab) hace que al pegar el navegador pase al siguiente campo automáticamente
        const texto = `${identificador}\t${usuario}`;
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast('Acceso dual copiado (Usuario + Pass)');
        });
    };

    const clavesFiltradas = useMemo(() => {
        if (ciudad) {
            const match = obtenerClavePorCiudad(ciudad);
            return match ? [match] : []; // Si hay ciudad, solo muestra esa o nada
        }

        if (!filtro) return CLAVES_PORTAL;

        const term = filtro.toUpperCase();
        return CLAVES_PORTAL.filter(c => c.ciudad.includes(term));
    }, [ciudad, filtro]);

    if (ciudad && clavesFiltradas.length === 0) return null; // No mostrar nada si no hay match en detalle

    return (
        <Card className={`h-full ${modo === 'detalle' ? 'bg-indigo-50 border-indigo-200' : ''}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5 text-telmex-blue" />
                    {ciudad ? `Claves para ${clavesFiltradas[0]?.ciudad}` : 'Claves de Acceso Portal'}
                </CardTitle>
                {!ciudad && (
                    <input
                        type="text"
                        placeholder="Buscar ciudad..."
                        className="w-full mt-2 px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-telmex-blue"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                )}
            </CardHeader>
            <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {clavesFiltradas.map((clave) => (
                    <div key={clave.ciudad} className="bg-white p-3 rounded-md shadow-sm border border-gray-100 text-sm">
                        <div className="flex justify-between items-start mb-2 border-b pb-1">
                            <span className="font-bold text-gray-800">{clave.ciudad}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {clave.identificador}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {clave.usuarios.map((u, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2 p-2 rounded-md transition-colors ${onSeleccionar ? 'cursor-pointer hover:bg-blue-50' : ''
                                        } ${claveSeleccionada === u.usuario ? 'bg-blue-100 border border-blue-200' : ''}`}
                                    onClick={() => onSeleccionar && onSeleccionar(u.usuario)}
                                >
                                    {onSeleccionar && (
                                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${claveSeleccionada === u.usuario ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'
                                            }`}>
                                            {claveSeleccionada === u.usuario && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    )}
                                    <div className="flex flex-1 flex-col text-xs">
                                        <span className={`font-mono font-semibold ${claveSeleccionada === u.usuario ? 'text-telmex-blue' : 'text-gray-700'
                                            }`}>{u.usuario}</span>
                                        <span className="text-gray-600 truncate">{u.nombre}</span>
                                    </div>
                                    <button
                                        onClick={(e) => copiarDual(e, clave.identificador, u.usuario)}
                                        className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors border border-orange-100 flex items-center gap-1"
                                        title="Copiar Usuario + Contraseña"
                                    >
                                        <Zap size={14} fill="currentColor" />
                                        <span className="text-[10px] font-bold">PEGADO RÁPIDO</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {clavesFiltradas.length === 0 && !ciudad && (
                    <p className="text-center text-gray-500 text-sm py-4">
                        No se encontraron claves.
                    </p>
                )}
            </CardContent>
            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </Card>
    );
};
