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

import * as XLSX from 'xlsx';

export default function AuditoriaPage() {
    const [user, setUser] = useState<any>(null);
    const [foliosInput, setFoliosInput] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [resultados, setResultados] = useState<any[]>([]);

    // Verificar sesión
    useState(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    });

    if (user && user.email !== 'infinitummisael@gmail.com') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center p-8 bg-white shadow-lg rounded-lg">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h1 className="text-xl font-bold text-gray-800">Acceso Restringido</h1>
                    <p className="text-gray-600 mt-2">No tienes permisos para ver el Portal de Auditoría.</p>
                </div>
            </div>
        );
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                // Leer como array de arrays para flexibilidad
                const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                // Extraer primera columna de cada fila (asumiendo que ahí están los folios)
                // Filtrar celdas vacías
                const folios = data
                    .flat() // Aplanar si hay múltiples columnas por error, o simplificar mapeo
                    .map(cell => String(cell).trim())
                    .filter(cell => cell.length > 0 && cell.toLowerCase() !== 'folio' && cell.toLowerCase() !== 'folios'); // Ignorar encabezados comunes

                if (folios.length > 0) {
                    setFoliosInput(prev => {
                        const existing = prev ? prev + '\n' : '';
                        return existing + folios.join('\n');
                    });
                    alert(`✅ Se cargaron ${folios.length} folios del archivo.`);
                } else {
                    alert("⚠️ No se encontraron datos válidos en el archivo.");
                }
            } catch (error) {
                console.error("Error leyendo archivo:", error);
                alert("❌ Error al procesar el archivo. Asegúrate que sea un Excel o CSV válido.");
            }
        };
        reader.readAsBinaryString(file);
    };

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
            // 2. Buscar en Supabase (Solo Lectura de Clientes)
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
                    // Campos para edición (Valores por defecto del cliente si existe)
                    nueva_os: cliente?.orden_servicio || '',
                    nuevo_estado: cliente?.estado_pipeline || 'vendido',
                    modificado: true // Marcar todos para guardar en el snapshot
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
        setResultados(nuevosResultados);
    };

    const guardarAuditoria = async () => {
        if (resultados.length === 0) return;

        if (!confirm(`¿Guardar auditoría con ${resultados.length} registros en el historial?\nEsto NO modifica la base de datos de clientes.`)) return;

        setProcesando(true);
        try {
            // 1. Crear registro maestro de Auditoría
            const totalComisiones = resultados.reduce((sum, item) => sum + (item.cliente?.comision || 0), 0);

            const { data: auditoria, error: errorAudit } = await supabase
                .from('auditorias')
                .insert({
                    nombre_lote: `Auditoría ${new Date().toLocaleString()}`,
                    total_registros: resultados.length,
                    total_comision: totalComisiones
                })
                .select()
                .single();

            if (errorAudit) throw errorAudit;
            if (!auditoria) throw new Error("No se pudo crear la auditoría");

            // 2. Crear detalles
            const detalles = resultados.map(item => ({
                auditoria_id: auditoria.id,
                folio_siac: item.folio_buscado,
                orden_servicio: item.nueva_os,
                estado_auditado: item.nuevo_estado,
                cliente_referencia_id: item.cliente?.id || null, // Link si existe
                vendedor_nombre: item.cliente?.user_id || 'No asignado',
                comision_calculada: item.cliente?.comision || 0
            }));

            const { error: errorDetalles } = await supabase
                .from('detalles_auditoria')
                .insert(detalles);

            if (errorDetalles) throw errorDetalles;

            alert("✅ Auditoría guardada correctamente en el historial.");

        } catch (error) {
            console.error("Error guardando auditoría:", error);
            alert("Error al guardar la auditoría. Asegúrate de haber ejecutado el script SQL.");
        } finally {
            setProcesando(false);
        }
    };

    const generarReporte = () => {
        // Generar CSV
        const headers = ["Folio SIAC", "Orden Servicio", "Cliente", "Vendedor", "Estado Auditado", "Comisión Est."];
        const rows = resultados.map(r => [
            r.folio_buscado,
            r.nueva_os,
            r.encontrado ? `${r.cliente.nombre} ${r.cliente.apellidos}` : 'NO ENCONTRADO',
            r.encontrado ? (r.cliente.user_id || 'Sin Asignar') : '-',
            r.nuevo_estado,
            r.encontrado ? (r.cliente.comision || 0) : 0
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `nomina_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardCheck className="text-telmex-blue" />
                        PORTAL AUDITORIA MASIVA Y NOMINAS
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Usuario Autorizado: <span className="font-mono text-telmex-blue">{user?.email}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel Lateral: Entrada */}
                <Card className="lg:col-span-1 p-4 h-fit">
                    <h3 className="font-semibold mb-2 text-sm text-gray-600">Pegar Folios SIAC</h3>

                    {/* Input de Archivo */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cargar Excel / CSV</label>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            className="block w-full text-xs text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-telmex-blue file:text-white
                                hover:file:bg-blue-700
                            "
                        />
                        <p className="text-xs text-gray-400 mt-1">Soporta .xlsx, .xls, .csv</p>
                    </div>

                    <textarea
                        className="w-full h-80 p-3 text-sm border border-gray-300 rounded-md font-mono focus:ring-2 focus:ring-telmex-blue focus:border-transparent"
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
                                        <Download size={14} className="mr-1" /> Exportar Nómina
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={guardarAuditoria}>
                                        <Save size={14} className="mr-1" /> Guardar Auditoría
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                        <tr>
                                            <th className="px-3 py-2">Folio SIAC</th>
                                            <th className="px-3 py-2">Cliente en BD</th>
                                            <th className="px-3 py-2">Orden Servicio (OS)</th>
                                            <th className="px-3 py-2">Estatus</th>
                                            <th className="px-3 py-2">Validar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {resultados.map((item, idx) => (
                                            <tr key={idx} className={!item.encontrado ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                                <td className="px-3 py-2 font-mono">
                                                    {item.folio_buscado}
                                                    {!item.encontrado && (
                                                        <span className="block text-xs text-red-500">No existe</span>
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
                                                    <input
                                                        type="text"
                                                        className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-telmex-blue border-gray-300"
                                                        placeholder="Capturar OS..."
                                                        value={item.nueva_os}
                                                        onChange={(e) => actualizarFila(idx, 'nueva_os', e.target.value)}
                                                    />
                                                </td>

                                                <td className="px-3 py-2">
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
                                                </td>

                                                <td className="px-3 py-2">
                                                    <div className="flex gap-1">
                                                        <a
                                                            href="https://siac-interac.telmex.com/siac_interactivo"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="SIAC"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                        <a
                                                            href="https://portalwcex-2.telmex.com:4200/login"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                            title="WCEX"
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
                            <p>Bienvenido al Portal de Auditoría.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
