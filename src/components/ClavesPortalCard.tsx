
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Key } from 'lucide-react';
import { CLAVES_PORTAL, ClavePortal, obtenerClavePorCiudad } from '@/data/claves';

interface ClavesPortalCardProps {
    ciudad?: string; // Si se proporciona, filtra automáticamente
    modo?: 'sidebar' | 'detalle'; // Ajusta el estilo
}

export const ClavesPortalCard: React.FC<ClavesPortalCardProps> = ({ ciudad, modo = 'sidebar' }) => {
    const [filtro, setFiltro] = useState('');

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
                                <div key={idx} className="flex flex-col text-xs">
                                    <span className="font-mono text-telmex-blue font-semibold">{u.usuario}</span>
                                    <span className="text-gray-600 truncate">{u.nombre}</span>
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
        </Card>
    );
};
