'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Cliente, TipoServicio, TipoCliente } from '@/types';
import { guardarCliente } from '@/lib/storage';
import { clasificarServicio, calcularComision, generarId } from '@/lib/utils';
import { PAQUETES_RESIDENCIALES } from '@/data/paquetes';
import { ArrowLeft, Save } from 'lucide-react';

export default function NuevoClientePage() {
    const router = useRouter();
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
    });

    const [tipoServicio, setTipoServicio] = useState<TipoServicio>('linea_nueva');

    // Actualizar tipo de servicio cuando cambian los campos relevantes
    React.useEffect(() => {
        const nuevoTipo = clasificarServicio(
            formData.tieneInternet,
            formData.tieneTelefonoFijo,
            formData.proveedorActual
        );
        setTipoServicio(nuevoTipo);
    }, [formData.tieneInternet, formData.tieneTelefonoFijo, formData.proveedorActual]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const paqueteSeleccionado = PAQUETES_RESIDENCIALES.find(p => p.id === formData.paqueteId);

        if (!paqueteSeleccionado) {
            alert('Por favor selecciona un paquete');
            return;
        }

        const cliente: Cliente = {
            id: generarId(),
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
            estadoPipeline: 'contactado',
            fechaContacto: new Date().toISOString(),
            fechaUltimaActividad: new Date().toISOString(),
            comision: calcularComision(tipoServicio),
            notas: formData.notas,
            documentos: [],
            actividades: [],
            creadoEn: new Date().toISOString(),
            actualizadoEn: new Date().toISOString(),
        };

        guardarCliente(cliente);
        router.push('/clientes');
    };

    const comision = calcularComision(tipoServicio);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft size={20} />
                    Volver
                </Button>

                <h1 className="text-3xl font-bold text-gray-900">Nuevo Cliente</h1>
                <p className="text-gray-600 mt-1">Formulario de captura TELMEX</p>
            </div>

            {/* Tipo de Servicio y Comisión */}
            <Card className="mb-6 bg-gradient-to-r from-telmex-blue to-telmex-lightblue text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Tipo de Servicio</h3>
                            <p className="text-2xl font-bold mt-1">
                                {tipoServicio === 'linea_nueva' && 'Línea Nueva'}
                                {tipoServicio === 'portabilidad' && 'Portabilidad'}
                                {tipoServicio === 'winback' && 'Winback (Megacable)'}
                            </p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-lg font-semibold">Comisión</h3>
                            <p className="text-3xl font-bold mt-1">${comision}</p>
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
                                required
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

                {/* Clasificación de Servicio */}
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

                {/* Paquete */}
                <Card>
                    <CardHeader>
                        <CardTitle>Paquete TELMEX</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            label="Seleccionar Paquete"
                            value={formData.paqueteId}
                            onChange={(e) => setFormData({ ...formData, paqueteId: e.target.value })}
                            options={PAQUETES_RESIDENCIALES.map(p => ({
                                value: p.id,
                                label: `${p.velocidad} Mbps - $${p.precioPromo}/mes ${p.netflix ? '(Netflix incluido)' : ''}`
                            }))}
                            required
                        />
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
                                        <Input
                                            label="NIP Portabilidad (marcar 051)"
                                            value={formData.nipPortabilidad}
                                            onChange={(e) => setFormData({ ...formData, nipPortabilidad: e.target.value })}
                                            required
                                        />

                                        <Input
                                            label="Fecha de Vigencia"
                                            type="date"
                                            value={formData.fechaVigencia}
                                            onChange={(e) => setFormData({ ...formData, fechaVigencia: e.target.value })}
                                        />

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

                {/* Notas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            label="Notas adicionales"
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            placeholder="Información adicional sobre el cliente..."
                        />
                    </CardContent>
                </Card>

                {/* Botones */}
                <div className="flex gap-4 justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>

                    <Button type="submit" variant="primary">
                        <Save size={20} />
                        Guardar Cliente
                    </Button>
                </div>
            </form>
        </div>
    );
}
