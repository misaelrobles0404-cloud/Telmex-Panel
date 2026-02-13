
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Copy, Key, User, Lock, Monitor, Globe } from 'lucide-react';
import { CLAVES_PORTAL, ClavePortal, obtenerClavePorCiudad } from '@/data/claves';
import { Toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { PortalKeyUsage, PerfilUsuario } from '@/types';

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
    bloqueado?: boolean; // Bloquea el cambio de clave si ya hay Folio SIAC
}

export const ClavesPortalCard: React.FC<ClavesPortalCardProps> = ({
    ciudad,
    modo = 'sidebar',
    claveSeleccionada,
    onSeleccionar,
    bloqueado = false
}) => {
    const [filtro, setFiltro] = useState('');
    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
    const [usage, setUsage] = useState<Record<string, PortalKeyUsage>>({});
    const [currentUser, setCurrentUser] = useState<PerfilUsuario | null>(null);
    const [allProfiles, setAllProfiles] = useState<PerfilUsuario[]>([]);

    useEffect(() => {
        // 1. Obtener usuario actual y perfiles
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('perfiles').select('*').eq('id', user.id).maybeSingle();
                if (profile) {
                    setCurrentUser(profile);
                } else {
                    // Fallback si el perfil no existe todavía
                    setCurrentUser({
                        id: user.id,
                        email: user.email || '',
                        nombre_completo: user.email?.split('@')[0] || 'Usuario'
                    } as any);
                }
            }

            const { data: profiles } = await supabase.from('perfiles').select('*');
            if (profiles) setAllProfiles(profiles);

            // 2. Cargar estado inicial de uso
            const { data: usageData } = await supabase.from('portal_keys_usage').select('*');
            if (usageData) {
                const usageMap = usageData.reduce((acc, curr) => ({ ...acc, [curr.key_id]: curr }), {});
                setUsage(usageMap);
            }
        };

        init();

        // 3. Suscribirse a cambios Realtime
        const channel = supabase
            .channel('portal_keys_usage_changes')
            .on('postgres_changes', { event: '*', table: 'portal_keys_usage', schema: 'public' }, (payload) => {
                if (payload.new) {
                    const newUsage = payload.new as PortalKeyUsage;
                    setUsage(prev => ({ ...prev, [newUsage.key_id]: newUsage }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const mostrarToast = (message: string) => {
        setToast({ message, isVisible: true });
    };

    const toggleUso = async (keyId: string, tipo: 'siac' | 'portal') => {
        if (!currentUser) {
            mostrarToast('Cargando sesión...');
            return;
        }

        const currentUsage = usage[keyId];
        const fieldName = tipo === 'siac' ? 'siac_user_id' : 'portal_user_id';
        const isOccupiedByMe = currentUsage?.[fieldName] === currentUser.id;
        const isOccupiedByOther = currentUsage?.[fieldName] && currentUsage?.[fieldName] !== currentUser.id;

        if (isOccupiedByOther) {
            mostrarToast('Esta clave ya está ocupada por un compañero');
            return;
        }

        const newValue = isOccupiedByMe ? null : currentUser.id;
        const updateData = {
            key_id: keyId,
            [fieldName]: newValue,
            [`${tipo}_updated_at`]: new Date().toISOString()
        };

        const { error } = await supabase.from('portal_keys_usage').upsert(updateData);
        if (error) {
            console.error('Error updating key usage:', error);
            mostrarToast('Error al actualizar estado');
        } else {
            mostrarToast(newValue ? `Marcada como USO EN ${tipo.toUpperCase()}` : `Clave liberada en ${tipo.toUpperCase()}`);
        }
    };

    const copiarAlPortapapeles = (e: React.MouseEvent, texto: string, label: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast(`${label} copiado`);
        });
    };

    const clavesFiltradas = useMemo(() => {
        let listado = CLAVES_PORTAL;

        if (ciudad) {
            const match = obtenerClavePorCiudad(ciudad);
            listado = match ? [match] : [];
        } else if (filtro) {
            const term = filtro.toUpperCase();
            listado = CLAVES_PORTAL.filter(c => c.ciudad.includes(term));
        }

        // Si está bloqueado y hay una clave seleccionada, solo mostrar esa clave
        if (bloqueado && claveSeleccionada) {
            return listado.map(c => ({
                ...c,
                usuarios: c.usuarios.filter(u => u.usuario === claveSeleccionada)
            })).filter(c => c.usuarios.length > 0);
        }

        return listado;
    }, [ciudad, filtro, bloqueado, claveSeleccionada]);

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
                {bloqueado && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <Lock size={12} />
                        Clave vinculada al Folio SIAC
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {clavesFiltradas.map((clave) => (
                    <div key={clave.ciudad} className="bg-white p-3 rounded-md shadow-sm border border-gray-100 text-sm">
                        <div className="flex justify-between items-start mb-2 border-b pb-1">
                            <span className="font-bold text-gray-800 uppercase tracking-tighter">{clave.ciudad}</span>
                            <span
                                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors flex items-center gap-1 shadow-sm"
                                onClick={(e) => copiarAlPortapapeles(e, clave.identificador, 'Usuario')}
                                title="Click para copiar Usuario"
                            >
                                <User size={10} className="text-blue-500" />
                                {clave.identificador}
                                <Copy size={10} className="opacity-50" />
                            </span>
                        </div>
                        <div className="space-y-2">
                            {clave.usuarios.map((u, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2 p-2 rounded-md transition-colors ${onSeleccionar && !bloqueado ? 'cursor-pointer hover:bg-blue-50' : ''
                                        } ${claveSeleccionada === u.usuario ? 'bg-blue-100 border border-blue-200' : ''} ${bloqueado && claveSeleccionada !== u.usuario ? 'opacity-50 grayscale' : ''}`}
                                    onClick={() => onSeleccionar && !bloqueado && onSeleccionar(u.usuario)}
                                >
                                    {onSeleccionar && (
                                        <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${claveSeleccionada === u.usuario ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'
                                            }`}>
                                            {claveSeleccionada === u.usuario && (
                                                bloqueado ? <Lock size={8} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {(() => {
                                                const d = dividirNombre(u.nombre);
                                                return (
                                                    <>
                                                        <span
                                                            className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-md hover:bg-telmex-blue hover:text-white cursor-pointer transition-colors text-[10px] font-bold border border-gray-100 uppercase tracking-tight"
                                                            onClick={(e) => copiarAlPortapapeles(e, d.nombres, 'Nombre')}
                                                            title="Clic para copiar Nombre"
                                                        >
                                                            {d.nombres}
                                                        </span>
                                                        <span
                                                            className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-md hover:bg-telmex-blue hover:text-white cursor-pointer transition-colors text-[10px] font-bold border border-gray-100 uppercase tracking-tight"
                                                            onClick={(e) => copiarAlPortapapeles(e, d.apellido1, '1er Apellido')}
                                                            title="Clic para copiar 1er Apellido"
                                                        >
                                                            {d.apellido1}
                                                        </span>
                                                        {d.apellido2 && (
                                                            <span
                                                                className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-md hover:bg-telmex-blue hover:text-white cursor-pointer transition-colors text-[10px] font-bold border border-gray-100 uppercase tracking-tight"
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

                                        <div className="flex flex-col items-center gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 mt-1 w-full">
                                            {claveSeleccionada === u.usuario && (
                                                <div className="flex items-center w-full justify-center">
                                                    {(() => {
                                                        const keyId = `${clave.identificador}-${u.usuario}`;
                                                        const keyUsage = usage[keyId];

                                                        const getStatusStyles = () => {
                                                            const userId = keyUsage?.portal_user_id;
                                                            if (!userId) return 'bg-white text-gray-500 border-gray-200 hover:border-telmex-blue hover:shadow-md shadow-sm';
                                                            if (userId === currentUser?.id) return 'bg-green-600 text-white border-green-700 shadow-sm shadow-green-200 ring-2 ring-green-100';
                                                            return 'bg-red-600 text-white border-red-700 shadow-sm shadow-red-200 ring-2 ring-red-100';
                                                        };

                                                        const getUserName = () => {
                                                            const userId = keyUsage?.portal_user_id;
                                                            if (!userId) return null;
                                                            if (userId === currentUser?.id) return 'TÚ';
                                                            const p = allProfiles.find(p => p.id === userId);
                                                            return p ? p.nombre_completo.split(' ')[0].toUpperCase() : 'OTRO';
                                                        };

                                                        return (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleUso(keyId, 'portal'); }}
                                                                className={`w-full max-w-[220px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border text-[11px] font-black transition-all ${getStatusStyles()}`}
                                                                title={getUserName() ? `Ocupado por ${getUserName()}` : "Marcar como EN USO en PORTAL"}
                                                            >
                                                                <Globe size={14} />
                                                                {getUserName() ? `PORTAL EN USO: ${getUserName()}` : 'MARCAR USO PORTAL'}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {(() => {
                                                const keyId = `${clave.identificador}-${u.usuario}`;
                                                const keyUsage = usage[keyId];
                                                const isLocked = keyUsage?.portal_user_id && keyUsage?.portal_user_id !== currentUser?.id;

                                                return (
                                                    <button
                                                        onClick={(e) => !isLocked && copiarAlPortapapeles(e, u.usuario, 'Contraseña')}
                                                        disabled={!!isLocked}
                                                        className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl border transition-all text-[14px] font-black group/btn shadow-md w-full max-w-[220px] ${isLocked
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:scale-105 active:scale-95'
                                                            }`}
                                                        title={isLocked ? "Clave bloqueada por otro usuario" : "Copiar Contraseña"}
                                                    >
                                                        {isLocked ? <Lock size={14} className="text-gray-400" /> : <Lock size={14} className="text-orange-500" />}
                                                        <span className="font-mono tracking-widest">{isLocked ? '(BLOQUEADA)' : u.usuario}</span>
                                                        {!isLocked && <Copy size={12} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                                                    </button>
                                                );
                                            })()}
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
