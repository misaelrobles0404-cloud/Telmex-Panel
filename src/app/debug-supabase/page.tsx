'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DebugSupabasePage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const runDiscovery = async () => {
        setLoading(true);
        setResults([]);
        const newResults = [];

        // 1. Fetch any record from campanas
        try {
            const { data, error } = await supabase.from('campanas').select('*').limit(1);
            if (error) {
                newResults.push({ name: 'Fetch campanas', success: false, error: error.message, details: error });
            } else if (data && data.length > 0) {
                newResults.push({ name: 'Fetch campanas', success: true, details: { columns: Object.keys(data[0]), sample: data[0] } });
            } else {
                newResults.push({ name: 'Fetch campanas', success: true, details: 'No records found to inspect columns.' });
            }
        } catch (e: any) {
            newResults.push({ name: 'Fetch campanas', success: false, error: e.message });
        }

        // 2. Fetch any record from clientes
        try {
            const { data, error } = await supabase.from('clientes').select('*').limit(1);
            if (error) {
                newResults.push({ name: 'Fetch clientes', success: false, error: error.message, details: error });
            } else if (data && data.length > 0) {
                newResults.push({ name: 'Fetch clientes', success: true, details: { columns: Object.keys(data[0]), sample: data[0] } });
            } else {
                newResults.push({ name: 'Fetch clientes', success: true, details: 'No records found to inspect columns.' });
            }
        } catch (e: any) {
            newResults.push({ name: 'Fetch clientes', success: false, error: e.message });
        }

        // 3. Try "Blind" Minimal Insert into campanas (only title and user_id)
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('campanas').insert([{
                    id: crypto.randomUUID(),
                    titulo: 'Minimal Test',
                    user_id: user.id
                }]);
                newResults.push({ name: 'Minimal Insert (id, titulo, user_id)', success: !error, error: error?.message, details: error });
            } else {
                newResults.push({ name: 'Minimal Insert', success: false, error: 'No user session' });
            }
        } catch (e: any) {
            newResults.push({ name: 'Minimal Insert', success: false, error: e.message });
        }

        setResults(newResults);
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Supabase Structure Discovery</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-gray-600">Este herramienta intentará leer los nombres de las columnas reales de tu base de datos.</p>
                    <Button onClick={runDiscovery} disabled={loading}>
                        {loading ? 'Descubrir Columnas' : 'Descubrir Columnas'}
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
                            <pre className="text-xs mt-2 overflow-auto bg-white/50 p-2 rounded max-h-60">
                                {JSON.stringify(res.details || res.error, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
