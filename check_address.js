const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zcoezrnswnjzmsvozjc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjb2V6cm5zd25qc3ptc3ZvempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mzg5OTMsImV4cCI6MjA4NjAxNDk5M30.rNO7-ZrqlWFHORrg8pJBPysvvwj_jV6Vf8dpakeNPeE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    const { data: sol, error: err1 } = await supabase
        .from('solicitudes_documentos')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(3);
    
    console.log("=== ULTIMAS 3 SOLICITUDES ===");
    sol.forEach(s => {
        console.log(`ID: ${s.id}, ClienteID: ${s.cliente_id}, Calle: ${s.calle}, Estado: ${s.estado}`);
    });

    if (sol && sol.length > 0) {
        const cIds = sol.map(s => s.cliente_id).filter(Boolean);
        if (cIds.length > 0) {
            const { data: cli, error: err2 } = await supabase
                .from('clientes')
                .select('id, nombre, calle, numero_exterior, colonia, mz, lt')
                .in('id', cIds);
            
            console.log("\n=== SUS CLIENTES CORRESPONDIENTES ===");
            console.log(cli);
        }
    }
}
check();
