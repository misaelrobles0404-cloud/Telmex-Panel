'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { UserCheck } from 'lucide-react';

export function PerfilOnboarding() {
    const [nombre, setNombre] = useState('');
    const [user, setUser] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkPerfil = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) return;
                setUser(authUser);

                // Usamos maybeSingle para que no lance error si no hay resultados
                const { data: perfil, error } = await supabase
                    .from('perfiles')
                    .select('nombre_completo')
                    .eq('id', authUser.id)
                    .maybeSingle();

                if (error) {
                    console.error("Error al verificar perfil:", error);
                    // Si hay error de permiso o tabla, no bloqueamos pero lo registramos
                    return;
                }

                if (!perfil || !perfil.nombre_completo) {
                    setShowModal(true);
                }
            } catch (err) {
                console.error("Fallo crítico en onboarding:", err);
            }
        };
        checkPerfil();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('perfiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    nombre_completo: nombre.trim()
                });

            if (error) throw error;
            setShowModal(false);
            window.location.reload(); // Recargar para asegurar que todos los componentes vean el cambio
        } catch (error) {
            console.error("Error al guardar perfil:", error);
            alert("Error al guardar el nombre. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
            <Card className="w-full max-w-md shadow-2xl border-none animate-in zoom-in-95 duration-300">
                <CardHeader className="bg-telmex-blue text-white rounded-t-xl">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                        <UserCheck size={32} />
                    </div>
                    <CardTitle className="text-2xl">¡Bienvenido a INFINITUM!</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-gray-600">
                        Para llevar un control de tus ventas y comisiones, por favor ingresa tu <strong>nombre completo</strong> como aparecerá en tus reportes.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-semibold text-gray-700">Nombre Completo</label>
                            <input
                                required
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Juan Pérez Martínez"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-telmex-blue focus:border-transparent outline-none transition-all text-lg"
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full h-14 text-lg font-bold shadow-lg"
                            disabled={loading || !nombre.trim()}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Guardando...
                                </div>
                            ) : (
                                "Comenzar ahora"
                            )}
                        </Button>
                    </form>
                    <p className="text-xs text-gray-400">
                        Este nombre será visible para el Administrador del sistema.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
