'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DebugSupabasePage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        setResults([]);
        const newResults = [];

        // Test 1: Simple insert into campanas with camelCase
        try {
            const { data, error } = await supabase
                .from('campanas')
                .insert([{
                    id: `test-camel-${Date.now()}`,
                    titulo: 'Test CamelCase',
                    plataforma: 'facebook',
                    fechaPublicacion: new Date().toISOString().slice(0, 10),
                    presupuesto: 0,
                    leadsGenerados: 0,
                    activa: false
                }]);
            newResults.push({ name: 'Test 1: campanas (camelCase)', success: !error, error: error?.message, details: error });
        } catch (e: any) {
            newResults.push({ name: 'Test 1: campanas (camelCase)', success: false, error: e.message });
        }

        // Test 2: Simple insert into campanas with snake_case
        try {
            const { data, error } = await supabase
                .from('campanas')
                .insert([{
                    id: `test-snake-${Date.now()}`,
                    titulo: 'Test SnakeCase',
                    plataforma: 'facebook',
                    fecha_publicacion: new Date().toISOString().slice(0, 10),
                    presupuesto: 0,
                    leads_generados: 0,
                    activa: false
                }]);
            newResults.push({ name: 'Test 2: campanas (snake_case)', success: !error, error: error?.message, details: error });
        } catch (e: any) {
            newResults.push({ name: 'Test 2: campanas (snake_case)', success: false, error: e.message });
        }

        // Test 3: Check if id must be UUID
        try {
            const testId = crypto.randomUUID();
            const { data, error } = await supabase
                .from('campanas')
                .insert([{
                    id: testId,
                    titulo: 'Test UUID',
                    plataforma: 'facebook',
                    leadsGenerados: 0,
                    activa: false
                }]);
            newResults.push({ name: 'Test 3: campanas (UUID id)', success: !error, error: error?.message, details: error });
        } catch (e: any) {
            newResults.push({ name: 'Test 3: campanas (UUID id)', success: false, error: e.message });
        }

        // Test 4: session check
        const { data: { user } } = await supabase.auth.getUser();
        newResults.push({ name: 'Test 4: User Session', success: !!user, details: user ? `User ID: ${user.id}` : 'No user found' });

        setResults(newResults);
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Supabase Diagnostic Tool</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-gray-600">Este herramienta ejecutará pruebas de inserción para detectar qué formato de columnas espera tu base de datos.</p>
                    <Button onClick={runTests} disabled={loading}>
                        {loading ? 'Ejecutando...' : 'Ejecutar Pruebas'}
                    </Button>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {results.map((res, i) => (
                    <Card key={i} className={res.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <CardContent className="p-4">
                            <h3 className="font-bold flex items-center gap-2">
                                {res.success ? '✅' : '❌'} {res.name}
                            </h3>
                            {res.error && <p className="text-sm text-red-600 mt-1">Error: {res.error}</p>}
                            <pre className="text-xs mt-2 overflow-auto bg-white/50 p-2 rounded">
                                {JSON.stringify(res.details || res.error, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
