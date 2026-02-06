'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Cliente, TipoServicio, TipoCliente, REQUISITOS_SERVICIO } from '@/types';
import { guardarCliente, obtenerCliente } from '@/lib/storage';
import { calcularComision } from '@/lib/utils';
import { PAQUETES_RESIDENCIALES, PAQUETES_PYME, obtenerPaquetesPorTipo } from '@/data/paquetes';
import { ArrowLeft, Save, Building2, Home as HomeIcon } from 'lucide-react';

export default function EditarClientePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tipoServicio, setTipoServicio] = useState<TipoServicio>('linea_nueva');

    // Estado inicial vacío, se llenará con useEffect
    const [formData, setFormData] = useState({
        // Información básica
        nombre: '',
        noTT: '',
        noRef: '',
        correo: '',

        // Dirección
        calle: '',
        colonia: '',
        cp: '',
        cd: '',
        estado: '',
        entreCalle1: '',
        entreCalle2: '',

        // Documentación
        ine: '',
        curp: '',
        usuario: '',

        // Tipo de cliente y paquete
        tipoCliente: 'residencial' as TipoCliente,
        paqueteId: '',

        // Clasificación de servicio
        tieneInternet: false,
        tieneTelefonoFijo: false,
        proveedorActual: '',

        // Portabilidad
        numeroAPortar: '',
        nipPortabilidad: '',
        fechaVigencia: '',
        formatoPortabilidad: false,
        cartaBaja: false,

        // Winback
        estadoCuentaMegacable: false,

        // Notas
        notas: '',

        // SIAC
        folioSiac: '',
    });

    const [clienteId, setClienteId] = useState('');
    const [fechaCreacion, setFechaCreacion] = useState('');
    const [estadoPipeline, setEstadoPipeline] = useState('');
    const [archivoActividades, setArchivoActividades] = useState<any[]>([]);
    const [archivoDocumentos, setArchivoDocumentos] = useState<any[]>([]);

    useEffect(() => {
        const cliente = obtenerCliente(params.id);
        if (cliente) {
            setClienteId(cliente.id);
            setFechaCreacion(cliente.creadoEn);
            setEstadoPipeline(cliente.estadoPipeline);
            setArchivoActividades(cliente.actividades);
            setArchivoDocumentos(cliente.documentos);
            setTipoServicio(cliente.tipoServicio);

            setFormData({
                nombre: cliente.nombre,
                noTT: cliente.noTT,
                noRef: cliente.noRef === 'PENDIENTE' ? '' : cliente.noRef,
                correo: cliente.correo === 'pendiente@correo.com' ? '' : cliente.correo,

                calle: cliente.calle === 'PENDIENTE' ? '' : cliente.calle,
                colonia: cliente.colonia === 'PENDIENTE' ? '' : cliente.colonia,
                cp: cliente.cp === '00000' ? '' : cliente.cp,
                cd: cliente.cd === 'PENDIENTE' ? '' : cliente.cd,
                estado: cliente.estado === 'PENDIENTE' ? '' : cliente.estado,
                entreCalle1: cliente.entreCalle1 || '',
                entreCalle2: cliente.entreCalle2 || '',

                ine: cliente.ine || '',
                curp: cliente.curp === 'PENDIENTE' ? '' : cliente.curp,
                usuario: cliente.usuario || '',

                tipoCliente: cliente.tipoCliente,
                paqueteId: cliente.clavePaquete === 'pendiente' ? '' : cliente.clavePaquete,

                tieneInternet: cliente.tieneInternet,
                tieneTelefonoFijo: cliente.tieneTelefonoFijo,
                proveedorActual: cliente.proveedorActual || '',

                numeroAPortar: cliente.numeroAPortar || '',
                nipPortabilidad: cliente.nipPortabilidad || '',
                fechaVigencia: cliente.fechaVigencia || '',
                formatoPortabilidad: cliente.formatoPortabilidad || false,
                cartaBaja: cliente.cartaBaja || false,

                estadoCuentaMegacable: cliente.estadoCuentaMegacable || false,
                notas: cliente.notas,

                folioSiac: cliente.folioSiac || '',
            });
        }
        setLoading(false);
    }, [params.id]);

    const handleTipoServicioChange = (nuevoTipo: TipoServicio) => {
        setTipoServicio(nuevoTipo);
        if (nuevoTipo === 'linea_nueva') {
            setFormData(prev => ({ ...prev, tieneInternet: false, tieneTelefonoFijo: false }));
        } else if (nuevoTipo === 'portabilidad') {
            setFormData(prev => ({ ...prev, tieneInternet: true, tieneTelefonoFijo: true }));
        } else if (nuevoTipo === 'winback') {
            setFormData(prev => ({ ...prev, tieneInternet: true, proveedorActual: 'megacable', estadoCuentaMegacable: true }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const paquetesDisponibles = obtenerPaquetesPorTipo(formData.tipoCliente);
        const paqueteSeleccionado = paquetesDisponibles.find(p => p.id === formData.paqueteId);

        if (!paqueteSeleccionado) {
            alert('Por favor selecciona un paquete');
            return;
        }

        const clienteActualizado: Cliente = {
            id: clienteId, // Mantiene el ID original
            nombre: formData.nombre,
            noTT: formData.noTT,
            noRef: formData.noRef,
            correo: formData.correo,
            calle: formData.calle,
            colonia: formData.colonia,
            cp: formData.cp,
            cd: formData.cd,
            estado: formData.estado,
            entreCalle1: formData.entreCalle1,
            entreCalle2: formData.entreCalle2,
            ine: formData.ine,
            curp: formData.curp,
            usuario: formData.usuario,
            tipoServicio,
            tipoCliente: formData.tipoCliente,
            paquete: `${paqueteSeleccionado.velocidad} Mbps`,
            clavePaquete: paqueteSeleccionado.id,
            velocidad: paqueteSeleccionado.velocidad,
            precioMensual: paqueteSeleccionado.precioPromo,
            tieneInternet: formData.tieneInternet,
            tieneTelefonoFijo: formData.tieneTelefonoFijo,
            proveedorActual: formData.proveedorActual as any,
            numeroAPortar: formData.numeroAPortar,
            nipPortabilidad: formData.nipPortabilidad,
            fechaVigencia: formData.fechaVigencia,
            formatoPortabilidad: formData.formatoPortabilidad,
            cartaBaja: formData.cartaBaja,
            estadoCuentaMegacable: formData.estadoCuentaMegacable,
            estadoPipeline: estadoPipeline as any, // Mantiene el estado original
            fechaContacto: fechaCreacion, // Mantiene fecha original
            fechaUltimaActividad: new Date().toISOString(), // Actualiza última actividad
            comision: calcularComision(tipoServicio),
            notas: formData.notas,
            documentos: archivoDocumentos, // Mantiene documentos
            actividades: archivoActividades, // Mantiene actividades
            creadoEn: fechaCreacion, // Mantiene fecha creación
            actualizadoEn: new Date().toISOString(),
            folioSiac: formData.folioSiac,
        };

        guardarCliente(clienteActualizado);
        alert('Cliente actualizado correctamente');
        router.push(`/clientes/${params.id}`);
    };

    if (loading) return <div className="p-6">Cargando...</div>;
    if (!clienteId) return <div className="p-6">Cliente no encontrado</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft size={20} />
                    Cancelar Edición
                </Button>

                <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
                <p className="text-gray-600 mt-1">Modificar información del cliente</p>
            </div>

            {/* Selector Tipo Cliente */}
            <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex mb-6 w-fit">
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoCliente: 'residencial', paqueteId: '' }))}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${formData.tipoCliente === 'residencial'
                        ? 'bg-telmex-blue text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <HomeIcon size={16} />
                    Residencial
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoCliente: 'pyme', paqueteId: '' }))}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${formData.tipoCliente === 'pyme'
                        ? 'bg-telmex-blue text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Building2 size={16} />
                    Negocio
                </button>
            </div>

            {/* Selector de Tipo de Servicio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                    onClick={() => handleTipoServicioChange('linea_nueva')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${tipoServicio === 'linea_nueva'
                        ? 'border-telmex-blue bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">Línea Nueva</span>
                        <div className={`w-4 h-4 rounded-full border-2 ${tipoServicio === 'linea_nueva' ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'}`} />
                    </div>
                </div>

                <div
                    onClick={() => handleTipoServicioChange('portabilidad')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${tipoServicio === 'portabilidad'
                        ? 'border-telmex-blue bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">Portabilidad</span>
                        <div className={`w-4 h-4 rounded-full border-2 ${tipoServicio === 'portabilidad' ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'}`} />
                    </div>
                </div>

                <div
                    onClick={() => handleTipoServicioChange('winback')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${tipoServicio === 'winback'
                        ? 'border-telmex-blue bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">Winback</span>
                        <div className={`w-4 h-4 rounded-full border-2 ${tipoServicio === 'winback' ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'}`} />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Básica */}
                <Card>
                    <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Nombre Completo" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                            <Input label="No. TT (Teléfono)" value={formData.noTT} onChange={(e) => setFormData({ ...formData, noTT: e.target.value })} required />
                            <Input label="No. Ref (Referencia)" value={formData.noRef} onChange={(e) => setFormData({ ...formData, noRef: e.target.value })} required />
                            <Input label="Correo" type="email" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} required />
                        </div>
                    </CardContent>
                </Card>

                {/* Dirección */}
                <Card>
                    <CardHeader><CardTitle>Dirección</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Calle" value={formData.calle} onChange={(e) => setFormData({ ...formData, calle: e.target.value })} required />
                            <Input label="Colonia" value={formData.colonia} onChange={(e) => setFormData({ ...formData, colonia: e.target.value })} required />
                            <Input label="CP" value={formData.cp} onChange={(e) => setFormData({ ...formData, cp: e.target.value })} required />
                            <Input label="Ciudad" value={formData.cd} onChange={(e) => setFormData({ ...formData, cd: e.target.value })} required />
                            <Input label="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} required />
                            <Input label="Entre Calle 1" value={formData.entreCalle1} onChange={(e) => setFormData({ ...formData, entreCalle1: e.target.value })} />
                            <Input label="Entre Calle 2" value={formData.entreCalle2} onChange={(e) => setFormData({ ...formData, entreCalle2: e.target.value })} />
                        </div>
                    </CardContent>
                </Card>

                {/* Documentación */}
                <Card>
                    <CardHeader><CardTitle>Documentación</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="INE" value={formData.ine} onChange={(e) => setFormData({ ...formData, ine: e.target.value })} />
                            <Input label="CURP" value={formData.curp} onChange={(e) => setFormData({ ...formData, curp: e.target.value })} required />
                            <Input label="Usuario" value={formData.usuario} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })} />
                            <Input label="Folio SIAC" value={formData.folioSiac} onChange={(e) => setFormData({ ...formData, folioSiac: e.target.value })} />
                        </div>
                    </CardContent>
                </Card>

                {/* Clasificación de Servicio */}
                <Card>
                    <CardHeader><CardTitle>Clasificación de Servicio</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.tieneInternet} onChange={(e) => setFormData({ ...formData, tieneInternet: e.target.checked })} className="w-4 h-4" />
                                <span className="text-sm font-medium text-gray-700">¿Tiene internet actualmente?</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.tieneTelefonoFijo} onChange={(e) => setFormData({ ...formData, tieneTelefonoFijo: e.target.checked })} className="w-4 h-4" />
                                <span className="text-sm font-medium text-gray-700">¿Tiene teléfono fijo?</span>
                            </label>
                        </div>
                        {formData.tieneInternet && (
                            <Select label="Proveedor Actual" value={formData.proveedorActual} onChange={(e) => setFormData({ ...formData, proveedorActual: e.target.value })}
                                options={[
                                    { value: 'totalplay', label: 'Totalplay' },
                                    { value: 'izzi', label: 'Izzi' },
                                    { value: 'megacable', label: 'Megacable' },
                                    { value: 'axtel', label: 'Axtel' },
                                    { value: 'dish', label: 'Dish' },
                                    { value: 'otro', label: 'Otro' },
                                ]}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Paquete */}
                <Card>
                    <CardHeader><CardTitle>Paquete</CardTitle></CardHeader>
                    <CardContent>
                        <Select label="Seleccionar Paquete" value={formData.paqueteId} onChange={(e) => setFormData({ ...formData, paqueteId: e.target.value })}
                            options={obtenerPaquetesPorTipo(formData.tipoCliente).map(p => ({
                                value: p.id,
                                label: `${p.velocidad} Mbps - $${p.precioPromo}/mes`
                            }))} required
                        />
                    </CardContent>
                </Card>

                {/* Datos de Portabilidad */}
                {(tipoServicio === 'portabilidad' || tipoServicio === 'winback') && (
                    <Card>
                        <CardHeader><CardTitle>Datos de {tipoServicio === 'portabilidad' ? 'Portabilidad' : 'Winback'}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Número a Portar" value={formData.numeroAPortar} onChange={(e) => setFormData({ ...formData, numeroAPortar: e.target.value })} required />
                                {tipoServicio === 'portabilidad' && (
                                    <>
                                        <Input label="NIP Portabilidad" value={formData.nipPortabilidad} onChange={(e) => setFormData({ ...formData, nipPortabilidad: e.target.value })} required />
                                        <Input label="Fecha Vigencia" type="date" value={formData.fechaVigencia} onChange={(e) => setFormData({ ...formData, fechaVigencia: e.target.value })} />
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={formData.formatoPortabilidad} onChange={(e) => setFormData({ ...formData, formatoPortabilidad: e.target.checked })} className="w-4 h-4" />
                                            <span className="text-sm font-medium text-gray-700">Formato de Portabilidad</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={formData.cartaBaja} onChange={(e) => setFormData({ ...formData, cartaBaja: e.target.checked })} className="w-4 h-4" />
                                            <span className="text-sm font-medium text-gray-700">Carta de Baja</span>
                                        </label>
                                    </>
                                )}
                                {tipoServicio === 'winback' && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.estadoCuentaMegacable} onChange={(e) => setFormData({ ...formData, estadoCuentaMegacable: e.target.checked })} className="w-4 h-4" />
                                        <span className="text-sm font-medium text-gray-700">Estado de Cuenta Megacable</span>
                                    </label>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notas */}
                <Card>
                    <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea label="Notas adicionales" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
                    </CardContent>
                </Card>

                <div className="flex gap-4 justify-end">
                    <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" variant="primary"><Save size={20} className="mr-2" /> Actualizar Cliente</Button>
                </div>
            </form>
        </div>
    );
}
