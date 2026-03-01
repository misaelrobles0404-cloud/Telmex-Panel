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
    ConfigComisiones,
    ClaveUniversal,
    MetaSuperVendedor
} from '@/lib/admin';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Megaphone,
    Key,
    AlertCircle,
    Loader2,
    Users,
    DollarSign,
    Star,
    ListChecks,
    Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SUPER_ADMIN = 'carrillomarjory7@gmail.com';

const DEFAULT_REQUISITOS = [
    'SI O ACEPTO AL MENSAJE DE ALTA',
    'DATOS Y MAPA EN PORTAL',
    'PAQUETE ELEGIDO EN PORTAL',
    'CAPTURA DE FOLIO EN PORTAL',
    'CAPTURA DE FOLIO SIAC EN CHAT-CLIENTE',
    'INE POR AMBOS LADOS DEL CLIENTE',
    'FOTO DE COBERTURA'
];

export default function AdminConfigPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // --- Anuncio ---
    const [announcement, setAnnouncement] = useState<AppAnnouncement>({ text: '', active: false, type: 'info' });
    const [savingAnn, setSavingAnn] = useState(false);

    // --- Perfiles ---
    const [perfiles, setPerfiles] = useState<any[]>([]);
    const [savingPerfiles, setSavingPerfiles] = useState(false);

    // --- Comisiones ---
    const [comisiones, setComisiones] = useState<ConfigComisiones>({ linea_nueva: 300, portabilidad: 300, winback: 300 });
    const [savingComisiones, setSavingComisiones] = useState(false);

    // --- Clave Universal ---
    const [claveUniversal, setClaveUniversal] = useState<ClaveUniversal>({ id_usuario: '10000900', clave_captura: '337595', nombres: ['GUSTAVO', 'ACEVEDO', 'ZAMARRON'] });
    const [savingClave, setSavingClave] = useState(false);
    const [nuevaClaveNombre, setNuevaClaveNombre] = useState('');

    // --- Meta Súper Vendedor ---
    const [metaSuperVendedor, setMetaSuperVendedor] = useState<MetaSuperVendedor>({ ventas_semana: 7 });
    const [savingMeta, setSavingMeta] = useState(false);

    // --- Requisitos ---
    const [requisitos, setRequisitos] = useState<string[]>(DEFAULT_REQUISITOS);
    const [savingRequisitos, setSavingRequisitos] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === SUPER_ADMIN) {
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
        const [annData, perfilesRes, comisionesData, claveUnivData, metaData, reqData] = await Promise.all([
            obtenerConfiguracion<AppAnnouncement>('app_announcement'),
            supabase.from('perfiles').select('*').order('nombre_completo'),
            obtenerConfiguracion<ConfigComisiones>('config_comisiones'),
            obtenerConfiguracion<ClaveUniversal>('clave_universal'),
            obtenerConfiguracion<MetaSuperVendedor>('meta_super_vendedor'),
            obtenerConfiguracion<string[]>('requisitos_venta'),
        ]);

        if (annData) setAnnouncement(annData);
        if (perfilesRes.data) setPerfiles(perfilesRes.data);
        if (comisionesData) setComisiones(comisionesData);
        if (claveUnivData) setClaveUniversal(claveUnivData);
        if (metaData) setMetaSuperVendedor(metaData);
        if (reqData) setRequisitos(reqData);
        setLoading(false);
    };

    // --- Handlers de Guardado ---
    const handleSave = async (key: string, value: any, setSaving: (b: boolean) => void, label: string) => {
        setSaving(true);
        try {
            await guardarConfiguracion(key, value);
            alert(`✅ ${label} actualizado con éxito.`);
        } catch { alert(`❌ Error al guardar ${label}.`); }
        finally { setSaving(false); }
    };

    const handleSavePerfiles = async () => {
        setSavingPerfiles(true);
        try {
            for (const p of perfiles) {
                await supabase.from('perfiles').update({ nombre_completo: p.nombre_completo }).eq('id', p.id);
            }
            alert('✅ Perfiles actualizados correctamente');
        } catch { alert('❌ Error al actualizar perfiles'); }
        finally { setSavingPerfiles(false); }
    };

    // --- Handlers de Requisitos ---
    const actualizarRequisito = (idx: number, valor: string) => { const r = [...requisitos]; r[idx] = valor; setRequisitos(r); };
    const agregarRequisito = () => setRequisitos([...requisitos, '']);
    const eliminarRequisito = (idx: number) => setRequisitos(requisitos.filter((_, i) => i !== idx));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-telmex-blue" size={40} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-3">
                    <ArrowLeft size={18} className="mr-1" /> Volver
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                        <Settings size={28} className="text-telmex-blue" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Configuración del Panel</h1>
                        <p className="text-gray-500 font-medium">Control total de las reglas del sistema</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">

                {/* ========== 1. COMISIONES ========== */}
                <Card className="border-t-4 border-t-green-500 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <DollarSign size={22} className="text-green-500" />
                            Comisiones por Tipo de Venta
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Estos valores se aplican automáticamente en las nóminas.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Línea Nueva ($)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border-2 border-gray-100 rounded-xl text-lg font-black text-gray-900 focus:border-green-400 outline-none"
                                    value={comisiones.linea_nueva}
                                    onChange={(e) => setComisiones({ ...comisiones, linea_nueva: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Portabilidad ($)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border-2 border-gray-100 rounded-xl text-lg font-black text-gray-900 focus:border-green-400 outline-none"
                                    value={comisiones.portabilidad}
                                    onChange={(e) => setComisiones({ ...comisiones, portabilidad: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Winback ($)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border-2 border-gray-100 rounded-xl text-lg font-black text-gray-900 focus:border-green-400 outline-none"
                                    value={comisiones.winback}
                                    onChange={(e) => setComisiones({ ...comisiones, winback: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => handleSave('config_comisiones', comisiones, setSavingComisiones, 'Comisiones')} disabled={savingComisiones} className="bg-green-600 hover:bg-green-700">
                                <Save size={16} className="mr-2" /> {savingComisiones ? 'Guardando...' : 'Guardar Comisiones'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ========== 2. META SÚPER VENDEDOR ========== */}
                <Card className="border-t-4 border-t-yellow-500 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Star size={22} className="text-yellow-500" />
                            Meta de Súper Vendedor
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">El número mínimo de ventas en la semana para recibir el reconocimiento.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-xs">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Instalaciones por Semana</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full p-3 border-2 border-gray-100 rounded-xl text-3xl font-black text-yellow-600 focus:border-yellow-400 outline-none text-center"
                                    value={metaSuperVendedor.ventas_semana}
                                    onChange={(e) => setMetaSuperVendedor({ ventas_semana: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-1">
                                <p className="text-sm text-yellow-700 font-bold">
                                    ⭐ Un promotor que logre <span className="text-2xl font-black">{metaSuperVendedor.ventas_semana}</span> o más instalaciones esta semana aparecerá como Súper Vendedor en el dashboard.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => handleSave('meta_super_vendedor', metaSuperVendedor, setSavingMeta, 'Meta')} disabled={savingMeta} className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                <Save size={16} className="mr-2" /> {savingMeta ? 'Guardando...' : 'Guardar Meta'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ========== 3. CLAVE UNIVERSAL ========== */}
                <Card className="border-t-4 border-t-blue-500 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Key size={22} className="text-blue-500" />
                            Clave Universal de Acceso
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Datos del portal de captura que ven todos los promotores en su dashboard.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">ID de Usuario</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-100 rounded-xl font-mono font-black text-gray-900 text-lg focus:border-blue-400 outline-none"
                                    value={claveUniversal.id_usuario}
                                    onChange={(e) => setClaveUniversal({ ...claveUniversal, id_usuario: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Clave de Captura</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-yellow-200 rounded-xl font-mono font-black text-yellow-700 text-2xl tracking-widest focus:border-yellow-400 outline-none"
                                    value={claveUniversal.clave_captura}
                                    onChange={(e) => setClaveUniversal({ ...claveUniversal, clave_captura: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nombres de Cuenta</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {claveUniversal.nombres.map((nombre, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                                        <span className="font-black text-blue-700 text-sm">{nombre}</span>
                                        <button onClick={() => setClaveUniversal({ ...claveUniversal, nombres: claveUniversal.nombres.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600 ml-1">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border-2 border-gray-100 rounded-xl font-mono uppercase text-sm focus:border-blue-400 outline-none"
                                    placeholder="Agregar nombre (ej: GARCIA)"
                                    value={nuevaClaveNombre}
                                    onChange={(e) => setNuevaClaveNombre(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && nuevaClaveNombre.trim()) {
                                            setClaveUniversal({ ...claveUniversal, nombres: [...claveUniversal.nombres, nuevaClaveNombre.trim()] });
                                            setNuevaClaveNombre('');
                                        }
                                    }}
                                />
                                <Button variant="secondary" onClick={() => {
                                    if (nuevaClaveNombre.trim()) {
                                        setClaveUniversal({ ...claveUniversal, nombres: [...claveUniversal.nombres, nuevaClaveNombre.trim()] });
                                        setNuevaClaveNombre('');
                                    }
                                }}>
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => handleSave('clave_universal', claveUniversal, setSavingClave, 'Clave Universal')} disabled={savingClave} className="bg-blue-600 hover:bg-blue-700">
                                <Save size={16} className="mr-2" /> {savingClave ? 'Guardando...' : 'Guardar Clave Universal'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ========== 4. REQUISITOS DE VENTA ========== */}
                <Card className="border-t-4 border-t-purple-500 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <ListChecks size={22} className="text-purple-500" />
                                Requisitos Obligatorios para Comisionar
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">Aparecen en el formulario de Nuevo Cliente como recordatorio de capturas.</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={agregarRequisito}>
                            <Plus size={16} className="mr-1" /> Agregar
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {requisitos.map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                                <input
                                    type="text"
                                    className="flex-1 p-2 border-2 border-gray-100 rounded-xl text-sm font-medium focus:border-purple-400 outline-none uppercase"
                                    value={req}
                                    onChange={(e) => actualizarRequisito(idx, e.target.value.toUpperCase())}
                                />
                                <button onClick={() => eliminarRequisito(idx)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <div className="flex justify-end pt-2">
                            <Button onClick={() => handleSave('requisitos_venta', requisitos, setSavingRequisitos, 'Requisitos')} disabled={savingRequisitos} className="bg-purple-600 hover:bg-purple-700">
                                <Save size={16} className="mr-2" /> {savingRequisitos ? 'Guardando...' : 'Guardar Requisitos'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ========== 5. BANNER DE ANUNCIOS ========== */}
                <Card className="border-t-4 border-t-indigo-500 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Megaphone size={22} className="text-indigo-500" />
                            Anuncio de la Aplicación (Banner)
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Cuando está activo, aparece en el dashboard de TODOS los promotores.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={announcement.active}
                                    onChange={(e) => setAnnouncement({ ...announcement, active: e.target.checked })}
                                    className="w-5 h-5 rounded text-indigo-600"
                                />
                                <span className="font-bold text-gray-700">Mostrar Banner Ahora</span>
                            </label>
                            {announcement.active && <span className="badge badge-green text-xs animate-pulse">ACTIVO</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Color/Tipo"
                                value={announcement.type}
                                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value as any })}
                                options={[
                                    { value: 'info', label: '🔵 Azul (Informativo)' },
                                    { value: 'warning', label: '🟡 Amarillo (Prevención)' },
                                    { value: 'error', label: '🔴 Rojo (Alerta Urgente)' },
                                    { value: 'success', label: '🟢 Verde (Éxito)' },
                                ]}
                            />
                            <div className="flex flex-col justify-end">
                                <div className={`p-3 rounded-xl border font-medium text-sm ${announcement.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                    announcement.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                        announcement.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                                            'bg-green-50 border-green-200 text-green-700'
                                    }`}>
                                    {announcement.text || 'Vista previa del mensaje aquí...'}
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
                            <Button onClick={() => handleSave('app_announcement', announcement, setSavingAnn, 'Anuncio')} disabled={savingAnn} className="bg-indigo-600 hover:bg-indigo-700">
                                <Save size={16} className="mr-2" /> {savingAnn ? 'Guardando...' : 'Publicar Anuncio'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ========== 7. GESTIÓN DE PERFILES ========== */}
                <Card className="border-t-4 border-t-orange-400 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Users size={22} className="text-orange-400" />
                            Nombres de Promotores
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">El nombre que aparece en el dashboard del Super Boss y en las nóminas.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {perfiles.map((p) => (
                                <div key={p.id} className="p-3 border-2 border-gray-100 rounded-xl bg-gray-50/50 flex flex-col md:flex-row gap-3 items-end">
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                                            <p className="font-medium text-gray-700 text-sm">{p.email}</p>
                                        </div>
                                        <Input
                                            label="Nombre Completo"
                                            value={p.nombre_completo || ''}
                                            onChange={(e) => setPerfiles(perfiles.map(pr => pr.id === p.id ? { ...pr, nombre_completo: e.target.value } : pr))}
                                            placeholder="Nombre del promotor"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={handleSavePerfiles} disabled={savingPerfiles} className="bg-orange-500 hover:bg-orange-600">
                                <Save size={16} className="mr-2" /> {savingPerfiles ? 'Guardando...' : 'Guardar Nombres'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-200">
                    <AlertCircle size={22} className="flex-shrink-0" />
                    <p className="text-sm font-medium">
                        <b>Nota:</b> Todos los cambios se aplican instantáneamente para todos los promotores en sus dashboards y formularios.
                    </p>
                </div>
            </div>
        </div>
    );
}
