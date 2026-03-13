
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zcoezrnswnjzmsvozjc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjb2V6cm5zd25qc3ptc3ZvempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mzg5OTMsImV4cCI6MjA4NjAxNDk5M30.rNO7-ZrqlWFHORrg8pJBPysvvwj_jV6Vf8dpakeNPeE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listTables() {
    // We can't list tables directly with the client easily without RPC or querying pg_catalog (which anon usually can't)
    // But we can try to query 'clientes' which we know exists.
    const { data, error } = await supabase.from('clientes').select('id').limit(1);
    console.log('Query a clientes:', { data, error });

    const { data: data2, error: error2 } = await supabase.from('solicitudes_documentos').select('id').limit(1);
    console.log('Query a solicitudes_documentos:', { data: data2, error: error2 });
}

listTables();
