'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogIn, UserPlus, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-telmex-darkblue p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">TELMEX Panel</h1>
                    <p className="text-blue-200">Ingresa para gestionar tus ventas en la nube</p>
                </div>

                <Card className="border-none shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                            <Lock className="text-telmex-blue" size={24} />
                            Iniciar Sesión
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                                <Input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 border-gray-300 focus:ring-telmex-blue"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 border-gray-300 focus:ring-telmex-blue"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-12 text-lg font-semibold bg-telmex-blue hover:bg-telmex-darkblue"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <LogIn className="mr-2" size={20} />
                                        Entrar al Sistema
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500">
                                ¿No tienes cuenta? Contacta al administrador para habilitar tu acceso y empezar a cobrar tus comisiones.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-blue-300/50 text-xs mt-8">
                    &copy; 2026 Misael Robles - Panel de Ventas Pro
                </p>
            </div>
        </div>
    );
}
