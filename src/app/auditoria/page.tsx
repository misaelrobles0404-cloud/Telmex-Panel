"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Cliente } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    ClipboardCheck,
    Search,
    Save,
    Download,
    ExternalLink,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

export default function AuditoriaPage() {
    const [foliosInput, setFoliosInput] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [resultados, setResultados] = useState<any[]>([]);

    const procesarFolios = async () => {
        setProcesando(true);
        setResultados([]);

        // 1. Limpiar y procesar entrada
        const listaFolios = foliosInput
            .split(/[\n,]+/) // Separar por saltos de línea o comas
            .map(f => f.trim())
            .filter(f => f.length > 0);

        if (listaFolios.length === 0) {
            alert("Ingresa al menos un folio.");
            setProcesando(false);
            return;
        }

        try {
            // 2. Buscar en Supabase
            // Nota: .in() tiene un límite, para 200 folios está bien, pero para miles habría que paginar.
            const { data: clientesEncontrados, error } = await supabase
                .from('clientes')
                .select('*')
                .in('folio_siac', listaFolios);

            if (error) throw error;

            // 3. Cruzar resultados
            const procesados = listaFolios.map(folio => {
                const cliente = clientesEncontrados?.find((c: any) => c.folio_siac === folio);
                return {
                    folio_buscado: folio,
                    encontrado: !!cliente,
                    cliente: cliente || null,
                    // Campos para edición temporal
                    nueva_os: cliente?.orden_servicio || '',
                    nuevo_estado: cliente?.estado_pipeline || 'vendido',
                    modificado: false
                };
            });

            setResultados(procesados);

        } catch (error) {
            console.error("Error al buscar folios:", error);
            alert("Error al procesar los folios. Revisa la consola.");
        } finally {
            setProcesando(false);
        }
    };

    const actualizarFila = (index: number, campo: 'nueva_os' | 'nuevo_estado', valor: string) => {
        const nuevosResultados = [...resultados];
        nuevosResultados[index][campo] = valor;
        nuevosResultados[index].modificado = true;

        // Si ingresa OS, sugerir cambio a "vendido" si no lo está, o mantener el actual. 
        // El usuario decide el estado final (ej. instalado).

        setResultados(nuevosResultados);
    };

    const guardarCambios = async () => {
        const modificados = resultados.filter(r => r.encontrado && r.modificado);

        if (modificados.length === 0) {
            alert("No hay cambios para guardar.");
            return;
        }

        if (!confirm(`¿Vas a actualizar ${modificados.length} clientes?`)) return;

        setProcesando(true);
        let exito = 0;
        let errores = 0;

        for (const item of modificados) {
            try {
                // Validación básica: Si cambia a instalado/vendido, asegurar fecha si es necesario?
                // Por ahora actualización simple.

                const updateData: any = {
                    orden_servicio: item.nueva_os,
                    estado_pipeline: item.nuevo_estado,
                    actualizado_en: new Date().toISOString()
                };

                // Si se marca como instalado (o equivalente según tu flujo, asumiremos 'vendido' o definiremos 'instalado' si existe en tipos)
                // Revisando tipos: 'contactado', 'interesado', 'cierre_programado', 'vendido', 'sin_cobertura', 'cobertura_cobre', 'perdido', 'cotizacion'
                // El usuario mencionaba "Verificar si ya se hizo la instalación".
                // Probablemente 'vendido' es el estado final de éxito actual, o necesitan uno nuevo 'instalado'.
                // Mantendremos los estados existentes por ahora.

                const { error } = await supabase
                    .from('clientes')
                    .update(updateData)
                    .eq('id', item.cliente.id);

                if (error) throw error;

                exito++;
                // Actualizar estado local para quitar marca de modificado
                item.cliente.orden_servicio = item.nueva_os;
                item.cliente.estado_pipeline = item.nuevo_estado;
                item.modificado = false;

            } catch (error) {
                console.error(`Error actualizando ${item.folio_buscado}:`, error);
                errores++;
            }
        }

        setProcesando(false);
        alert(`Guardado finalizado.\nExitosos: ${exito}\nErrores: ${errores}`);
        setResultados([...resultados]); // Refrescar vista
    };

    const generarReporte = () => {
        // Generar CSV simple
        const headers = ["Folio SIAC", "Orden Servicio", "Cliente", "Vendedor", "Estado", "Comisión Est."];
        const rows = resultados.filter(r => r.encontrado).map(r => [
            r.cliente.folio_siac,
            r.nueva_os,
            `${r.cliente.nombre} ${r.cliente.apellidos}`,
            r.cliente.user_id || 'Sin Asignar', // Idealmente necesitaríamos el nombre del vendedor, requeriría un join o fetch adicional.
            r.nuevo_estado,
            r.cliente.comision || 0
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardCheck className="text-telmex-blue" />
                    Auditoría Masiva de Folios
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel Lateral: Entrada */}
                <Card className="lg:col-span-1 p-4 h-fit">
                    <h3 className="font-semibold mb-2 text-sm text-gray-600">Pegar Folios SIAC</h3>
                    <textarea
                        className="w-full h-96 p-3 text-sm border border-gray-300 rounded-md font-mono focus:ring-2 focus:ring-telmex-blue focus:border-transparent"
                        placeholder="Pega aquí la lista de folios (uno por línea)..."
                        value={foliosInput}
                        onChange={(e) => setFoliosInput(e.target.value)}
                    />
                    <div className="mt-4 flex flex-col gap-2">
                        <Button
                            variant="primary"
                            className="w-full justify-center"
                            onClick={procesarFolios}
                            disabled={procesando || !foliosInput.trim()}
                        >
                            {procesando ? 'Procesando...' : 'Analizar Folios'}
                            <Search size={16} className="ml-2" />
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                            Detecta saltos de línea o comas
                        </p>
                    </div>
                </Card>

                {/* Área Principal: Resultados */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    {resultados.length > 0 && (
                        <Card className="p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-green-600 font-medium">
                                        <CheckCircle size={16} /> Encontrados: {resultados.filter(r => r.encontrado).length}
                                    </span>
                                    <span className="flex items-center gap-1 text-red-500 font-medium">
                                        <XCircle size={16} /> No Encontrados: {resultados.filter(r => !r.encontrado).length}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={generarReporte}>
                                        <Download size={14} className="mr-1" /> Exportar CSV
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={guardarCambios}>
                                        <Save size={14} className="mr-1" /> Guardar Cambios
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                        <tr>
                                            <th className="px-3 py-2">Folio SIAC</th>
                                            <th className="px-3 py-2">Cliente / Estado Actual</th>
                                            <th className="px-3 py-2">Orden Servicio (OS)</th>
                                            <th className="px-3 py-2">Nuevo Estado</th>
                                            <th className="px-3 py-2">Validar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {resultados.map((item, idx) => (
                                            <tr key={idx} className={!item.encontrado ? 'bg-red-50' : item.modificado ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                                <td className="px-3 py-2 font-mono">
                                                    {item.folio_buscado}
                                                    {!item.encontrado && (
                                                        <span className="block text-xs text-red-500">No existe en BD</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {item.encontrado ? (
                                                        <div>
                                                            <div className="font-medium text-gray-900">{item.cliente.nombre} {item.cliente.apellidos}</div>
                                                            <div className="text-xs text-gray-500">{item.cliente.estado_pipeline}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {item.encontrado ? (
                                                        <input
                                                            type="text"
                                                            className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-telmex-blue border-gray-300"
                                                            placeholder="Capturar OS..."
                                                            value={item.nueva_os}
                                                            onChange={(e) => actualizarFila(idx, 'nueva_os', e.target.value)}
                                                        />
                                                    ) : '-'}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {item.encontrado ? (
                                                        <select
                                                            className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-telmex-blue border-gray-300 bg-white"
                                                            value={item.nuevo_estado}
                                                            onChange={(e) => actualizarFila(idx, 'nuevo_estado', e.target.value)}
                                                        >
                                                            <option value="contactado">Contactado</option>
                                                            <option value="interesado">Interesado</option>
                                                            <option value="cierre_programado">Cierre Programado</option>
                                                            <option value="vendido">Vendido/Instalado</option>
                                                            <option value="sin_cobertura">Sin Cobertura</option>
                                                            <option value="perdido">Cancelado/Perdido</option>
                                                        </select>
                                                    ) : '-'}
                                                </td>

                                                <td className="px-3 py-2">
                                                    <div className="flex gap-1">
                                                        <a
                                                            href="https://siac-interac.telmex.com/siac_interactivo"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="SIAC Interactivo"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                        <a
                                                            href="https://portalwcex-2.telmex.com:4200/login"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                            title="Portal WCEX"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {resultados.length === 0 && !procesando && (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                            <ClipboardCheck size={48} className="mb-2 opacity-20" />
                            <p>Pega los folios a la izquierda y presiona "Analizar"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
