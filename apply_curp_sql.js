const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan variables de entorno de Supabase.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySql() {
    try {
        console.log('Aplicando migracion add_curp_columns.sql...');
        const curpSql = fs.readFileSync('add_curp_columns.sql', 'utf8');

        // Dividimos por punto y coma, ignorando los vacíos
        const statements = curpSql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (const stmt of statements) {
            console.log('---------------------------');
            console.log('Ejecutando:\n', stmt);
            const { error } = await supabase.rpc('exec_sql', { sql_string: stmt });
            if (error) {
                console.error(' Error en statement:', error.message);
                console.log(' Trataremos de continuar si es error de existencia...');
            } else {
                console.log(' Ok');
            }
        }

        console.log('Script finalizado');

    } catch (err) {
        console.error('Error general:', err);
    }
}

applySql();
