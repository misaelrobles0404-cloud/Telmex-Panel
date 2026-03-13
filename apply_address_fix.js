
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://zcoezrnswnjzmsvozjc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjb2V6cm5zd25qc3ptc3ZvempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mzg5OTMsImV4cCI6MjA4NjAxNDk5M30.rNO7-ZrqlWFHORrg8pJBPysvvwj_jV6Vf8dpakeNPeE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applySql() {
    try {
        console.log('Leyendo update_address_system.sql...');
        const sql = fs.readFileSync('update_address_system.sql', 'utf8');

        // Intentar ejecutar por bloques para evitar errores de sintaxis en el split
        // El trigger tiene punto y coma internos, así que el split simple por ; fallará.
        // Ejecutaremos el bloque completo si es posible, o por partes lógicas.

        console.log('Ejecutando SQL...');
        const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            console.error('Error al aplicar SQL:', error);
            console.log('Si el error es "Type error: fetch failed", es por restricciones de red.');
            console.log('Por favor, aplica el contenido de update_address_system.sql manualmente en el SQL Editor de Supabase.');
        } else {
            console.log('SQL aplicado correctamente.');
        }

    } catch (err) {
        console.error('Error general:', err);
    }
}

applySql();
