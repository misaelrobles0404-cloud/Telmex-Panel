'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import {
    obtenerConfiguracion,
    guardarConfiguracion
} from '@/lib/admin';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Package,
    Loader2,
    Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Paquete {
    id: string;
    nombre: string;
    precio: number;
    velocidad: number;
    activo: boolean;
    categoria: 'residencial' | 'pyme' | 'solo_internet';
}

export default function AdminCatalogoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [paquetes, setPaquetes] = useState<Paquete[]>([]);
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === 'ruizmosinfinitum2025@gmail.com' || user?.email === 'misaelrobles0404@gmail.com') {
                cargarPaquetes();
            } else {
                router.push('/');
            }
        };
        checkAdmin();
    }, []);

    const cargarPaquetes = async () => {
        setLoading(true);
        const data = await obtenerConfiguracion<Paquete[]>('catalogo_paquetes');
        if (data) {
            setPaquetes(data);
        } else {
            // Inicializar con algunos datos si está vacío
            setPaquetes([
                { id: 'res_60', nombre: '60 Megas + Telefonía', precio: 389, velocidad: 60, activo: true, categoria: 'residencial' },
                { id: 'res_100', nombre: '100 Megas + Telefonía', precio: 499, velocidad: 100, activo: true, categoria: 'residencial' },
            ]);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await guardarConfiguracion('catalogo_paquetes', paquetes);
            alert('Catálogo actualizado con éxito');
        } catch (error) {
            alert('Error al guardar catálogo');
        } finally {
            setSaving(false);
        }
    };

    const agregarPaquete = () => {
        const nuevo: Paquete = {
            id: `pq_${Math.random().toString(36).substr(2, 5)}`,
            nombre: '',
            precio: 0,
            velocidad: 0,
            activo: true,
            categoria: 'residencial'
        };
        setPaquetes([nuevo, ...paquetes]);
    };

    const eliminarPaquete = (id: string) => {
        if (confirm('¿Eliminar este paquete?')) {
            setPaquetes(paquetes.filter(p => p.id !== id));
        }
    };

    const actualizarPaquete = (id: string, campo: keyof Paquete, valor: any) => {
        setPaquetes(paquetes.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    };

    const paquetesFiltrados = paquetes.filter(p =>
        p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        p.id.toLowerCase().includes(filtro.toLowerCase())
    );

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
                    <h1 className="text-3xl font-bold text-gray-900">Catálogo de Paquetes</h1>
                    <p className="text-gray-600">Configura los precios y planes disponibles</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={agregarPaquete} variant="secondary">
                        <Plus size={18} className="mr-1" /> Nuevo Paquete
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-telmex-blue">
                        <Save size={18} className="mr-1" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar paquete por nombre..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-telmex-blue outline-none"
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paquetesFiltrados.map((p) => (
                    <Card key={p.id} className={`${!p.activo ? 'opacity-60 bg-gray-50' : ''}`}>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 space-y-3">
                                    <Input
                                        label="Nombre del Paquete"
                                        value={p.nombre}
                                        onChange={(e) => actualizarPaquete(p.id, 'nombre', e.target.value)}
                                        placeholder="Ej: 60 Megas + Telefonía"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Precio ($)"
                                            type="number"
                                            value={p.precio}
                                            onChange={(e) => actualizarPaquete(p.id, 'precio', parseFloat(e.target.value))}
                                        />
                                        <Input
                                            label="Velocidad (Mbps)"
                                            type="number"
                                            value={p.velocidad}
                                            onChange={(e) => actualizarPaquete(p.id, 'velocidad', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <Select
                                        label="Categoría"
                                        value={p.categoria}
                                        onChange={(e) => actualizarPaquete(p.id, 'categoria', e.target.value)}
                                        options={[
                                            { value: 'residencial', label: 'Residencial' },
                                            { value: 'pyme', label: 'PYME' },
                                            { value: 'solo_internet', label: 'Solo Internet' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={p.activo}
                                        onChange={(e) => actualizarPaquete(p.id, 'activo', e.target.checked)}
                                        className="rounded text-telmex-blue w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Paquete Activo</span>
                                </label>
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:bg-red-50 p-2"
                                    onClick={() => eliminarPaquete(p.id)}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
