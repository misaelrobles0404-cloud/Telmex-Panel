'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Documento, TipoDocumento } from '@/types';
import { Upload, FileText, X, Check, Eye } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';

interface DocumentManagerProps {
    clienteId: string;
    documentos: Documento[];
    onDocumentosChange: (nuevosDocumentos: Documento[]) => void;
}

export function DocumentManager({ clienteId, documentos, onDocumentosChange }: DocumentManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDocumento | ''>('');
    const [uploading, setUploading] = useState(false);

    // Tipos de documentos requeridos
    const tiposRequeridos: { tipo: TipoDocumento; etiqueta: string }[] = [
        { tipo: 'ine', etiqueta: 'INE / Identificación' },
        { tipo: 'curp', etiqueta: 'CURP' },
        { tipo: 'comprobante_domicilio', etiqueta: 'Comprobante de Domicilio' },
        { tipo: 'formato_portabilidad', etiqueta: 'Formato de Portabilidad' },
        { tipo: 'estado_cuenta', etiqueta: 'Estado de Cuenta (Megacable)' },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !tipoSeleccionado) return;

        setUploading(true);

        const file = e.target.files[0];

        // Simular carga de archivo
        setTimeout(() => {
            const nuevoDoc: Documento = {
                id: Date.now().toString(),
                clienteId,
                tipo: tipoSeleccionado as TipoDocumento,
                nombre: file.name,
                url: URL.createObjectURL(file), // URL temporal local
                fechaSubida: new Date().toISOString(),
                validado: false
            };

            onDocumentosChange([...documentos, nuevoDoc]);
            setUploading(false);
            setTipoSeleccionado('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1500);
    };

    const eliminarDocumento = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este documento?')) {
            onDocumentosChange(documentos.filter(d => d.id !== id));
        }
    };

    const validarDocumento = (id: string) => {
        const docsActualizados = documentos.map(d =>
            d.id === id ? { ...d, validado: !d.validado } : d
        );
        onDocumentosChange(docsActualizados);
    };

    return (
        <div className="space-y-6">
            {/* Área de Carga */}
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <div className="max-w-md mx-auto">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Subir nuevo documento</h3>

                    <div className="mt-4 flex flex-col gap-3">
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-telmex-blue focus:ring-telmex-blue sm:text-sm p-2 border"
                            value={tipoSeleccionado}
                            onChange={(e) => setTipoSeleccionado(e.target.value as TipoDocumento)}
                        >
                            <option value="">Selecciona el tipo de documento...</option>
                            {tiposRequeridos.map(t => (
                                <option key={t.tipo} value={t.tipo}>{t.etiqueta}</option>
                            ))}
                            <option value="otro">Otro</option>
                        </select>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={!tipoSeleccionado || uploading}
                        />

                        <Button
                            variant="primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!tipoSeleccionado || uploading}
                            loading={uploading}
                            className="w-full"
                        >
                            {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                        </Button>
                        <p className="text-xs text-gray-500">PDF, JPG o PNG hasta 10MB</p>
                    </div>
                </div>
            </div>

            {/* Lista de Documentos */}
            <div className="grid grid-cols-1 gap-4">
                {documentos.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay documentos subidos aún.</p>
                ) : (
                    documentos.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${doc.validado ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-telmex-blue'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{doc.nombre}</h4>
                                        <div className="flex gap-2 text-xs text-gray-500">
                                            <span>{tiposRequeridos.find(t => t.tipo === doc.tipo)?.etiqueta || 'Otro'}</span>
                                            <span>•</span>
                                            <span>{formatearFecha(doc.fechaSubida)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-500 hover:text-telmex-blue"
                                        title="Ver"
                                        onClick={() => window.open(doc.url, '_blank')}
                                    >
                                        <Eye size={18} />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`${doc.validado ? 'text-success' : 'text-gray-400 hover:text-success'}`}
                                        title={doc.validado ? "Invalidar" : "Validar"}
                                        onClick={() => validarDocumento(doc.id)}
                                    >
                                        <Check size={18} />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-400 hover:text-error"
                                        title="Eliminar"
                                        onClick={() => eliminarDocumento(doc.id)}
                                    >
                                        <X size={18} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
