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

// Interfaz para los resultados de la auditoría
interface ResultadoAuditoria {
    folio_buscado: string;
    encontrado: boolean;
    cliente: any | null; // Cliente de BD

    // Datos del Excel
    promotor_excel?: string;
    estatus_excel?: string;
    tipo_servicio_excel?: string;

    // Datos para edición/guardado
    nueva_os: string;
    nuevo_estado: string; // Estado final a guardar (auditoría)
}

export default function AuditoriaPage() {
    const [user, setUser] = useState<any>(null);
    const [foliosInput, setFoliosInput] = useState(''); // Mantiene compatibilidad con pegado manual
    const [datosExcel, setDatosExcel] = useState<any[]>([]); // Almacena datos crudos del Excel
    const [procesando, setProcesando] = useState(false);
    const [resultados, setResultados] = useState<ResultadoAuditoria[]>([]);

    // Verificar sesión
    useState(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    });

    const isAdmin = user?.email === 'misaelrobles0404@gmail.com' || user?.email === 'ruizmosinfinitum2025@gmail.com';

    if (user && !isAdmin) {
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

                // Leer como matriz para detectar columnas
                const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length === 0) {
                    alert("El archivo está vacío.");
                    return;
                }

                // 1. Detectar dinámicamente la fila de encabezados
                let headerRowIdx = -1;
                for (let i = 0; i < Math.min(data.length, 10); i++) { // Buscar en las primeras 10 filas
                    const rowStr = data[i].map(c => String(c).toUpperCase()).join(' ');
                    if (rowStr.includes('FOLIO') || rowStr.includes('SIAC')) {
                        headerRowIdx = i;
                        break;
                    }
                }

                // Si no se encuentra cabecera, usar fila 0
                if (headerRowIdx === -1) headerRowIdx = 0;

                const headers = data[headerRowIdx].map((h: string) => String(h).toUpperCase().trim());

                // 2. Buscar índices de columnas
                let idxFolio = headers.findIndex((h) => h.includes('FOLIO') || h.includes('SIAC'));
                let idxPromotor = headers.findIndex((h) => h.includes('PROMOTOR') || h.includes('VENDEDOR') || h.includes('USUARIO') || h.includes('EMPLEADO'));
                let idxEstatus = headers.findIndex((h) => h.includes('ESTATUS') || h.includes('ESTADO') || h.includes('RESULTADO'));
                let idxTipo = headers.findIndex((h) => h.includes('TIPO') || h.includes('SERVICIO'));

                // Fallbacks si no hay cabeceras claras
                if (idxFolio === -1) idxFolio = 0; // Asumir primera columna es folio
                if (idxPromotor === -1 && data[headerRowIdx].length > 1) idxPromotor = 1;
                if (idxEstatus === -1 && data[headerRowIdx].length > 2) idxEstatus = 2;
                if (idxTipo === -1 && data[headerRowIdx].length > 3) idxTipo = 3;

                // 3. Extraer datos
                const extractedData = data.slice(headerRowIdx + 1).map(row => {
                    const folioRaw = row[idxFolio];
                    if (!folioRaw) return null;

                    return {
                        folio: String(folioRaw).trim(),
                        promotor: idxPromotor !== -1 ? String(row[idxPromotor] || '').trim() : '',
                        estatus: idxEstatus !== -1 ? String(row[idxEstatus] || '').trim() : '',
                        tipo: idxTipo !== -1 ? String(row[idxTipo] || '').trim() : ''
                    };
                }).filter(r => r !== null && r.folio.length > 0 && r.folio !== 'FOLIO'); // Filtrar vacíos

                if (extractedData.length > 0) {
                    // Actualizar estado y procesar automátiamente
                    setDatosExcel(extractedData);
                    setFoliosInput(extractedData.map(d => d!.folio).join('\n')); // Solo visual

                    // PROCESAR DIRECTAMENTE
                    procesarDatos(extractedData);
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

    const procesarDatos = async (datosOrigen: any[]) => {
        setProcesando(true);
        setResultados([]);

        // Preparar lista de folios y mapa
        const listaFolios = datosOrigen.map(d => d.folio);
        const mapaExcel: Record<string, any> = {};
        datosOrigen.forEach(d => { mapaExcel[d.folio] = d; });

        if (listaFolios.length === 0) {
            setProcesando(false);
            return;
        }

        try {
            // Buscar en Supabase
            const { data: clientesEncontrados, error } = await supabase
                .from('clientes')
                .select('*')
                .in('folio_siac', listaFolios);

            if (error) throw error;

            // Cruzar resultados
            const procesados: ResultadoAuditoria[] = listaFolios.map(folio => {
                const cliente = clientesEncontrados?.find((c: any) => c.folio_siac === folio);
                const datoExcel = mapaExcel[folio] || {};

                // Normalizar Estatus
                let estadoSugerido = cliente?.estado_pipeline || 'vendido';
                if (datoExcel.estatus) {
                    const statusLower = datoExcel.estatus.toLowerCase();
                    if (statusLower.includes('instalad') || statusLower.includes('liquid')) estadoSugerido = 'vendido';
                    else if (statusLower.includes('cancel') || statusLower.includes('rechaz') || statusLower.includes('baja') || statusLower.includes('dev')) estadoSugerido = 'sin_cobertura';
                }

                return {
                    folio_buscado: folio,
                    encontrado: !!cliente,
                    cliente: cliente || null,

                    promotor_excel: datoExcel.promotor,
                    estatus_excel: datoExcel.estatus,
                    tipo_servicio_excel: datoExcel.tipo,

                    nueva_os: cliente?.orden_servicio || '',
                    nuevo_estado: estadoSugerido
                };
            });

            setResultados(procesados);

        } catch (error) {
            console.error("Error al procesar:", error);
            alert("Error consultando la base de datos.");
        } finally {
            setProcesando(false);
        }
    };

    const procesarDesdeInputManual = () => {
        const rawFolios = foliosInput.split(/[\n,]+/).map(f => f.trim()).filter(f => f.length > 0);
        if (rawFolios.length === 0) {
            alert("Ingresa folios manualmente o carga un archivo.");
            return;
        }
        // Convertir a estructura estandar
        const datos = rawFolios.map(f => ({ folio: f, promotor: '', estatus: '', tipo: '' }));
        procesarDatos(datos);
    };

    const actualizarFila = (index: number, campo: keyof ResultadoAuditoria, valor: string) => {
        const nuevosResultados = [...resultados];
        (nuevosResultados[index] as any)[campo] = valor;
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
                comision_calculada: item.cliente?.comision || 0,
                // Nuevos campos
                promotor: item.promotor_excel || null,
                tipo_servicio: item.tipo_servicio_excel || null
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
        const headers = ["Folio SIAC", "Orden Servicio", "Cliente", "Vendedor", "Promotor Excel", "Tipo Servicio", "Estatus Excel", "Estado Auditado", "Comisión Est."];
        const rows = resultados.map(r => [
            r.folio_buscado,
            r.nueva_os,
            r.encontrado ? `${r.cliente.nombre} ${r.cliente.apellidos}` : 'NO ENCONTRADO',
            r.encontrado ? (r.cliente.user_id || 'Sin Asignar') : '-',
            r.promotor_excel || '-',
            r.tipo_servicio_excel || '-',
            r.estatus_excel || '-',
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
                            onClick={procesarDesdeInputManual}
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
                                            <th className="px-3 py-2">Info Excel</th>
                                            <th className="px-3 py-2">Cliente en BD</th>
                                            <th className="px-3 py-2">Orden Servicio (OS)</th>
                                            <th className="px-3 py-2">Estatus</th>
                                            <th className="px-3 py-2">Validar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {resultados.map((item, idx) => (
                                            <tr key={idx} className={!item.encontrado ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                                <td className="px-3 py-2 font-mono align-top text-xs">
                                                    <div className="font-bold text-gray-700">{item.folio_buscado}</div>
                                                    {!item.encontrado && (
                                                        <span className="text-red-500 font-semibold text-[10px]">No existe en BD</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 align-top">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {item.promotor_excel && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold text-gray-500">Prom:</span>
                                                                <span className="text-gray-800">{item.promotor_excel}</span>
                                                            </div>
                                                        )}
                                                        {item.tipo_servicio_excel && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold text-gray-500">Tipo:</span>
                                                                <span className="text-blue-600 truncate max-w-[100px]" title={item.tipo_servicio_excel}>{item.tipo_servicio_excel}</span>
                                                            </div>
                                                        )}
                                                        {item.estatus_excel && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold text-gray-500">Estado:</span>
                                                                <span className={`px-1 rounded ${item.estatus_excel.toLowerCase().includes('instalad') ? 'bg-green-100 text-green-700' :
                                                                    item.estatus_excel.toLowerCase().includes('cancel') ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                                                                    }`}>
                                                                    {item.estatus_excel}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!item.promotor_excel && !item.tipo_servicio_excel && !item.estatus_excel && (
                                                            <span className="text-gray-400 italic">- Sin datos extra -</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-3 py-2 align-top">
                                                    {item.encontrado ? (
                                                        <div className="text-xs">
                                                            <div className="font-bold text-gray-900">{item.cliente.nombre} {item.cliente.apellidos}</div>
                                                            <div className="text-gray-500">{item.cliente.user_id || 'Sin Vendedor'}</div>
                                                            <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold border ${item.cliente.estado_pipeline === 'vendido' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                                }`}>
                                                                {item.cliente.estado_pipeline}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 align-top">
                                                    <input
                                                        type="text"
                                                        className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-telmex-blue border-gray-300"
                                                        placeholder="Capturar OS..."
                                                        value={item.nueva_os}
                                                        onChange={(e) => actualizarFila(idx, 'nueva_os', e.target.value)}
                                                    />
                                                </td>

                                                <td className="px-3 py-2 align-top">
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
                                                        <option value="cobertura_cobre">Cobertura Cobre</option>
                                                    </select>
                                                </td>

                                                <td className="px-3 py-2 align-top">
                                                    <div className="flex gap-1 justify-end">
                                                        <a
                                                            href="https://siac-interac.telmex.com/siac_interactivo"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                                                            title="SIAC"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                        <a
                                                            href="https://portalwcex-2.telmex.com:4200/login"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded border border-purple-200"
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

