
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zcoezrnswnjzmsvozjc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjb2V6cm5zd25qc3ptc3ZvempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mzg5OTMsImV4cCI6MjA4NjAxNDk5M30.rNO7-ZrqlWFHORrg8pJBPysvvwj_jV6Vf8dpakeNPeE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findData() {
    console.log('Buscando datos de Gabino Lopez Sandoval...');
    const { data: sols, error: solError } = await supabase
        .from('solicitudes_documentos')
        .select('*')
        .ilike('nombre_cliente', '%GABINO%')
        .order('creado_en', { ascending: false });

    if (solError) {
        console.error('Error en solicitudes:', solError);
    } else {
        console.log('Resultados en solicitudes_documentos:');
        console.log(JSON.stringify(sols, null, 2));
    }
}

findData();
