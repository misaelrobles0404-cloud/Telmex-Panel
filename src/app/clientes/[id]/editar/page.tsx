'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Cliente, TipoServicio, TipoCliente, REQUISITOS_SERVICIO } from '@/types';
import { guardarCliente, obtenerCliente } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
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
        noRef2: '',
        correo: '',

        // Dirección
        // Dirección
        calle: '',
        numeroExterior: '',
        numeroInterior: '',
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
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [fechaCreacion, setFechaCreacion] = useState('');
    const [estadoPipeline, setEstadoPipeline] = useState('');
    const [archivoActividades, setArchivoActividades] = useState<any[]>([]);
    const [archivoDocumentos, setArchivoDocumentos] = useState<any[]>([]);

    useEffect(() => {
        const fetchCliente = async () => {
            const [cliente, { data: { user } }] = await Promise.all([
                obtenerCliente(params.id),
                supabase.auth.getUser()
            ]);

            if (cliente) {
                setClienteId(cliente.id);
                // Si el cliente no tiene user_id (antiguo), asignamos el usuario actual
                setUserId(cliente.user_id || user?.id);
                setFechaCreacion(cliente.creado_en);
                setEstadoPipeline(cliente.estado_pipeline);
                setTipoServicio(cliente.tipo_servicio);

                setFormData({
                    nombre: cliente.nombre,
                    noTT: cliente.no_tt,
                    noRef: cliente.no_ref === 'PENDIENTE' ? '' : cliente.no_ref,
                    noRef2: cliente.no_ref_2 || '',
                    correo: cliente.correo === 'pendiente@correo.com' ? '' : cliente.correo,

                    calle: cliente.calle === 'PENDIENTE' ? '' : cliente.calle,
                    numeroExterior: cliente.numero_exterior || '',
                    numeroInterior: cliente.numero_interior || '',
                    colonia: cliente.colonia === 'PENDIENTE' ? '' : cliente.colonia,
                    cp: cliente.cp === '00000' ? '' : cliente.cp,
                    cd: cliente.cd === 'PENDIENTE' ? '' : cliente.cd,
                    estado: cliente.estado === 'PENDIENTE' ? '' : cliente.estado,
                    entreCalle1: cliente.entre_calle_1 || '',
                    entreCalle2: cliente.entre_calle_2 || '',

                    ine: cliente.ine || '',
                    curp: cliente.curp === 'PENDIENTE' ? '' : cliente.curp,
                    usuario: cliente.usuario || '',

                    tipoCliente: cliente.tipo_cliente,
                    paqueteId: cliente.clave_paquete === 'pendiente' ? '' : cliente.clave_paquete,

                    tieneInternet: cliente.tiene_internet,
                    tieneTelefonoFijo: cliente.tiene_telefono_fijo,
                    proveedorActual: cliente.proveedor_actual || '',

                    numeroAPortar: cliente.numero_a_portar || '',
                    nipPortabilidad: cliente.nip_portabilidad || '',
                    fechaVigencia: cliente.fecha_vigencia || '',
                    formatoPortabilidad: cliente.formato_portabilidad || false,
                    cartaBaja: cliente.carta_baja || false,

                    estadoCuentaMegacable: cliente.estado_cuenta_megacable || false,
                    notas: cliente.notas,

                    folioSiac: cliente.folio_siac || '',
                });
            }
            setLoading(false);
        };
        fetchCliente();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificar sesión actual para asegurar el user_id
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !userId) {
            alert('Error de sesión: No se pudo identificar al usuario. Por favor recarga la página o inicia sesión nuevamente.');
            return;
        }

        // Usar el ID del usuario actual si el cliente no tiene uno asignado
        const finalUserId = userId || user?.id;

        const paquetesDisponibles = obtenerPaquetesPorTipo(formData.tipoCliente);
        const paqueteSeleccionado = paquetesDisponibles.find(p => p.id === formData.paqueteId);

        if (!paqueteSeleccionado) {
            alert('Por favor selecciona un paquete');
            return;
        }

        const clienteActualizado: Cliente = {
            id: clienteId,
            user_id: finalUserId,
            nombre: formData.nombre,
            no_tt: formData.noTT,
            no_ref: formData.noRef,
            no_ref_2: formData.noRef2 || undefined,
            correo: formData.correo,
            calle: formData.calle,
            numero_exterior: formData.numeroExterior,
            numero_interior: formData.numeroInterior,
            colonia: formData.colonia,
            cp: formData.cp,
            cd: formData.cd,
            estado: formData.estado,
            entre_calle_1: formData.entreCalle1,
            entre_calle_2: formData.entreCalle2,
            ine: formData.ine,
            curp: formData.curp,
            usuario: formData.usuario,
            tipo_servicio: tipoServicio,
            tipo_cliente: formData.tipoCliente,
            paquete: `${paqueteSeleccionado.velocidad} Mbps`,
            clave_paquete: paqueteSeleccionado.id,
            velocidad: paqueteSeleccionado.velocidad,
            precio_mensual: paqueteSeleccionado.precioPromo,
            tiene_internet: formData.tieneInternet,
            tiene_telefono_fijo: formData.tieneTelefonoFijo,
            proveedor_actual: (formData.proveedorActual as any) || undefined,
            numero_a_portar: formData.numeroAPortar,
            nip_portabilidad: formData.nipPortabilidad,
            fecha_vigencia: formData.fechaVigencia || undefined,
            formato_portabilidad: formData.formatoPortabilidad,
            carta_baja: formData.cartaBaja,
            estado_cuenta_megacable: formData.estadoCuentaMegacable,
            estado_pipeline: (() => {
                if (formData.folioSiac && formData.folioSiac.trim() !== '' && estadoPipeline !== 'vendido') {
                    return 'cierre_programado';
                }
                // Sanitizar estados obsoletos
                if (estadoPipeline === 'perdido') return 'sin_cobertura';
                if (estadoPipeline === 'cotizacion') return 'interesado';
                return estadoPipeline as any;
            })(),
            fecha_contacto: fechaCreacion,
            fecha_ultima_actividad: new Date().toISOString(),
            comision: calcularComision(tipoServicio),
            notas: formData.notas,
            creado_en: fechaCreacion,
            actualizado_en: new Date().toISOString(),
            folio_siac: formData.folioSiac,
        };

        console.log('Enviando actualización de cliente:', clienteActualizado);

        try {
            await guardarCliente(clienteActualizado);
            alert('Cliente actualizado correctamente');
            router.push(`/clientes/${params.id}`);
        } catch (error: any) {
            console.error('Error FULL al actualizar cliente:', error);
            alert(`Error al actualizar: ${error.message || JSON.stringify(error)}`);
        }
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
                            <Input label="No. Ref 2 (Opcional)" value={formData.noRef2} onChange={(e) => setFormData({ ...formData, noRef2: e.target.value })} />
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
                            <Input label="Número Exterior" value={formData.numeroExterior} onChange={(e) => setFormData({ ...formData, numeroExterior: e.target.value })} placeholder="Opcional" />
                            <Input label="Número Interior" value={formData.numeroInterior} onChange={(e) => setFormData({ ...formData, numeroInterior: e.target.value })} placeholder="Opcional" />
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

                {/* Clasificación de Servicio - Solo si NO es Línea Nueva */}
                {tipoServicio !== 'linea_nueva' && (
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
                )}

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
