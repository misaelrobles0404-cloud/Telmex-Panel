'use client';
// Deployment trigger: 2026-02-06 19:40

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { PAQUETES_RESIDENCIALES } from '@/data/paquetes';
import { formatearMoneda } from '@/lib/utils';
import { Calculator as CalcIcon, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function CalculadoraPage() {
    const [paqueteSeleccionado, setPaqueteSeleccionado] = useState('');
    const [precioActual, setPrecioActual] = useState('');
    const [velocidadActual, setVelocidadActual] = useState('');
    const [exporting, setExporting] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const paquete = PAQUETES_RESIDENCIALES.find(p => p.id === paqueteSeleccionado);
    const ahorro = precioActual ? parseFloat(precioActual) - (paquete?.precioPromo || 0) : 0;
    const ahorroAnual = ahorro * 12;

    const exportarImagen = async () => {
        if (!cardRef.current) return;

        try {
            setExporting(true);
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                windowWidth: 1400, // Simular pantalla de escritorio
                onclone: (clonedDoc) => {
                    const element = clonedDoc.getElementById('export-card-container');
                    if (element) {
                        element.style.width = '1000px';
                        element.style.padding = '40px';

                        // 1. Forzar Grid Principal (3 columnas)
                        const comparisonGrid = element.querySelector('#comparison-grid');
                        if (comparisonGrid) {
                            (comparisonGrid as HTMLElement).style.display = 'grid';
                            (comparisonGrid as HTMLElement).style.gridTemplateColumns = 'repeat(3, 1fr)';
                            (comparisonGrid as HTMLElement).style.gap = '24px';
                        }

                        // 2. Forzar Grid Beneficios (2 columnas)
                        const benefitsGrid = element.querySelector('#benefits-grid');
                        if (benefitsGrid) {
                            (benefitsGrid as HTMLElement).style.display = 'grid';
                            (benefitsGrid as HTMLElement).style.gridTemplateColumns = 'repeat(2, 1fr)';
                            (benefitsGrid as HTMLElement).style.gap = '24px';
                        }

                        // 3. Quitar transformaciones
                        const greenCard = element.querySelector('.transform');
                        if (greenCard) {
                            (greenCard as HTMLElement).style.transform = 'none';
                            (greenCard as HTMLElement).style.boxShadow = 'none';
                            (greenCard as HTMLElement).style.border = '2px solid #bbf7d0';
                        }
                    }
                }
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `cotizacion-telmex-${new Date().toISOString().slice(0, 10)}.png`;
            link.click();
        } catch (error) {
            console.error('Error al exportar:', error);
            alert('Hubo un error al generar la imagen. Por favor intenta de nuevo.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Calculadora de Paquetes</h1>
                    <p className="text-gray-600 mt-1">
                        Compara y genera cotizaciones para tus clientes
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Servicio Actual */}
                <Card>
                    <CardHeader>
                        <CardTitle>Servicio Actual del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="label">Proveedor Actual</label>
                            <select className="input">
                                <option value="">Seleccionar...</option>
                                <option value="totalplay">Totalplay</option>
                                <option value="izzi">Izzi</option>
                                <option value="megacable">Megacable</option>
                                <option value="axtel">Axtel</option>
                                <option value="dish">Dish</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Velocidad Actual (Mbps)</label>
                            <input
                                type="number"
                                className="input"
                                value={velocidadActual}
                                onChange={(e) => setVelocidadActual(e.target.value)}
                                placeholder="100"
                            />
                        </div>

                        <div>
                            <label className="label">Precio Mensual Actual</label>
                            <input
                                type="number"
                                className="input"
                                value={precioActual}
                                onChange={(e) => setPrecioActual(e.target.value)}
                                placeholder="500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Paquete TELMEX */}
                <Card>
                    <CardHeader>
                        <CardTitle>Paquete TELMEX a Ofrecer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            label="Seleccionar Paquete"
                            value={paqueteSeleccionado}
                            onChange={(e) => setPaqueteSeleccionado(e.target.value)}
                            options={PAQUETES_RESIDENCIALES.map(p => ({
                                value: p.id,
                                label: `${p.velocidad} Mbps - ${formatearMoneda(p.precioPromo)}/mes`
                            }))}
                        />

                        {paquete && (
                            <div className="mt-4 space-y-3">
                                <div className="bg-telmex-blue/10 p-4 rounded-lg">
                                    <h4 className="font-semibold text-telmex-blue mb-2">Incluye:</h4>
                                    <ul className="space-y-1">
                                        {paquete.incluye.map((item, i) => (
                                            <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                                <span className="text-success">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-gray-600">Precio Promo</p>
                                        <p className="font-bold text-lg text-telmex-blue">
                                            {formatearMoneda(paquete.precioPromo)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-gray-600">Precio Normal</p>
                                        <p className="font-medium text-gray-700">
                                            {formatearMoneda(paquete.precioNormal)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Comparativa */}
            {paquete && precioActual && (
                <div ref={cardRef} id="export-card-container" className="p-4 bg-white rounded-xl">
                    <Card className="mt-2 border-telmex-blue border-2 shadow-lg">
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-telmex-blue">Propuesta de Ahorro TELMEX</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">Mejora tu servicio y paga menos</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={exportarImagen}
                                        loading={exporting}
                                        className="hidden md:flex"
                                        data-html2canvas-ignore="true"
                                    >
                                        <Download size={16} />
                                        Guardar Imagen
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div id="comparison-grid" className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-100">
                                    <p className="text-sm text-gray-600 mb-2 font-medium">Estás pagando</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatearMoneda(parseFloat(precioActual))}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">{velocidadActual} Mbps</p>
                                </div>

                                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100 transform scale-105 shadow-md">
                                    <p className="text-sm text-gray-600 mb-2 font-medium">Con TELMEX pagarías</p>
                                    <p className="text-3xl font-bold text-success">
                                        {formatearMoneda(paquete.precioPromo)}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">{paquete.velocidad} Mbps</p>
                                </div>

                                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <p className="text-sm text-gray-600 mb-2 font-medium">Tu Ahorro Mensual</p>
                                    <p className="text-3xl font-bold text-warning">
                                        {formatearMoneda(ahorro)}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-4 font-medium bg-yellow-100 rounded-full px-2 py-0.5 inline-block">
                                        {formatearMoneda(ahorroAnual)}/año
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 bg-gradient-to-r from-telmex-blue to-telmex-lightblue text-white">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span>🎁</span> Beneficios Exclusivos
                                </h3>
                                <div id="benefits-grid" className="grid grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <div>
                                            <span className="text-2xl">📺</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Netflix Incluido</p>
                                            <p className="text-sm text-white/90">Gratis por 6 meses</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div>
                                            <span className="text-2xl">🚀</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Más Velocidad</p>
                                            <p className="text-sm text-white/90">
                                                Fibra óptica hasta tu casa
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div>
                                            <span className="text-2xl">📞</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Llamadas Ilimitadas</p>
                                            <p className="text-sm text-white/90">Celulares y fijos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div>
                                            <span className="text-2xl">🎁</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">3 Meses Gratis</p>
                                            <p className="text-xs text-white/90">4º, 8º y 12º mes sin costo</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/20 text-center text-sm text-white/80">
                                    * Precios incluyen impuestos. Vigencia de promoción 12 meses.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Actions Bar (Outside ref) */}
            {paquete && precioActual && (
                <div className="mt-4 flex justify-end">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={exportarImagen}
                        loading={exporting}
                        className="shadow-lg hover:shadow-xl transition-all"
                    >
                        <Download size={20} />
                        Descargar Cotización (Imagen)
                    </Button>
                </div>
            )}

            {/* Catálogo de Paquetes */}
            <Card className="mt-12">
                <CardHeader>
                    <CardTitle>Todos los Paquetes Residenciales</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PAQUETES_RESIDENCIALES.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paqueteSeleccionado === pkg.id
                                    ? 'border-telmex-blue bg-telmex-blue/5'
                                    : 'border-gray-200 hover:border-telmex-blue/50'
                                    }`}
                                onClick={() => setPaqueteSeleccionado(pkg.id)}
                            >
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-telmex-blue">{pkg.velocidad}</p>
                                    <p className="text-sm text-gray-600">Mbps</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatearMoneda(pkg.precioPromo)}
                                    </p>
                                    <p className="text-xs text-gray-500 line-through">
                                        {formatearMoneda(pkg.precioNormal)}
                                    </p>
                                    {pkg.netflix && (
                                        <span className="inline-block mt-2 badge badge-red">Netflix</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
