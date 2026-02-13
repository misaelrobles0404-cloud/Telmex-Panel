'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Cliente, TipoServicio, TipoCliente, REQUISITOS_SERVICIO } from '@/types';
import { guardarCliente } from '@/lib/storage';
import { clasificarServicio, calcularComision, generarId } from '@/lib/utils';
import { PAQUETES_RESIDENCIALES, PAQUETES_PYME, obtenerPaquetesPorTipo } from '@/data/paquetes';
import { ArrowLeft, Save, Building2, Home as HomeIcon, UserPlus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClavesPortalCard } from '@/components/ClavesPortalCard';
import { obtenerConfiguracion } from '@/lib/admin';

export default function NuevoClientePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        // Información básica
        nombre: '',
        noTT: '',
        noRef: '',
        noRef2: '',
        correo: '',

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
        formatoPortabilidad: false,
        cartaBaja: false,

        // Winback
        estadoCuentaMegacable: false,

        // Notas
        notas: '',
    });

    const [loading, setLoading] = useState(false);
    const [loadingPaquetes, setLoadingPaquetes] = useState(true);
    const [paquetesDynamicos, setPaquetesDynamicos] = useState<any[]>([]);
    const [tipoServicio, setTipoServicio] = useState<TipoServicio>('linea_nueva');

    // Manejar cambio manual de tipo de servicio
    const handleTipoServicioChange = (nuevoTipo: TipoServicio) => {
        setTipoServicio(nuevoTipo);

        // Ajustar checkboxes automáticamente según el tipo seleccionado para consistencia
        if (nuevoTipo === 'linea_nueva') {
            setFormData(prev => ({ ...prev, tieneInternet: false, tieneTelefonoFijo: false }));
        } else if (nuevoTipo === 'portabilidad') {
            setFormData(prev => ({ ...prev, tieneInternet: true, tieneTelefonoFijo: true }));
        } else if (nuevoTipo === 'winback') {
            setFormData(prev => ({ ...prev, tieneInternet: true, proveedorActual: 'megacable', estadoCuentaMegacable: true }));
        }
    };

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const cargarDatos = async () => {
            setLoadingPaquetes(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user?.email) {
                setFormData(prev => ({ ...prev, usuario: user.email || '' }));
            }

            // Cargar paquetes dinámicos
            const pqData = await obtenerConfiguracion<any[]>('catalogo_paquetes');
            if (pqData && pqData.length > 0) {
                setPaquetesDynamicos(pqData);
            } else {
                // Fallback a estáticos si no hay en DB
                const { PAQUETES_RESIDENCIALES, PAQUETES_PYME } = await import('@/data/paquetes');
                const initial = [
                    ...PAQUETES_RESIDENCIALES.map(p => ({ ...p, categoria: p.llamadasIlimitadas ? 'residencial' : 'solo_internet', nombre: `${p.velocidad} Mbps- $${p.precioPromo}/mes` })),
                    ...PAQUETES_PYME.map(p => ({ ...p, categoria: 'pyme', nombre: `PYME ${p.velocidad} Mbps` }))
                ];
                setPaquetesDynamicos(initial);
            }
            setLoadingPaquetes(false);
        };
        cargarDatos();

        // Limpiar cualquier residuo de borrador antiguo una sola vez al entrar
        localStorage.removeItem('nuevo_cliente_borrador');
    }, []);

    const handleGuardarProspecto = async (silent = false) => {
        if (!formData.noTT && !formData.nombre) {
            if (!silent) alert('Para prospecto se requiere al menos el Teléfono o Nombre');
            return;
        }

        if (!user) {
            if (!silent) alert('Error de sesión');
            return;
        }

        if (!silent) setLoading(true);
        const nombreFinal = formData.nombre.trim() || `Prospecto ${formData.noTT}`;

        const cliente: Cliente = {
            id: crypto.randomUUID(),
            user_id: user.id,
            nombre: nombreFinal,
            no_tt: formData.noTT || 'PENDIENTE',
            no_ref: formData.noRef || 'PENDIENTE',
            no_ref_2: formData.noRef2 || undefined,
            correo: formData.correo || 'pendiente@correo.com',
            calle: 'PENDIENTE',
            numero_exterior: '',
            numero_interior: '',
            colonia: 'PENDIENTE',
            cp: '00000',
            cd: formData.cd || 'PENDIENTE',
            estado: formData.estado || 'PENDIENTE',
            entre_calle_1: '',
            entre_calle_2: '',
            ine: '',
            curp: 'PENDIENTE',
            usuario: user.email || '',
            tipo_servicio: tipoServicio,
            tipo_cliente: formData.tipoCliente,
            paquete: 'POR DEFINIR',
            clave_paquete: 'pendiente',
            velocidad: 0,
            precio_mensual: 0,
            incluye_telefono: false,
            tiene_internet: false,
            tiene_telefono_fijo: false,
            proveedor_actual: undefined,
            numero_a_portar: '',
            nip_portabilidad: '',
            formato_portabilidad: false,
            carta_baja: false,
            estado_cuenta_megacable: false,
            estado_pipeline: 'interesado',
            fecha_contacto: new Date().toISOString(),
            fecha_ultima_actividad: new Date().toISOString(),
            comision: 0,
            notas: formData.notas,
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString(),
        };

        try {
            await guardarCliente(cliente);
            localStorage.removeItem('nuevo_cliente_borrador');
            if (!silent) router.push('/clientes');
        } catch (error: any) {
            console.error('Error al guardar prospecto:', error);
            if (!silent) alert(`Error al guardar prospecto: ${error?.message || 'Error desconocido'}`);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const limpiarFormulario = () => {
        if (!confirm('¿Seguro que deseas limpiar todo el formulario?')) return;
        setFormData({
            nombre: '',
            noTT: '',
            noRef: '',
            noRef2: '',
            correo: '',
            calle: '',
            numeroExterior: '',
            numeroInterior: '',
            colonia: '',
            cp: '',
            cd: '',
            estado: '',
            entreCalle1: '',
            entreCalle2: '',
            ine: '',
            curp: '',
            usuario: user?.email || '',
            tipoCliente: 'residencial',
            paqueteId: '',
            tieneInternet: false,
            tieneTelefonoFijo: false,
            proveedorActual: '',
            numeroAPortar: '',
            nipPortabilidad: '',
            formatoPortabilidad: false,
            cartaBaja: false,
            estadoCuentaMegacable: false,
            notas: '',
        });
        localStorage.removeItem('nuevo_cliente_borrador');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert('Error de sesión. Re-inicia sesión.');
            return;
        }

        setLoading(true);

        if (!formData.nombre.trim()) {
            alert('El Nombre Completo es obligatorio para registrar un cliente.');
            setLoading(false);
            return;
        }

        const paqueteSeleccionado = paquetesDynamicos.find(p => p.id === formData.paqueteId);

        if (!paqueteSeleccionado) {
            alert('Por favor selecciona un paquete');
            setLoading(false);
            return;
        }

        const cliente: Cliente = {
            id: crypto.randomUUID(),
            user_id: user.id,
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
            usuario: formData.usuario || user.email || '',
            tipo_servicio: tipoServicio,
            tipo_cliente: formData.tipoCliente,
            paquete: paqueteSeleccionado.nombre || `${paqueteSeleccionado.velocidad} Mbps`,
            clave_paquete: paqueteSeleccionado.id,
            velocidad: paqueteSeleccionado.velocidad,
            precio_mensual: paqueteSeleccionado.precio || paqueteSeleccionado.precioPromo,
            incluye_telefono: paqueteSeleccionado.llamadasIlimitadas,
            tiene_internet: formData.tieneInternet,
            tiene_telefono_fijo: formData.tieneTelefonoFijo,
            proveedor_actual: formData.proveedorActual as any,
            numero_a_portar: formData.numeroAPortar,
            nip_portabilidad: formData.nipPortabilidad,
            formato_portabilidad: formData.formatoPortabilidad,
            carta_baja: formData.cartaBaja,
            estado_cuenta_megacable: formData.estadoCuentaMegacable,
            estado_pipeline: 'contactado',
            fecha_contacto: new Date().toISOString(),
            fecha_ultima_actividad: new Date().toISOString(),
            comision: calcularComision(tipoServicio),
            notas: formData.notas,
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString(),
        };

        try {
            await guardarCliente(cliente);
            localStorage.removeItem('nuevo_cliente_borrador');
            router.push('/clientes');
        } catch (error: any) {
            console.error('Error al guardar cliente:', error);
            alert(`Error al guardar cliente: ${error?.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const comision = calcularComision(tipoServicio);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft size={20} />
                    Volver
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Nuevo Cliente</h1>
                        <p className="text-gray-600 mt-1">Formulario de captura TELMEX</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={limpiarFormulario}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        Limpiar Formulario
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Izquierda - Claves Portal */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-6">
                        <ClavesPortalCard />
                    </div>
                </div>

                {/* Contenido Principal - Formulario */}
                <div className="lg:col-span-3">
                    {/* Advertencia de Requisitos para Comisión */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-bold text-yellow-800">
                                    REQUISITOS OBLIGATORIOS PARA COMISIONAR
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p className="font-semibold mb-2">Asegúrate de tener las siguientes capturas:</p>
                                    <ul className="list-decimal list-inside space-y-1 font-medium">
                                        <li>ACEPTO DEL CLIENTE (Audio o Mensaje)</li>
                                        <li>DATOS Y MAPA EN PORTAL</li>
                                        <li>PAQUETE ELEGIDO EN PORTAL</li>
                                        <li>CAPTURA DE FOLIO EN PORTAL</li>
                                        <li>CAPTURA DE FOLIO SIAC EN CHAT-CLIENTE</li>
                                        <li>CAPTURA DEL CURP</li>
                                        <li>FOTO DE COBERTURA</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selector Tipo Cliente (Residencial / Negocio) */}
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
                                <div className={`w-4 h-4 rounded-full border-2 ${tipoServicio === 'linea_nueva' ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'
                                    }`} />
                            </div>
                            <p className="text-sm text-gray-500">
                                Cliente sin servicio actual o instalación nueva.
                            </p>
                            <p className="text-telmex-blue font-bold mt-2 text-lg">$250 MXN</p>
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
                                <div className={`w-4 h-4 rounded-full border-2 ${tipoServicio === 'portabilidad' ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'
                                    }`} />
                            </div>
                            <p className="text-sm text-gray-500">
                                Cambio de compañía (Izzi, Totalplay) conservando número.
                            </p>
                            <p className="text-telmex-blue font-bold mt-2 text-lg">$300 MXN</p>
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
                                <div className={`w-4 h-4 rounded-full border-2 ${tipoServicio === 'winback' ? 'border-telmex-blue bg-telmex-blue' : 'border-gray-300'
                                    }`} />
                            </div>
                            <p className="text-sm text-gray-500">
                                Recuperación de clientes específicos (Megacable).
                            </p>
                            <p className="text-telmex-blue font-bold mt-2 text-lg">$300 MXN</p>
                        </div>
                    </div>

                    {/* Requisitos del Trámite */}
                    <Card className="mb-6 bg-blue-50 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-telmex-blue">
                                <span role="img" aria-label="info">ℹ️</span> Requisitos para {REQUISITOS_SERVICIO[tipoServicio].tipoServicio.replace('_', ' ').toUpperCase()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 text-gray-700">Documentos Necesarios:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                        {REQUISITOS_SERVICIO[tipoServicio].documentos.map((req, idx) => (
                                            <li key={idx}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 text-gray-700">Datos a Capturar:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                        {REQUISITOS_SERVICIO[tipoServicio].campos.map((campo, idx) => (
                                            <li key={idx}>{campo}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Básica</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Nombre Completo"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Opcional para prospectos"
                                    />

                                    <Input
                                        label="No. TT (Teléfono)"
                                        value={formData.noTT}
                                        onChange={(e) => setFormData({ ...formData, noTT: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="No. Ref (Referencia)"
                                        value={formData.noRef}
                                        onChange={(e) => setFormData({ ...formData, noRef: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="No. Ref 2 (Opcional)"
                                        value={formData.noRef2}
                                        onChange={(e) => setFormData({ ...formData, noRef2: e.target.value })}
                                    />

                                    <Input
                                        label="Correo"
                                        type="email"
                                        value={formData.correo}
                                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dirección */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Dirección</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Calle"
                                        value={formData.calle}
                                        onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="Número Exterior"
                                        value={formData.numeroExterior}
                                        onChange={(e) => setFormData({ ...formData, numeroExterior: e.target.value })}
                                        placeholder="Opcional"
                                    />

                                    <Input
                                        label="Número Interior"
                                        value={formData.numeroInterior}
                                        onChange={(e) => setFormData({ ...formData, numeroInterior: e.target.value })}
                                        placeholder="Opcional"
                                    />

                                    <Input
                                        label="Colonia"
                                        value={formData.colonia}
                                        onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="CP (Código Postal)"
                                        value={formData.cp}
                                        onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="CD (Ciudad)"
                                        value={formData.cd}
                                        onChange={(e) => setFormData({ ...formData, cd: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="Estado"
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="Entre Calle 1"
                                        value={formData.entreCalle1}
                                        onChange={(e) => setFormData({ ...formData, entreCalle1: e.target.value })}
                                    />

                                    <Input
                                        label="Entre Calle 2"
                                        value={formData.entreCalle2}
                                        onChange={(e) => setFormData({ ...formData, entreCalle2: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documentación */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Documentación</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        label="INE"
                                        value={formData.ine}
                                        onChange={(e) => setFormData({ ...formData, ine: e.target.value })}
                                    />

                                    <Input
                                        label="CURP"
                                        value={formData.curp}
                                        onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="Usuario"
                                        value={formData.usuario}
                                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Clasificación de Servicio - Solo si NO es Línea Nueva */}
                        {tipoServicio !== 'linea_nueva' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Clasificación de Servicio</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.tieneInternet}
                                                    onChange={(e) => setFormData({ ...formData, tieneInternet: e.target.checked })}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    ¿Tiene internet actualmente?
                                                </span>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.tieneTelefonoFijo}
                                                    onChange={(e) => setFormData({ ...formData, tieneTelefonoFijo: e.target.checked })}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    ¿Tiene teléfono fijo?
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.tieneInternet && (
                                        <Select
                                            label="Proveedor Actual"
                                            value={formData.proveedorActual}
                                            onChange={(e) => setFormData({ ...formData, proveedorActual: e.target.value })}
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
                            <CardHeader>
                                <CardTitle>Paquete {formData.tipoCliente === 'residencial' ? 'TELMEX' : 'NEGOCIO'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    label="Seleccionar Paquete"
                                    value={formData.paqueteId}
                                    disabled={loadingPaquetes}
                                    onChange={(e) => setFormData({ ...formData, paqueteId: e.target.value })}
                                    options={paquetesDynamicos
                                        .filter(p => {
                                            if (p.activo === false) return false;
                                            const matchesCategoria = p.categoria === formData.tipoCliente || (formData.tipoCliente === 'residencial' && p.categoria === 'solo_internet');

                                            // En portabilidad esconder los que son solo internet (sin telefono)
                                            if (tipoServicio === 'portabilidad' && !p.llamadasIlimitadas) return false;

                                            return matchesCategoria;
                                        })
                                        .map(p => ({
                                            value: p.id,
                                            label: p.nombre || `${p.velocidad} Mbps${p.llamadasIlimitadas ? ' - INTERNET Y TELEFONÍA' : ''} - $${p.precio}/mes`
                                        }))}
                                    required
                                />
                                {loadingPaquetes && <p className="text-xs text-telmex-blue animate-pulse mt-1">Cargando paquetes...</p>}
                                {!loadingPaquetes && formData.paqueteId && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded-lg animate-in fade-in duration-300">
                                        <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-1">Beneficios del Paquete:</p>
                                        <div className="space-y-1">
                                            {(() => {
                                                const pq = paquetesDynamicos.find(p => p.id === formData.paqueteId);
                                                const b = pq?.beneficios;
                                                if (Array.isArray(b) && b.length > 0) {
                                                    return b.filter(item => item.trim() !== '').map((item, i) => (
                                                        <div key={i} className="flex items-start gap-1 text-xs text-blue-900 font-medium leading-tight">
                                                            <span className="text-blue-500">•</span>
                                                            <span>{item}</span>
                                                        </div>
                                                    ));
                                                }
                                                return <p className="text-xs text-blue-600 italic">Sin beneficios adicionales registrados.</p>;
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Datos de Portabilidad */}
                        {(tipoServicio === 'portabilidad' || tipoServicio === 'winback') && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Datos de {tipoServicio === 'portabilidad' ? 'Portabilidad' : 'Winback'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Número a Portar"
                                            value={formData.numeroAPortar}
                                            onChange={(e) => setFormData({ ...formData, numeroAPortar: e.target.value })}
                                            required
                                        />

                                        {tipoServicio === 'portabilidad' && (
                                            <>
                                                <div className="relative group">
                                                    <Input
                                                        label="NIP Portabilidad (051)"
                                                        value={formData.nipPortabilidad}
                                                        onChange={(e) => setFormData({ ...formData, nipPortabilidad: e.target.value })}
                                                        placeholder="Vacio si no lo tiene"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, nipPortabilidad: '0000' })}
                                                        className="absolute right-2 top-8 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded border border-gray-300 transition-colors"
                                                    >
                                                        Usar Genérico (0000)
                                                    </button>
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.formatoPortabilidad}
                                                            onChange={(e) => setFormData({ ...formData, formatoPortabilidad: e.target.checked })}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Formato de Portabilidad
                                                        </span>
                                                    </label>
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.cartaBaja}
                                                            onChange={(e) => setFormData({ ...formData, cartaBaja: e.target.checked })}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Carta de Baja
                                                        </span>
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {tipoServicio === 'winback' && (
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.estadoCuentaMegacable}
                                                        onChange={(e) => setFormData({ ...formData, estadoCuentaMegacable: e.target.checked })}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Estado de Cuenta Megacable
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notas y Campaña */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Origen y Notas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    label="Notas adicionales"
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    placeholder="Información adicional sobre el cliente..."
                                />
                            </CardContent>
                        </Card>

                        {/* Botones */}
                        <div className="flex gap-1.5 sm:gap-4 justify-end items-center mt-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.back()}
                                className="text-gray-500 hover:text-gray-700 text-[11px] sm:text-sm px-2 sm:px-4"
                            >
                                Cancelar
                            </Button>

                            <Button
                                type="button"
                                onClick={() => handleGuardarProspecto()}
                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[10px] sm:text-sm px-2 sm:px-4 py-2"
                            >
                                <UserPlus size={14} className="sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                GUARDAR PROSPECTO
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                className="text-[10px] sm:text-sm px-2 sm:px-4 py-2"
                            >
                                <Save size={14} className="sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                GUARDAR CLIENTE
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
