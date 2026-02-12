'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import {
    obtenerConfiguracion,
    guardarConfiguracion,
    AppAnnouncement,
    ClavePortal
} from '@/lib/admin';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Key,
    AlertCircle,
    Loader2,
    Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminConfigPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [announcement, setAnnouncement] = useState<AppAnnouncement>({
        text: '',
        active: false,
        type: 'info'
    });

    const [claves, setClaves] = useState<ClavePortal[]>([]);
    const [perfiles, setPerfiles] = useState<any[]>([]);
    const [savingPerfiles, setSavingPerfiles] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === 'ruizmosinfinitum2025@gmail.com' || user?.email === 'misaelrobles0404@gmail.com') {
                setIsAdmin(true);
                cargarConfiguraciones();
            } else {
                router.push('/');
            }
        };
        checkAdmin();
    }, []);

    const cargarConfiguraciones = async () => {
        setLoading(true);
        const [annData, clavesData, { data: perfilesData }] = await Promise.all([
            obtenerConfiguracion<AppAnnouncement>('app_announcement'),
            obtenerConfiguracion<ClavePortal[]>('claves_portal'),
            supabase.from('perfiles').select('*').order('nombre_completo')
        ]);

        if (annData) setAnnouncement(annData);
        if (clavesData) setClaves(clavesData);
        if (perfilesData) setPerfiles(perfilesData);
        setLoading(false);
    };

    const handleSaveAnnouncement = async () => {
        setSaving(true);
        try {
            await guardarConfiguracion('app_announcement', announcement);
            alert('Anuncio actualizado con éxito');
        } catch (error) {
            alert('Error al guardar anuncio');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveClaves = async () => {
        setSaving(true);
        try {
            await guardarConfiguracion('claves_portal', claves);
            alert('Claves de portal actualizadas con éxito');
        } catch (error) {
            alert('Error al guardar claves');
        } finally {
            setSaving(false);
        }
    };

    const agregarClave = () => {
        const nueva: ClavePortal = {
            id: Math.random().toString(36).substr(2, 9),
            ciudad: '',
            tienda: '',
            usuario: '',
            nombre: ''
        };
        setClaves([...claves, nueva]);
    };

    const eliminarClave = (id: string) => {
        if (confirm('¿Eliminar esta clave?')) {
            setClaves(claves.filter(c => c.id !== id));
        }
    };

    const actualizarClave = (id: string, campo: keyof ClavePortal, valor: string) => {
        setClaves(claves.map(c => c.id === id ? { ...c, [campo]: valor } : c));
    };

    const actualizarPerfil = (id: string, campo: string, valor: string) => {
        setPerfiles(perfiles.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    };

    const handleSavePerfiles = async () => {
        setSavingPerfiles(true);
        try {
            // Actualizar cada perfil modificado
            for (const perfil of perfiles) {
                await supabase
                    .from('perfiles')
                    .update({ nombre_completo: perfil.nombre_completo })
                    .eq('id', perfil.id);
            }
            alert('Perfiles actualizados correctamente');
        } catch (error) {
            alert('Error al actualizar perfiles');
        } finally {
            setSavingPerfiles(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-telmex-blue" size={40} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                        <ArrowLeft size={18} className="mr-1" /> Volver
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Configuración del Panel</h1>
                    <p className="text-gray-600">Gestión de recursos globales y avisos</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* BANNER DE ANUNCIOS */}
                <Card className="border-t-4 border-t-indigo-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone size={20} className="text-indigo-500" />
                            Anuncio de la Aplicación (Banner)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={announcement.active}
                                    onChange={(e) => setAnnouncement({ ...announcement, active: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600"
                                />
                                <span className="font-medium text-gray-700">Mostrar Banner</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Color/Tipo"
                                value={announcement.type}
                                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value as any })}
                                options={[
                                    { value: 'info', label: 'Azul (Informativo)' },
                                    { value: 'warning', label: 'Amarillo (Prevención)' },
                                    { value: 'error', label: 'Rojo (Alerta)' },
                                    { value: 'success', label: 'Verde (Éxito)' },
                                ]}
                            />
                            <div className="flex flex-col justify-end">
                                <p className="text-xs text-gray-500 mb-1 italic">
                                    Vista previa del estilo seleccionado arriba.
                                </p>
                                <div className={`p-2 rounded border text-xs ${announcement.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                    announcement.type === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                                        announcement.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                                            'bg-green-50 border-green-100 text-green-700'
                                    }`}>
                                    Ejemplo de mensaje
                                </div>
                            </div>
                        </div>

                        <Textarea
                            label="Texto del Anuncio"
                            value={announcement.text}
                            onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                            placeholder="Escribe el mensaje que verán todos los promotores..."
                            rows={3}
                        />

                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveAnnouncement}
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Save size={18} className="mr-2" />
                                {saving ? 'Guardando...' : 'Actualizar Banner'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* CLAVES DE PORTAL */}
                <Card className="border-t-4 border-t-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Key size={20} className="text-blue-500" />
                            Claves de Portal por Ciudad
                        </CardTitle>
                        <Button variant="secondary" size="sm" onClick={agregarClave}>
                            <Plus size={16} className="mr-1" /> Agregar Ciudad
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {claves.length === 0 && (
                                <p className="text-center py-4 text-gray-500 italic">No hay claves configuradas.</p>
                            )}
                            <div className="grid grid-cols-1 gap-4">
                                {claves.map((c, index) => (
                                    <div key={c.id} className="p-4 border rounded-xl bg-gray-50/50 flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
                                            <Input
                                                label="Ciudad"
                                                value={c.ciudad}
                                                onChange={(e) => actualizarClave(c.id, 'ciudad', e.target.value.toUpperCase())}
                                                placeholder="Ej: HERMOSILLO"
                                            />
                                            <Input
                                                label="Tienda"
                                                value={c.tienda}
                                                onChange={(e) => actualizarClave(c.id, 'tienda', e.target.value.toUpperCase())}
                                                placeholder="Ej: HL01"
                                            />
                                            <Input
                                                label="Usuario"
                                                value={c.usuario}
                                                onChange={(e) => actualizarClave(c.id, 'usuario', e.target.value.toUpperCase())}
                                                placeholder="Ej: MX655182"
                                            />
                                            <Input
                                                label="Nombre"
                                                value={c.nombre}
                                                onChange={(e) => actualizarClave(c.id, 'nombre', e.target.value.toUpperCase())}
                                                placeholder="Ej: MISAEL ROBLES"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="text-red-500 hover:bg-red-50 p-2"
                                            onClick={() => eliminarClave(c.id)}
                                        >
                                            <Trash2 size={20} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={handleSaveClaves}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Save size={18} className="mr-2" />
                                {saving ? 'Guardando...' : 'Guardar Claves de Portal'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* GESTIÓN DE PERFILES */}
                <Card className="border-t-4 border-t-green-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users size={20} className="text-green-500" />
                            Gestión de Perfiles de Usuario
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {perfiles.map((p) => (
                                <div key={p.id} className="p-4 border rounded-xl bg-gray-50/50 flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Correo Electrónico</p>
                                            <p className="font-medium text-gray-700">{p.email}</p>
                                        </div>
                                        <Input
                                            label="Nombre Completo"
                                            value={p.nombre_completo || ''}
                                            onChange={(e) => actualizarPerfil(p.id, 'nombre_completo', e.target.value)}
                                            placeholder="Nombre del promotor"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={handleSavePerfiles}
                                disabled={savingPerfiles}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Save size={18} className="mr-2" />
                                {savingPerfiles ? 'Guardando...' : 'Guardar Cambios en Perfiles'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* INFO */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                    <AlertCircle size={24} />
                    <p className="text-sm">
                        <b>Nota:</b> Los cambios realizados aquí se reflejan instantáneamente para todos los promotores en el dashboard y en el formulario de nuevo cliente.
                    </p>
                </div>
            </div>
        </div>
    );
}
