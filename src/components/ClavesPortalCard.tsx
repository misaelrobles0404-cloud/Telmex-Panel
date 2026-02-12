
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Copy, Key, User, Lock, ExternalLink } from 'lucide-react';
import { CLAVES_PORTAL, ClavePortal, obtenerClavePorCiudad } from '@/data/claves';
import { Toast } from '@/components/ui/Toast';

// Función para dividir nombres según formato mexicano estándar
const dividirNombre = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 0) return { nombres: '', apellido1: '', apellido2: '' };
    if (partes.length === 1) return { nombres: partes[0], apellido1: '', apellido2: '' };
    if (partes.length === 2) return { nombres: partes[0], apellido1: partes[1], apellido2: '' };

    const apellido2 = partes.pop() || '';
    const apellido1 = partes.pop() || '';
    const nombres = partes.join(' ');

    return { nombres, apellido1, apellido2 };
};

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

    const copiarAlPortapapeles = (e: React.MouseEvent, texto: string, label: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast(`${label} copiado`);
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
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                            {(() => {
                                                const d = dividirNombre(u.nombre);
                                                return (
                                                    <>
                                                        <span
                                                            className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-md hover:bg-telmex-blue hover:text-white cursor-pointer transition-colors text-[10px] font-black border border-gray-100 uppercase tracking-tight"
                                                            onClick={(e) => copiarAlPortapapeles(e, d.nombres, 'Nombre')}
                                                            title="Clic para copiar Nombre"
                                                        >
                                                            {d.nombres}
                                                        </span>
                                                        <span
                                                            className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-md hover:bg-telmex-blue hover:text-white cursor-pointer transition-colors text-[10px] font-black border border-gray-100 uppercase tracking-tight"
                                                            onClick={(e) => copiarAlPortapapeles(e, d.apellido1, '1er Apellido')}
                                                            title="Clic para copiar 1er Apellido"
                                                        >
                                                            {d.apellido1}
                                                        </span>
                                                        {d.apellido2 && (
                                                            <span
                                                                className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-md hover:bg-telmex-blue hover:text-white cursor-pointer transition-colors text-[10px] font-black border border-gray-100 uppercase tracking-tight"
                                                                onClick={(e) => copiarAlPortapapeles(e, d.apellido2, '2do Apellido')}
                                                                title="Clic para copiar 2do Apellido"
                                                            >
                                                                {d.apellido2}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => copiarAlPortapapeles(e, clave.identificador, 'Usuario')}
                                                className="flex-1 flex items-center justify-between px-2.5 py-2 bg-blue-50 text-blue-700 rounded-lg border-2 border-blue-100 hover:border-blue-300 transition-all text-[11px] group/btn shadow-sm"
                                                title="Copiar Usuario"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <User size={12} className="text-blue-500" />
                                                    <span className="font-mono font-black truncate">{clave.identificador}</span>
                                                </div>
                                                <Copy size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            </button>
                                            <button
                                                onClick={(e) => copiarAlPortapapeles(e, u.usuario, 'Contraseña')}
                                                className="flex-1 flex items-center justify-between px-2.5 py-2 bg-orange-50 text-orange-700 rounded-lg border-2 border-orange-100 hover:border-orange-300 transition-all text-[11px] group/btn shadow-sm"
                                                title="Copiar Contraseña"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Lock size={12} className="text-orange-500" />
                                                    <span className="font-mono font-black truncate">{u.usuario}</span>
                                                </div>
                                                <Copy size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                    </div>
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
